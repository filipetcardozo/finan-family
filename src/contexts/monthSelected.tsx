import dayjs, { Dayjs } from 'dayjs';
import React, { Context } from 'react';
import { useRouter } from 'next/router';

interface ContextType {
    dateToAnalyze: Dayjs;
    handlePreviousMonth(): void;
    handleNextMonth(): void;
}

export const MonthSelectedContext: Context<ContextType> = React.createContext({
    dateToAnalyze: dayjs(new Date()),
    handlePreviousMonth: () => { },
    handleNextMonth: () => { }
});

const getMonthQueryValue = (monthQuery: string | string[] | undefined): string | undefined => {
    if (Array.isArray(monthQuery)) {
        return monthQuery[0];
    }

    return monthQuery;
};

const parseMonthFromQuery = (monthQuery: string | undefined): Dayjs | null => {
    if (!monthQuery) {
        return null;
    }

    const monthPattern = /^(\d{4})-(\d{2})$/;
    const parsedMonth = monthQuery.match(monthPattern);

    if (!parsedMonth) {
        return null;
    }

    const year = Number(parsedMonth[1]);
    const month = Number(parsedMonth[2]);

    if (month < 1 || month > 12) {
        return null;
    }

    return dayjs(new Date(year, month - 1, 1)).locale('pt-BR');
};

const formatMonthToQuery = (date: Dayjs): string => {
    return date.format('YYYY-MM');
};

export const MonthSelectedProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const [dateToAnalyze, setDateToAnalyze] = React.useState(dayjs(new Date()).locale('pt-BR'));

    const syncMonthToUrl = React.useCallback((date: Dayjs) => {
        if (!router.isReady) {
            return;
        }

        const nextMonth = formatMonthToQuery(date);
        const currentMonthQuery = getMonthQueryValue(router.query.month);

        if (currentMonthQuery === nextMonth) {
            return;
        }

        router.replace(
            {
                pathname: router.pathname,
                query: { ...router.query, month: nextMonth }
            },
            undefined,
            { shallow: true }
        );
    }, [router]);

    React.useEffect(() => {
        if (!router.isReady) {
            return;
        }

        const monthQueryValue = getMonthQueryValue(router.query.month);
        const parsedMonth = parseMonthFromQuery(monthQueryValue);

        if (parsedMonth) {
            if (!parsedMonth.isSame(dateToAnalyze, 'month')) {
                setDateToAnalyze(parsedMonth);
            }
            return;
        }

        syncMonthToUrl(dateToAnalyze);
    }, [router.isReady, router.query.month, syncMonthToUrl]);

    const handlePreviousMonth = () => {
        setDateToAnalyze((previousDate) => {
            const previousMonth = previousDate.add(-1, 'M');
            syncMonthToUrl(previousMonth);
            return previousMonth;
        });
    };

    const handleNextMonth = () => {
        setDateToAnalyze((previousDate) => {
            const nextMonth = previousDate.add(1, 'M');
            syncMonthToUrl(nextMonth);
            return nextMonth;
        });
    };

    return (
        <MonthSelectedContext.Provider value={{ dateToAnalyze, handlePreviousMonth, handleNextMonth }}>
            {children}
        </MonthSelectedContext.Provider>
    );
};
