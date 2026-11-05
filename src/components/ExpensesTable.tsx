import { Chip, Stack, Typography } from '@mui/material';
import type { IInvoice } from '../providers/invoices/types';
import { isInstallmentInvoice } from '../utils/installments';
import { TransactionsTable } from './TransactionsTable';

interface Props {
  invoices: IInvoice[];
  onEdit: (invoice: IInvoice) => void;
  onDelete: (id: string) => void;
  canManage?: boolean;
}
const isMonthly = (entry: IInvoice) => entry.isMonthlyFixed || isInstallmentInvoice(entry);
const getCategory = (entry: IInvoice) => entry.invoiceCategory;
const dateSortValue = (entry: IInvoice) => (isMonthly(entry) ? entry.addDate?.startOf('month') : entry.addDate)?.valueOf() ?? 0;
const renderDate = (entry: IInvoice) => isMonthly(entry) ? <Stack spacing={0.5} alignItems='flex-start'>
  <Chip label={isInstallmentInvoice(entry) ? 'Parcelada' : 'Fixa do mês'} size='small' sx={{ bgcolor: 'var(--primary-soft)', color: 'var(--primary-text)', fontSize: 11 }} />
  <Typography variant='caption' color='text.secondary'>{entry.addDateFormatted}</Typography>
</Stack> : entry.addDate?.format('DD/MM/YYYY') ?? '-';

export function ExpensesTable({ invoices, ...props }: Props) {
  return <TransactionsTable entries={invoices} title='Despesas do mês' noun='despesa' getCategory={getCategory}
    renderDate={renderDate} dateSortValue={dateSortValue} {...props} />;
}
