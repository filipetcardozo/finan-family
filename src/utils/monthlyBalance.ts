import type { IInvoice } from '../providers/invoices/types';

// Expenses exclude investments; reserve the full plan before computing spending money.
export const getMonthlyBalance = (revenue: number, expenses: number, invoices: IInvoice[]) => {
  const plannedCents = invoices.reduce((total, invoice) => {
    const category = (invoice.invoiceCategory ?? '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!category.startsWith('invest') || !Number.isFinite(invoice.value)) return total;
    return total + Math.round((invoice.value ?? 0) * 100);
  }, 0);
  const balanceCents = Math.round(revenue * 100) - Math.round(expenses * 100);
  const availableCents = balanceCents - plannedCents;
  const preservedCents = Math.max(0, Math.min(plannedCents, balanceCents));

  return {
    availableToSpend: availableCents / 100,
    plannedInvestments: plannedCents / 100,
    preservedInvestments: preservedCents / 100,
    showInvestmentPlan: plannedCents > 0 && preservedCents !== plannedCents,
  };
};
