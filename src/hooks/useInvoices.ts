import { IInvoice } from './../providers/invoices/types';
import { useAuth } from './auth/useAuth';
import React, { useCallback, useState, useEffect } from 'react';
import { getUserInvoices } from '../providers/invoices/services';

export const useInvoices = () => {
  const { uid } = useAuth();

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  useEffect(() => {
    if (uid) {
      getUserInvoices(uid)
        .then((data) => {
          setInvoices(data);
        })
        .catch(err => console.log(err))
    }
  }, [uid]);

  return {
    invoices
  };
}