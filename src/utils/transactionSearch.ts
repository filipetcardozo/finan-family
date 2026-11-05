import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import { formatterCurrency } from './formatters';
import { isInstallmentInvoice } from './installments';

const normalizeSearchText = (text: string) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, ' ');

const searchableValues = (value: unknown): string[] => {
  if (value == null) return [];

  if (dayjs.isDayjs(value)) {
    if (!value.isValid()) return [];

    const date = value.locale('pt-br');
    return [
      'DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'DD.MM.YYYY',
      'MM/YYYY', 'MMMM', 'D [de] MMMM [de] YYYY',
    ].map(format => date.format(format));
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return [];

    const amounts = [
      String(value),
      value.toFixed(2),
      value.toFixed(2).replace('.', ','),
      value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];
    return [...amounts, ...amounts.map(amount => `R$${amount}`), formatterCurrency(value)];
  }

  return typeof value === 'string' || typeof value === 'boolean' ? [String(value)] : [];
};

export const filterTransactions = <T extends IInvoice | IRevenue>(transactions: T[], search: string): T[] => {
  const normalizedSearch = normalizeSearchText(search);
  if (!normalizedSearch) return transactions;

  // Keep written dates together so their day cannot match an unrelated amount.
  const terms = normalizedSearch.match(/\d{1,2} de [a-z]+ de \d{4}|\S+/g) ?? [];
  return transactions.filter(transaction => {
    // Include every stored field, while indexing dates and amounts as users see them.
    const isInstallment = 'invoiceCategory' in transaction && isInstallmentInvoice(transaction);
    const isMonthlyFixed = !isInstallment && 'isMonthlyFixed' in transaction && transaction.isMonthlyFixed;
    const fields = Object.entries(transaction).flatMap(([key, value]) => {
      if (isMonthlyFixed && key === 'addDate' && dayjs.isDayjs(value)) {
        return value.isValid() ? ['MM/YYYY', 'YYYY-MM', 'MMMM [de] YYYY'].map(format => value.locale('pt-br').format(format)) : [];
      }
      return searchableValues(value);
    }).map(normalizeSearchText);
    if (isMonthlyFixed) fields.push('fixa fixo despesa fixa do mes mensal');
    if (isInstallment) fields.push('parcelada parcelado parcela parcelas despesas parceladas');
    return terms.every(term => fields.some(field => field.includes(term)));
  });
};
