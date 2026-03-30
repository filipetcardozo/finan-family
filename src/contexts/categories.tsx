import React, { createContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../../firebaseConfig';
import {
  defaultExpenseCategories,
  defaultRevenueCategories,
  normalizeCategoryLabel,
  type CategoryOption,
} from '../constants/categories';
import { useAuth } from '../hooks/useAuth';
import { saveUserCategories } from '../providers/categories/services';
import type { UserCategoriesDocument } from '../providers/categories/types';
import {
  dedupeCategoriesPreservingOrder,
  reorderCategories,
  reorderValues,
} from '../utils/categoryCollections';
import {
  mergeCategoriesByUserOrder,
  normalizeGroupOrder,
  orderCategoriesByGroupPriority,
  sortCategoriesByPriority,
  type CategoryKind,
} from '../utils/categoryOrdering';

type StoredUserCategoriesDocument = UserCategoriesDocument & {
  expenseGroupOrder?: string[];
  revenueGroupOrder?: string[];
};

type CategoriesContextType = {
  expenseCategories: CategoryOption[];
  revenueCategories: CategoryOption[];
  expenseGroupOrder: string[];
  revenueGroupOrder: string[];
  expenseCategoryOptions: CategoryOption[];
  revenueCategoryOptions: CategoryOption[];
  hasCustomExpenseCategories: boolean;
  hasCustomRevenueCategories: boolean;
  loadingCategories: boolean;
  addExpenseCategory(category: CategoryOption): Promise<void>;
  addRevenueCategory(category: CategoryOption): Promise<void>;
  removeExpenseCategory(label: string): Promise<void>;
  removeRevenueCategory(label: string): Promise<void>;
  reorderExpenseCategories(activeId: string, overId: string): Promise<void>;
  reorderRevenueCategories(activeId: string, overId: string): Promise<void>;
  reorderExpenseGroups(activeId: string, overId: string): Promise<void>;
  reorderRevenueGroups(activeId: string, overId: string): Promise<void>;
};

const defaultState: CategoriesContextType = {
  expenseCategories: [],
  revenueCategories: [],
  expenseGroupOrder: [],
  revenueGroupOrder: [],
  expenseCategoryOptions: defaultExpenseCategories,
  revenueCategoryOptions: defaultRevenueCategories,
  hasCustomExpenseCategories: false,
  hasCustomRevenueCategories: false,
  loadingCategories: false,
  addExpenseCategory: async () => undefined,
  addRevenueCategory: async () => undefined,
  removeExpenseCategory: async () => undefined,
  removeRevenueCategory: async () => undefined,
  reorderExpenseCategories: async () => undefined,
  reorderRevenueCategories: async () => undefined,
  reorderExpenseGroups: async () => undefined,
  reorderRevenueGroups: async () => undefined,
};

export const CategoriesContext = createContext<CategoriesContextType>(defaultState);

type Props = {
  children: React.ReactNode;
};

const normalizeStoredCategories = (categories: Partial<CategoryOption>[] | undefined, type: CategoryKind) =>
  orderCategoriesByGroupPriority(dedupeCategoriesPreservingOrder(categories), type);

const getMergedVisibleCategories = (
  defaultCategories: CategoryOption[],
  customCategories: CategoryOption[],
  type: CategoryKind,
) => mergeCategoriesByUserOrder(defaultCategories, customCategories, type);

export const CategoriesProvider: React.FC<Props> = ({ children }) => {
  const { uid } = useAuth();
  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<CategoryOption[]>([]);
  const [expenseGroupOrder, setExpenseGroupOrder] = useState<string[]>([]);
  const [revenueGroupOrder, setRevenueGroupOrder] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const persistCategories = async (
    nextExpenseCategories: CategoryOption[],
    nextRevenueCategories: CategoryOption[],
    nextExpenseGroupOrder: string[],
    nextRevenueGroupOrder: string[],
  ) => {
    if (!uid) {
      return;
    }

    await saveUserCategories(uid, {
      expenseCategories: nextExpenseCategories,
      revenueCategories: nextRevenueCategories,
      expenseGroupOrder: nextExpenseGroupOrder,
      revenueGroupOrder: nextRevenueGroupOrder,
    } as StoredUserCategoriesDocument);
  };

  useEffect(() => {
    let active = true;

    if (!uid) {
      setExpenseCategories([]);
      setRevenueCategories([]);
      setExpenseGroupOrder([]);
      setRevenueGroupOrder([]);
      setLoadingCategories(false);
      return () => {
        active = false;
      };
    }

    setLoadingCategories(true);

    const categoriesRef = doc(database, 'userSettings', uid);

    getDoc(categoriesRef)
      .then(snapshot => {
        if (!active) {
          return;
        }

        if (!snapshot.exists()) {
          setExpenseCategories([]);
          setRevenueCategories([]);
          setExpenseGroupOrder(normalizeGroupOrder([], defaultExpenseCategories, 'expense'));
          setRevenueGroupOrder(normalizeGroupOrder([], defaultRevenueCategories, 'revenue'));
          return;
        }

        const categoriesData = snapshot.data() as Partial<StoredUserCategoriesDocument>;
        const nextExpenseCategories = normalizeStoredCategories(categoriesData.expenseCategories, 'expense');
        const nextRevenueCategories = normalizeStoredCategories(categoriesData.revenueCategories, 'revenue');

        setExpenseCategories(nextExpenseCategories);
        setRevenueCategories(nextRevenueCategories);
        setExpenseGroupOrder(
          normalizeGroupOrder(
            categoriesData.expenseGroupOrder,
            getMergedVisibleCategories(defaultExpenseCategories, nextExpenseCategories, 'expense'),
            'expense',
          ),
        );
        setRevenueGroupOrder(
          normalizeGroupOrder(
            categoriesData.revenueGroupOrder,
            getMergedVisibleCategories(defaultRevenueCategories, nextRevenueCategories, 'revenue'),
            'revenue',
          ),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setExpenseCategories([]);
        setRevenueCategories([]);
        setExpenseGroupOrder(normalizeGroupOrder([], defaultExpenseCategories, 'expense'));
        setRevenueGroupOrder(normalizeGroupOrder([], defaultRevenueCategories, 'revenue'));
      })
      .finally(() => {
        if (active) {
          setLoadingCategories(false);
        }
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const addExpenseCategory = async (category: CategoryOption) => {
    if (!uid) {
      return;
    }

    const nextExpenseCategories = dedupeCategoriesPreservingOrder([...expenseCategories, category]);
    const nextExpenseGroupOrder = normalizeGroupOrder(
      expenseGroupOrder,
      getMergedVisibleCategories(defaultExpenseCategories, nextExpenseCategories, 'expense'),
      'expense',
    );

    await persistCategories(nextExpenseCategories, revenueCategories, nextExpenseGroupOrder, revenueGroupOrder);
    setExpenseCategories(nextExpenseCategories);
    setExpenseGroupOrder(nextExpenseGroupOrder);
  };

  const addRevenueCategory = async (category: CategoryOption) => {
    if (!uid) {
      return;
    }

    const nextRevenueCategories = dedupeCategoriesPreservingOrder([...revenueCategories, category]);
    const nextRevenueGroupOrder = normalizeGroupOrder(
      revenueGroupOrder,
      getMergedVisibleCategories(defaultRevenueCategories, nextRevenueCategories, 'revenue'),
      'revenue',
    );

    await persistCategories(expenseCategories, nextRevenueCategories, expenseGroupOrder, nextRevenueGroupOrder);
    setRevenueCategories(nextRevenueCategories);
    setRevenueGroupOrder(nextRevenueGroupOrder);
  };

  const removeExpenseCategory = async (label: string) => {
    if (!uid) {
      return;
    }

    const nextExpenseCategories = expenseCategories.filter(
      category => normalizeCategoryLabel(category.label) !== normalizeCategoryLabel(label),
    );
    const nextExpenseGroupOrder = normalizeGroupOrder(
      expenseGroupOrder,
      getMergedVisibleCategories(defaultExpenseCategories, nextExpenseCategories, 'expense'),
      'expense',
    );

    await persistCategories(nextExpenseCategories, revenueCategories, nextExpenseGroupOrder, revenueGroupOrder);
    setExpenseCategories(nextExpenseCategories);
    setExpenseGroupOrder(nextExpenseGroupOrder);
  };

  const removeRevenueCategory = async (label: string) => {
    if (!uid) {
      return;
    }

    const nextRevenueCategories = revenueCategories.filter(
      category => normalizeCategoryLabel(category.label) !== normalizeCategoryLabel(label),
    );
    const nextRevenueGroupOrder = normalizeGroupOrder(
      revenueGroupOrder,
      getMergedVisibleCategories(defaultRevenueCategories, nextRevenueCategories, 'revenue'),
      'revenue',
    );

    await persistCategories(expenseCategories, nextRevenueCategories, expenseGroupOrder, nextRevenueGroupOrder);
    setRevenueCategories(nextRevenueCategories);
    setRevenueGroupOrder(nextRevenueGroupOrder);
  };

  const reorderExpenseCategories = async (activeId: string, overId: string) => {
    if (!uid) {
      return;
    }

    const nextExpenseCategories = reorderCategories(expenseCategories, activeId, overId);

    await persistCategories(nextExpenseCategories, revenueCategories, expenseGroupOrder, revenueGroupOrder);
    setExpenseCategories(nextExpenseCategories);
  };

  const reorderRevenueCategories = async (activeId: string, overId: string) => {
    if (!uid) {
      return;
    }

    const nextRevenueCategories = reorderCategories(revenueCategories, activeId, overId);

    await persistCategories(expenseCategories, nextRevenueCategories, expenseGroupOrder, revenueGroupOrder);
    setRevenueCategories(nextRevenueCategories);
  };

  const reorderExpenseGroups = async (activeId: string, overId: string) => {
    if (!uid) {
      return;
    }

    const nextExpenseGroupOrder = normalizeGroupOrder(
      reorderValues(expenseGroupOrder, activeId, overId),
      getMergedVisibleCategories(defaultExpenseCategories, expenseCategories, 'expense'),
      'expense',
    );

    await persistCategories(expenseCategories, revenueCategories, nextExpenseGroupOrder, revenueGroupOrder);
    setExpenseGroupOrder(nextExpenseGroupOrder);
  };

  const reorderRevenueGroups = async (activeId: string, overId: string) => {
    if (!uid) {
      return;
    }

    const nextRevenueGroupOrder = normalizeGroupOrder(
      reorderValues(revenueGroupOrder, activeId, overId),
      getMergedVisibleCategories(defaultRevenueCategories, revenueCategories, 'revenue'),
      'revenue',
    );

    await persistCategories(expenseCategories, revenueCategories, expenseGroupOrder, nextRevenueGroupOrder);
    setRevenueGroupOrder(nextRevenueGroupOrder);
  };

  const hasCustomExpenseCategories = expenseCategories.length > 0;
  const hasCustomRevenueCategories = revenueCategories.length > 0;

  const expenseCategoryOptions = useMemo(
    () =>
      hasCustomExpenseCategories
        ? orderCategoriesByGroupPriority(expenseCategories, 'expense', expenseGroupOrder)
        : orderCategoriesByGroupPriority(
            sortCategoriesByPriority(defaultExpenseCategories, 'expense'),
            'expense',
            expenseGroupOrder,
          ),
    [expenseCategories, expenseGroupOrder, hasCustomExpenseCategories],
  );

  const revenueCategoryOptions = useMemo(
    () =>
      hasCustomRevenueCategories
        ? orderCategoriesByGroupPriority(revenueCategories, 'revenue', revenueGroupOrder)
        : orderCategoriesByGroupPriority(
            sortCategoriesByPriority(defaultRevenueCategories, 'revenue'),
            'revenue',
            revenueGroupOrder,
          ),
    [revenueCategories, revenueGroupOrder, hasCustomRevenueCategories],
  );

  const providerValue = useMemo(
    () => ({
      expenseCategories,
      revenueCategories,
      expenseGroupOrder,
      revenueGroupOrder,
      expenseCategoryOptions,
      revenueCategoryOptions,
      hasCustomExpenseCategories,
      hasCustomRevenueCategories,
      loadingCategories,
      addExpenseCategory,
      addRevenueCategory,
      removeExpenseCategory,
      removeRevenueCategory,
      reorderExpenseCategories,
      reorderRevenueCategories,
      reorderExpenseGroups,
      reorderRevenueGroups,
    }),
    [
      expenseCategories,
      revenueCategories,
      expenseGroupOrder,
      revenueGroupOrder,
      expenseCategoryOptions,
      revenueCategoryOptions,
      hasCustomExpenseCategories,
      hasCustomRevenueCategories,
      loadingCategories,
      addExpenseCategory,
      addRevenueCategory,
      removeExpenseCategory,
      removeRevenueCategory,
      reorderExpenseCategories,
      reorderRevenueCategories,
      reorderExpenseGroups,
      reorderRevenueGroups,
    ],
  );

  return <CategoriesContext.Provider value={providerValue}>{children}</CategoriesContext.Provider>;
};
