import dayjs, { Dayjs } from 'dayjs';
import type { IInvoice } from '../providers/invoices/types';
import { isInstallmentInvoice } from './installments';

export const buildMonthlyExpenseAnalysis = (expenses: IInvoice[], month: Dayjs, today: Dayjs = dayjs()) => {
  const days = Array.from({ length: month.daysInMonth() }, (_, index) => ({ day: index + 1, value: 0, count: 0 }));
  const groups = [
    { key: 'fixed', label: 'Fixas', value: 0, count: 0 },
    { key: 'installments', label: 'Parceladas', value: 0, count: 0 },
    { key: 'daily', label: 'Avulsas', value: 0, count: 0 },
  ];
  expenses.forEach(expense => {
    const category = (expense.invoiceCategory ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (category.startsWith('invest') || !expense.addDate?.isValid() || !expense.addDate.isSame(month, 'month')
      || !Number.isFinite(expense.value) || (expense.value ?? 0) <= 0) return;
    const cents = Math.round(expense.value! * 100);
    const index = isInstallmentInvoice(expense) ? 1 : expense.isMonthlyFixed ? 0 : 2;
    groups[index].value += cents;
    groups[index].count += 1;
    if (index === 2) {
      days[expense.addDate.date() - 1].value += cents;
      days[expense.addDate.date() - 1].count += 1;
    }
  });
  const total = groups.reduce((sum, group) => sum + group.value, 0) / 100;
  return {
    total,
    days: days.slice(0, month.isSame(today, 'month') ? today.date() : month.daysInMonth())
      .map(day => ({ ...day, value: day.value / 100 })),
    groups: groups.map(group => ({ ...group, value: group.value / 100, percentage: total ? group.value / total : 0 })),
  };
};
