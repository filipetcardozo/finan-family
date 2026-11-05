import type { IRevenue } from '../providers/revenues/types';
import { TransactionsTable } from './TransactionsTable';

interface Props {
  revenues: IRevenue[];
  onEdit: (revenue: IRevenue) => void;
  onDelete: (id: string) => void;
  canManage?: boolean;
}
const getCategory = (entry: IRevenue) => entry.revenueCategory;
export function RevenuesTable({ revenues, ...props }: Props) {
  return <TransactionsTable entries={revenues} title='Receitas do mês' noun='receita' getCategory={getCategory} {...props} />;
}
