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
  color: '#2a4f64',
  borderColor: 'rgba(8, 43, 67, 0.22)',
  '&:hover': {
    borderColor: 'rgba(8, 43, 67, 0.42)',
    backgroundColor: 'rgba(8, 43, 67, 0.05)',
  },
};

export const primaryActionSx: SxProps<Theme> = {
  background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
  '&:hover': {
    background: 'linear-gradient(136deg, #0a3451 0%, #12747c 48%, #1aa188 100%)',
  },
};
