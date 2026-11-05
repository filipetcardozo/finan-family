import dayjs, { Dayjs } from 'dayjs';
import React, { Context } from 'react';
import { IInvoice } from '../providers/invoices/types';
import { useMemo, useContext, useRef } from 'react';
import { deleteInvoice } from '../providers/invoices/services';
import { useMonthlyTransactions } from '../hooks/useMonthlyTransactions';
import { MonthSelectedContext } from './monthSelected';
import { useAuth } from '../hooks/useAuth';
import { RevenuesContext } from './revenues';
import { isInstallmentInvoice } from '../utils/installments';

interface ContextType {
  loadingGetInvoices: boolean;
  invoices: IInvoice[] | [];
  monthlyExpenses: number;
  handleUpdateInvoice: (newInvoice: IInvoice) => void;
  handleUpdateInvoices: (updatedInvoices: IInvoice[]) => void;
  handleDeleteInvoice: (invoiceId: string) => Promise<void>;
  handleAddInvoice: (newInvoice: IInvoice) => void;
  handleAddInvoices: (newInvoices: IInvoice[]) => void;
  expensesIndicatedPerDay: number;
  expensesOfDay: IInvoice[] | [];
}

const defaultState = {
  loadingGetInvoices: true,
  invoices: [],
  monthlyExpenses: 0,
  handleUpdateInvoice: (newInvoice: IInvoice) => { },
  handleUpdateInvoices: (updatedInvoices: IInvoice[]) => { },
  handleDeleteInvoice: async (invoiceId: string) => { },
  handleAddInvoice: (newInvoice: IInvoice) => { },
  handleAddInvoices: (newInvoices: IInvoice[]) => { },
  expensesIndicatedPerDay: 0,
  expensesOfDay: []
}

export const ExpensesContext = React.createContext<ContextType>(defaultState);

export const ExpensesProvider = ({ children }: any) => {
  const { uid, isLogged } = useAuth();

  const { dateToAnalyze, ready } = useContext(MonthSelectedContext);
  const { entries: invoices, updateEntries: setInvoices, loading: loadingGetInvoices } = useMonthlyTransactions<IInvoice>('invoices', uid, dateToAnalyze.format('MM/YYYY'), isLogged === true && ready);
  const selectedMonthRef = useRef(dateToAnalyze.format('MM/YYYY'));
  selectedMonthRef.current = dateToAnalyze.format('MM/YYYY');
  const { monthlyRevenues } = useContext(RevenuesContext);

  const isInvestmentCategory = (category?: string) => {
    if (!category) {
      return false;
    }

    const normalized = category
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalized.startsWith('invest');
  };

  const monthlyExpenses = useMemo(() => {
    let totalExpenses = 0;

    if (invoices.length > 0) {
      invoices.forEach(v => {
        if (v.value && v.addDate && !isInvestmentCategory(v.invoiceCategory)) totalExpenses += v.value;
      })
    }

    return totalExpenses;
  }, [invoices])


  const expensesIndicatedPerDay = useMemo(() => {
    let daysToEndMonth = 25 - new Date().getDate();

    if (monthlyRevenues > monthlyExpenses) {
      return (monthlyRevenues - monthlyExpenses) / daysToEndMonth;
    } else {
      return 0;
    }
  }, [monthlyExpenses, monthlyRevenues])

  const expensesOfDay = useMemo(() => {
    if (invoices) {
      return [...invoices].filter(v => {
        if (!v.isMonthlyFixed && !isInstallmentInvoice(v) && v.addDate?.format('DD/MM/YYYY') === dayjs().format('DD/MM/YYYY')) {
          return true;
        }
      })
    } else {
      return [];
    }
  }, [invoices])

  const handleUpdateInvoices = (updatedInvoices: IInvoice[]) => {
    setInvoices(previous => {
      const ids = new Set(updatedInvoices.map(invoice => invoice.id));
      return [
        ...previous.filter(invoice => !ids.has(invoice.id)),
        ...updatedInvoices.filter(invoice => invoice.addDateFormatted === selectedMonthRef.current),
      ];
    });
  };

  const handleUpdateInvoice = (newInvoice: IInvoice) => handleUpdateInvoices([newInvoice]);

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (invoices.some(invoice => invoice.id === invoiceId && invoice.pendingSync)) throw new Error('Aguarde a sincronização para excluir.');
    await deleteInvoice(invoiceId)
    setInvoices(previous => previous.filter(invoice => invoice.id !== invoiceId));
  }

  const handleAddInvoices = (newInvoices: IInvoice[]) => {
    setInvoices(previous => {
      // Queued entries come from the durable overlay; don't keep stale pending flags
      // in the server snapshot after the queue has been acknowledged.
      const additions = newInvoices.filter(invoice => !invoice.pendingSync && invoice.addDateFormatted === selectedMonthRef.current);
      const merged = new Map(previous.map(invoice => [invoice.id, invoice]));
      additions.forEach(invoice => merged.set(invoice.id, invoice));
      return Array.from(merged.values());
    });
  };

  const handleAddInvoice = (newInvoice: IInvoice) => handleAddInvoices([newInvoice]);

  return (
    <ExpensesContext.Provider value={{
      loadingGetInvoices,
      invoices,
      monthlyExpenses,
      handleUpdateInvoice,
      handleUpdateInvoices,
      handleDeleteInvoice,
      handleAddInvoice,
      handleAddInvoices,
      expensesIndicatedPerDay,
      expensesOfDay
    }}>
      {children}
    </ExpensesContext.Provider>
  );
};
