import dayjs, { Dayjs } from 'dayjs';
import React, { Context } from 'react';
import { useRouter } from 'next/router';

interface ContextType {
    dateToAnalyze: Dayjs;
    ready: boolean;
    handlePreviousMonth(): void;
    handleNextMonth(): void;
}

export const MonthSelectedContext: Context<ContextType> = React.createContext<ContextType>({
    dateToAnalyze: dayjs(new Date()),
    ready: false,
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

    const [defaultMonth] = React.useState(() => dayjs().startOf('month').locale('pt-BR'));
    const monthQueryValue = getMonthQueryValue(router.query.month);
    // Read the URL during render: don't briefly load the current month before
    // an effect applies the month the user actually opened.
    const dateToAnalyze = React.useMemo(() => parseMonthFromQuery(monthQueryValue) ?? defaultMonth, [monthQueryValue, defaultMonth]);
    const navigationMonth = React.useRef(dateToAnalyze);
    React.useEffect(() => { navigationMonth.current = dateToAnalyze; }, [dateToAnalyze]);

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

        const parsedMonth = parseMonthFromQuery(monthQueryValue);
        if (!parsedMonth) syncMonthToUrl(dateToAnalyze);
    }, [router.isReady, monthQueryValue, syncMonthToUrl, dateToAnalyze]);

    const handlePreviousMonth = () => {
        navigationMonth.current = navigationMonth.current.subtract(1, 'month');
        syncMonthToUrl(navigationMonth.current);
    };

    const handleNextMonth = () => {
        navigationMonth.current = navigationMonth.current.add(1, 'month');
        syncMonthToUrl(navigationMonth.current);
    };

    return (
        <MonthSelectedContext.Provider value={{ dateToAnalyze, ready: router.isReady, handlePreviousMonth, handleNextMonth }}>
            {children}
        </MonthSelectedContext.Provider>
    );
};
