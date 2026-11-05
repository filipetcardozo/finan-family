import dayjs from 'dayjs';
import React from 'react';
import { IRevenue } from '../providers/revenues/types';
import { useMemo, useContext, useRef } from 'react';
import { deleteRevenue } from '../providers/revenues/services';
import { useMonthlyTransactions } from '../hooks/useMonthlyTransactions';
import { MonthSelectedContext } from './monthSelected';
import { useAuth } from '../hooks/useAuth';

interface ContextType {
  loadingGetRevenues: boolean;
  revenues: IRevenue[] | [];
  monthlyRevenues: number;
  handleUpdateRevenue: (newRevenue: IRevenue) => void;
  handleDeleteRevenue: (revenueId: string) => Promise<void>;
  handleAddRevenue: (newRevenue: IRevenue) => void;
  handleAddRevenues: (newRevenues: IRevenue[]) => void;
  expensesOfDay: IRevenue[] | [];
}

const defaultState = {
  loadingGetRevenues: true,
  revenues: [],
  monthlyRevenues: 0,
  handleUpdateRevenue: (newRevenue: IRevenue) => { },
  handleDeleteRevenue: async (revenueId: string) => { },
  handleAddRevenue: (newRevenue: IRevenue) => { },
  handleAddRevenues: (newRevenues: IRevenue[]) => { },
  expensesOfDay: []
}

export const RevenuesContext = React.createContext<ContextType>(defaultState);

export const RevenuesProvider = ({ children }: any) => {
  const { uid, isLogged } = useAuth();

  const { dateToAnalyze, ready } = useContext(MonthSelectedContext);
  const { entries: revenues, updateEntries: setRevenues, loading: loadingGetRevenues } = useMonthlyTransactions<IRevenue>('revenues', uid, dateToAnalyze.format('MM/YYYY'), isLogged === true && ready);
  const selectedMonthRef = useRef(dateToAnalyze.format('MM/YYYY'));
  selectedMonthRef.current = dateToAnalyze.format('MM/YYYY');

  const monthlyRevenues = useMemo(() => {
    let totalRevenues = 0;
    if (revenues.length > 0) {
      revenues.forEach(v => {
        if (v.value && v.addDate) totalRevenues += v.value;
      })
    }

    return totalRevenues;
  }, [revenues])

  const expensesOfDay = useMemo(() => {
    if (revenues) {
      return [...revenues].filter(v => {
        if (v.addDate?.format('DD/MM/YYYY') === dayjs().format('DD/MM/YYYY')) {
          return true;
        }
      })
    } else {
      return [];
    }
  }, [revenues])

  const handleUpdateRevenue = (newRevenue: IRevenue) => {
    setRevenues(previous => [...previous.filter(revenue => revenue.id !== newRevenue.id),
      ...(newRevenue.addDateFormatted === selectedMonthRef.current ? [newRevenue] : [])]);
  }

  const handleDeleteRevenue = async (revenueId: string) => {
    if (revenues.some(revenue => revenue.id === revenueId && revenue.pendingSync)) throw new Error('Aguarde a sincronização para excluir.');
    await deleteRevenue(revenueId)
    setRevenues(previous => previous.filter(revenue => revenue.id !== revenueId));
  }

  const handleAddRevenues = (newRevenues: IRevenue[]) => {
    setRevenues(previous => {
      const additions = newRevenues.filter(revenue => !revenue.pendingSync && revenue.addDateFormatted === selectedMonthRef.current);
      const merged = new Map(previous.map(revenue => [revenue.id, revenue]));
      additions.forEach(revenue => merged.set(revenue.id, revenue));
      return Array.from(merged.values());
    });
  };

  const handleAddRevenue = (newRevenue: IRevenue) => handleAddRevenues([newRevenue]);

  return (
    <RevenuesContext.Provider value={{
      loadingGetRevenues,
      revenues,
      monthlyRevenues,
      handleUpdateRevenue,
      handleDeleteRevenue,
      handleAddRevenue,
      handleAddRevenues,
      expensesOfDay
    }}>
      {children}
    </RevenuesContext.Provider>
  );
};
