import type { IInvoice } from '../providers/invoices/types';
import { getInstallmentPurchaseId, isInstallmentInvoice } from './installments';

export function getExpenseSeries(invoice: IInvoice) {
  if (isInstallmentInvoice(invoice)) {
    const id = getInstallmentPurchaseId(invoice);
    return id ? { kind: 'installments' as const, id } : null;
  }
  return invoice.recurringTemplateId ? { kind: 'recurring' as const, id: invoice.recurringTemplateId } : null;
}

export function isSameExpenseSeries(reference: IInvoice, entry: IInvoice) {
  const series = getExpenseSeries(reference);
  const other = getExpenseSeries(entry);
  return Boolean(series && other && reference.userId === entry.userId && series.kind === other.kind && series.id === other.id);
}

export function expenseMonthIndex(entry: IInvoice): number | null {
  const parts = entry.addDateFormatted?.match(/^(\d{2})\/(\d{4})$/);
  if (!parts || Number(parts[1]) < 1 || Number(parts[1]) > 12) return null;
  return Number(parts[2]) * 12 + Number(parts[1]) - 1;
}

export function isFutureSeriesExpense(reference: IInvoice, entry: IInvoice) {
  const currentMonth = expenseMonthIndex(reference);
  const otherMonth = expenseMonthIndex(entry);
  return entry.id !== reference.id && isSameExpenseSeries(reference, entry)
    && currentMonth !== null && otherMonth !== null && otherMonth > currentMonth;
}
