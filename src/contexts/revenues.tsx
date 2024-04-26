import dayjs from 'dayjs';
import React from 'react';
import { IRevenue } from '../providers/revenues/types';
import { useMemo, useState, useEffect, useContext } from 'react';
import { deleteRevenue, getUserRevenues } from '../providers/revenues/services';
import { MonthSelectedContext } from './monthSelected';
import { useAuth } from '../hooks/useAuth';

interface ContextType {
  loadingGetRevenues: boolean;
  revenues: IRevenue[] | [];
  monthlyRevenues: number;
  handleUpdateRevenue: (newRevenue: IRevenue) => void;
  handleDeleteRevenue: (revenueId: string) => Promise<void>;
  handleAddRevenue: (newRevenue: IRevenue) => void;
  expensesOfDay: IRevenue[] | [];
}

const defaultState = {
  loadingGetRevenues: true,
  revenues: [],
  monthlyRevenues: 0,
  handleUpdateRevenue: (newRevenue: IRevenue) => { },
  handleDeleteRevenue: async (revenueId: string) => { },
  handleAddRevenue: (newRevenue: IRevenue) => { },
  expensesOfDay: []
}

export const RevenuesContext = React.createContext<ContextType>(defaultState);

export const RevenuesProvider = ({ children }: any) => {
  const { uid } = useAuth();

  const [revenues, setRevenues] = useState<IRevenue[]>([]);
  const [loadingGetRevenues, setLoadingGetRevenues] = useState(true);

  const { dateToAnalyze } = useContext(MonthSelectedContext);

  useEffect(() => {
    if (uid) {
      setLoadingGetRevenues(true);
      getUserRevenues(uid, dateToAnalyze.format('MM/YYYY').toString())
        .then((data) => {
          setRevenues(data);
        })
        .catch(err => console.log(err))
        .finally(() => setLoadingGetRevenues(false));
    }
  }, [uid, dateToAnalyze]);

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
    let index = revenues.findIndex((value => value.id === newRevenue.id))

    let newArray = [...revenues];
    newArray[index] = { ...newRevenue };

    setRevenues(newArray);
  }

  const handleDeleteRevenue = async (revenueId: string) => {
    await deleteRevenue(revenueId)

    let index = revenues.findIndex((value => value.id === revenueId))

    let newArray = [...revenues];
    newArray.splice(index, 1)

    setRevenues(newArray);
  }

  const handleAddRevenue = (newRevenue: IRevenue) => {
    if (newRevenue.addDateFormatted === dateToAnalyze.format('MM/YYYY')) {
      let newArray = [...revenues];
      newArray.push(newRevenue);

      setRevenues(newArray);
    }
  }

  return (
    <RevenuesContext.Provider value={{
      loadingGetRevenues,
      revenues,
      monthlyRevenues,
      handleUpdateRevenue,
      handleDeleteRevenue,
      handleAddRevenue,
      expensesOfDay
    }}>
      {children}
    </RevenuesContext.Provider>
  );
};