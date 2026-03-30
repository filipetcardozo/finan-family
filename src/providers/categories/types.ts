import type { CategoryOption } from '../../constants/categories';

export type UserCategoriesDocument = {
  expenseCategories: CategoryOption[];
  revenueCategories: CategoryOption[];
  updatedAt?: string;
};
