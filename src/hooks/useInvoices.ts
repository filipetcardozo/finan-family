import { IInvoice } from './../providers/invoices/types';
import { useAuth } from './auth/useAuth';
import { useMemo, useState, useEffect } from 'react';
import { getUserInvoices } from '../providers/invoices/services';
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

  return {
    loadingGetInvoices,
    invoices,
    monthlyExpenses
  };
}