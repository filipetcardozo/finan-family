import type { Dayjs } from 'dayjs';

export type CategoryOption = {
  label: string;
  group?: string;
};

export type TransactionFormValues = {
  addDate: Dayjs | null;
  addDateFormatted: string;
  description: string;
  value: number | undefined;
};
