import { IInvoice } from './../providers/invoices/types';
import { useAuth } from './auth/useAuth';
import { useMemo, useState, useEffect } from 'react';
import { deleteInvoice, getUserInvoices } from '../providers/invoices/services';
import dayjs from 'dayjs';

export const useInvoices = () => {
  const { uid } = useAuth();

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loadingGetInvoices, setLoadingGetInvoices] = useState(false);

  useEffect(() => {
    if (uid) {
      setLoadingGetInvoices(true);

      getUserInvoices(uid)
        .then((data) => {
          setInvoices(data);
        })
        .catch(err => console.log(err))
        .finally(() => setLoadingGetInvoices(false));
    }
  }, [uid]);

  const monthlyExpenses = useMemo(() => {
    let totalExpenses = 0;

    if (invoices.length > 0) {
      invoices.forEach(v => {
        let month = dayjs(v.addDate).month();
        console.log(month)
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