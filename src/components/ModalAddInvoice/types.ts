import type { Dayjs } from 'dayjs';
import type { CategoryOption as AppCategoryOption } from '../../constants/categories';

export type CategoryOption = AppCategoryOption;

export type TransactionFormValues = {
  isMonthlyFixed?: boolean;
  addDate: Dayjs | null;
  addDateFormatted: string;
  description: string;
  value: number | undefined;
};
