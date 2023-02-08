import { IInvoice } from './../providers/invoices/types';
import { useAuth } from './auth/useAuth';
import { useMemo, useState, useEffect, useContext } from 'react';
import { deleteInvoice, getUserInvoices } from '../providers/invoices/services';
import dayjs from 'dayjs';
import { MonthSelectedContext } from '../contexts/monthSelected';

export const useInvoices = () => {
  const { uid } = useAuth();

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loadingGetInvoices, setLoadingGetInvoices] = useState(false);

  const { dateToAnalyze, handleNextMonth, handlePreviousMonth } = useContext(MonthSelectedContext);

  useEffect(() => {
    if (uid) {
      setLoadingGetInvoices(true);
      getUserInvoices(uid, dateToAnalyze.format('MM/YYYY').toString())
        .then((data) => {
          setInvoices(data);
        })
        .catch(err => console.log(err))
        .finally(() => setLoadingGetInvoices(false));
    }
  }, [uid, dateToAnalyze]);

  const monthlyExpenses = useMemo(() => {
    let totalExpenses = 0;

    if (invoices.length > 0) {
      invoices.forEach(v => {
        if (v.value && v.addDate) totalExpenses += v.value;
      })
    }

    return totalExpenses;
  }, [invoices])

  const handleUpdateInvoice = (newInvoice: IInvoice) => {
    let index = invoices.findIndex((value => value.id === newInvoice.id))

    let newArray = [...invoices];
    newArray[index] = { ...newInvoice };

    setInvoices(newArray);
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    await deleteInvoice(invoiceId)

    let index = invoices.findIndex((value => value.id === invoiceId))

    let newArray = [...invoices];
    newArray.splice(index, 1)

    setInvoices(newArray);
  }

  return {
    loadingGetInvoices,
    invoices,
    monthlyExpenses,
    handleUpdateInvoice,
    handleDeleteInvoice
  };
}