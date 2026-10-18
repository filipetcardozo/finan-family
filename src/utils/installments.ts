import type { IInvoice } from '../providers/invoices/types';

export const MAX_INSTALLMENTS = 500;

export const isValidInstallmentCount = (count: number) =>
  Number.isInteger(count) && count >= 2 && count <= MAX_INSTALLMENTS;

export const buildInstallmentInvoices = (invoice: IInvoice, count: number): IInvoice[] => {
  if (!isValidInstallmentCount(count) || !invoice.addDate?.isValid()
    || !Number.isFinite(invoice.value) || (invoice.value ?? 0) <= 0
    || Math.abs(Math.round(invoice.value! * 100) - invoice.value! * 100) > 0.000001
    || !invoice.invoiceCategory.trim()) {
    throw new Error('Revise a categoria, o valor, a data e a quantidade de parcelas.');
  }

  const firstDate = invoice.addDate;
  const description = invoice.description.trim();
  return Array.from({ length: count }, (_, index) => {
    // Always add to the original date: Jan 31 -> Feb 28 -> Mar 31.
    const addDate = firstDate.add(index, 'month');
    const installmentLabel = `Parcela ${index + 1}/${count}`;
    return {
      id: '', userId: invoice.userId, invoiceCategory: invoice.invoiceCategory,
      value: invoice.value, addDate, addDateFormatted: addDate.format('MM/YYYY'),
      description: description ? `${description} · ${installmentLabel}` : installmentLabel,
    };
  });
};
