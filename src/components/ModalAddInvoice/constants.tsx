import type { SxProps, Theme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import { defaultExpenseCategories, defaultRevenueCategories } from '../../constants/categories';

export const expenseCategories = defaultExpenseCategories;
export const revenueCategories = defaultRevenueCategories;

export const getDefaultAddDateBySelectedMonth = (dateToAnalyze: Dayjs): Dayjs => {
  if (dateToAnalyze.isAfter(dayjs(), 'month')) {
    return dateToAnalyze.startOf('month');
  }
  return dayjs(new Date());
};

export const secondaryActionSx: SxProps<Theme> = {
  color: 'var(--muted)',
  minHeight: 40,
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: 'var(--subtle)',
  },
};

export const primaryActionSx: SxProps<Theme> = {
  minHeight: 40,
  px: 2,
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 700,
  background: 'var(--action)',
  color: 'var(--action-text)',
  '&:hover': {
    background: 'var(--action-hover)',
  },
};
