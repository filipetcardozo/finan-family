import dayjs, { Dayjs } from 'dayjs';
import React, { Context } from 'react';

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

export const MonthSelectedProvider = ({ children }: any) => {
    const [dateToAnalyze, setDateToAnalyze] = React.useState(dayjs(new Date()).locale('pt-BR'));

    const handlePreviousMonth = () => {
        setDateToAnalyze(dateToAnalyze.add(-1, 'M'))
    };

    const handleNextMonth = () => {
        setDateToAnalyze(dateToAnalyze.add(1, 'M'))
    };

    return (
        <MonthSelectedContext.Provider value={{ dateToAnalyze, handlePreviousMonth, handleNextMonth }}>
            {children}
        </MonthSelectedContext.Provider>
    );
};