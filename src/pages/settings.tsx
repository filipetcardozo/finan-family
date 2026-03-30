import dayjs from 'dayjs';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useSnackbar } from 'notistack';
import {
  CategoryManagementSection,
  type CategoryManagementGroup,
  type CategoryManagementItem,
} from '../components/categories/CategoryManagementSection';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { TabPanel } from '../components/ModalAddInvoice/TabPanel';
import {
  defaultExpenseCategories,
  defaultRevenueCategories,
  normalizeCategoryLabel,
  type CategoryOption,
} from '../constants/categories';
import { CategoriesContext } from '../contexts/categories';
import { useAuth, useProtectPage } from '../hooks/useAuth';
import { getUserInvoices } from '../providers/invoices/services';
import { getUserRevenues } from '../providers/revenues/services';
import { getCategoryId } from '../utils/categoryCollections';
import { getCategoryGroupLabel } from '../utils/categoryGroupLabels';
import {
  buildCategoryOptimization,
  type CategoryOptimizationResult,
} from '../utils/categoryOptimization';
import {
  mergeCategoriesByUserOrder,
  normalizeGroupOrder,
  sortGroupNamesByPriority,
  type CategoryKind,
} from '../utils/categoryOrdering';

type OptimizationAvailability = {
  expense: boolean;
  revenue: boolean;
  loading: boolean;
};

const groupCategories = (
  categories: CategoryManagementItem[],
  fallbackGroup: string,
  type: CategoryKind,
  groupOrder: string[],
) => {
  const groupedCategories = new Map<string, CategoryManagementItem[]>();

  categories.forEach(category => {
    const group = getCategoryGroupLabel(category.group?.trim()) || fallbackGroup;
    const groupItems = groupedCategories.get(group) || [];

    groupItems.push(category);
    groupedCategories.set(group, groupItems);
  });

  return sortGroupNamesByPriority(Array.from(groupedCategories.keys()), type, groupOrder).map(group => ({
    group,
    categories: groupedCategories.get(group) || [],
  }));
};

const createUnifiedCategories = (
  defaultCategories: CategoryOption[],
  customCategories: CategoryOption[],
  type: CategoryKind,
  groupOrder: string[],
): CategoryManagementItem[] => {
  const customLabels = new Set(customCategories.map(category => normalizeCategoryLabel(category.label)));

  return mergeCategoriesByUserOrder(defaultCategories, customCategories, type, groupOrder).map(category => ({
    ...category,
    id: getCategoryId(category.label),
    isCustom: customLabels.has(normalizeCategoryLabel(category.label)),
  }));
};

const getRecentMonths = (months: number) =>
  Array.from({ length: months }, (_, index) => dayjs().subtract(index, 'month').format('MM/YYYY'));

type OptimizationOrderPreviewItem = {
  id: string;
  label: string;
  helperText?: string;
};

const getMovedItemIds = (
  currentItems: OptimizationOrderPreviewItem[],
  nextItems: OptimizationOrderPreviewItem[],
) => {
  const currentIndexById = new Map(currentItems.map((item, index) => [item.id, index]));
  const nextIndexById = new Map(nextItems.map((item, index) => [item.id, index]));
  const allIds = Array.from(currentIndexById.keys()).concat(Array.from(nextIndexById.keys()));

  return new Set(
    Array.from(new Set(allIds)).filter(
      id => currentIndexById.get(id) !== nextIndexById.get(id),
    ),
  );
};

type OptimizationOrderColumnProps = {
  title: string;
  items: OptimizationOrderPreviewItem[];
  movedItemIds?: Set<string>;
  emptyText: string;
  accent?: 'neutral' | 'highlight';
};

const OptimizationOrderColumn = ({
  title,
  items,
  movedItemIds = new Set<string>(),
  emptyText,
  accent = 'neutral',
}: OptimizationOrderColumnProps) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.5,
      borderRadius: 3,
      border: '1px solid rgba(15, 106, 114, 0.10)',
      backgroundColor:
        accent === 'highlight' ? 'rgba(15, 106, 114, 0.06)' : 'rgba(8, 43, 67, 0.02)',
    }}
  >
    <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#123047', mb: 1.2 }}>{title}</Typography>

    {items.length > 0 ? (
      <Stack spacing={0.8} sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.3 }}>
        {items.map((item, index) => {
          const isMoved = movedItemIds.has(item.id);

          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1,
                borderRadius: 2,
                border: isMoved
                  ? '1px solid rgba(15, 106, 114, 0.18)'
                  : '1px solid rgba(8, 43, 67, 0.06)',
                backgroundColor: isMoved ? 'rgba(21, 145, 124, 0.08)' : '#fff',
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isMoved ? '#fff' : '#4d6c82',
                  backgroundColor: isMoved ? '#15917c' : 'rgba(8, 43, 67, 0.08)',
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#123047', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                {item.helperText ? (
                  <Typography sx={{ mt: 0.25, fontSize: 12, color: '#607d92', lineHeight: 1.2 }}>
                    {item.helperText}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Stack>
    ) : (
      <Typography sx={{ fontSize: 13, color: '#607d92' }}>{emptyText}</Typography>
    )}
  </Box>
);

export default function Settings() {
  useProtectPage();

  const { uid } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const {
    expenseCategories,
    revenueCategories,
    expenseGroupOrder,
    revenueGroupOrder,
    loadingCategories,
    addExpenseCategory,
    addRevenueCategory,
    removeExpenseCategory,
    removeRevenueCategory,
    reorderExpenseCategories,
    reorderRevenueCategories,
    reorderExpenseGroups,
    reorderRevenueGroups,
    updateExpenseOrganization,
    updateRevenueOrganization,
  } = useContext(CategoriesContext);

  const [tabSelected, setTabSelected] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseGroup, setExpenseGroup] = useState('');
  const [revenueLabel, setRevenueLabel] = useState('');
  const [revenueGroup, setRevenueGroup] = useState('');
  const [optimizationAvailability, setOptimizationAvailability] = useState<OptimizationAvailability>({
    expense: false,
    revenue: false,
    loading: false,
  });
  const [optimizationTarget, setOptimizationTarget] = useState<CategoryKind>('expense');
  const [optimizationPreview, setOptimizationPreview] = useState<CategoryOptimizationResult | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [applySuggestedOrdering, setApplySuggestedOrdering] = useState(true);
  const [applyUnusedCleanup, setApplyUnusedCleanup] = useState(false);

  const expenseCustomLabels = new Set(expenseCategories.map(category => normalizeCategoryLabel(category.label)));
  const revenueCustomLabels = new Set(revenueCategories.map(category => normalizeCategoryLabel(category.label)));

  const expenseCategoriesInUse = useMemo(
    () => createUnifiedCategories(defaultExpenseCategories, expenseCategories, 'expense', expenseGroupOrder),
    [expenseCategories, expenseGroupOrder],
  );
  const revenueCategoriesInUse = useMemo(
    () => createUnifiedCategories(defaultRevenueCategories, revenueCategories, 'revenue', revenueGroupOrder),
    [revenueCategories, revenueGroupOrder],
  );

  const expenseGroups = useMemo<CategoryManagementGroup[]>(
    () => groupCategories(expenseCategoriesInUse, 'Sem grupo', 'expense', expenseGroupOrder),
    [expenseCategoriesInUse, expenseGroupOrder],
  );
  const revenueGroups = useMemo<CategoryManagementGroup[]>(
    () => groupCategories(revenueCategoriesInUse, 'Receitas', 'revenue', revenueGroupOrder),
    [revenueCategoriesInUse, revenueGroupOrder],
  );
  const expenseGroupOptions = useMemo(() => expenseGroups.map(group => group.group), [expenseGroups]);
  const revenueGroupOptions = useMemo(() => revenueGroups.map(group => group.group), [revenueGroups]);
  const optimizationComparison = useMemo(() => {
    if (!optimizationPreview) {
      return null;
    }

    const isExpense = optimizationTarget === 'expense';
    const fallbackGroup = isExpense ? 'Sem grupo' : 'Receitas';
    const currentCategories = isExpense ? expenseCategories : revenueCategories;
    const defaultCategories = isExpense ? defaultExpenseCategories : defaultRevenueCategories;
    const currentGroupOrder = isExpense ? expenseGroupOrder : revenueGroupOrder;

    const filteredCategories = applyUnusedCleanup
      ? currentCategories.filter(
          category =>
            !optimizationPreview.unusedCustomLabels.some(
              label => normalizeCategoryLabel(label) === normalizeCategoryLabel(category.label),
            ),
        )
      : currentCategories;

    const nextCategories = applySuggestedOrdering
      ? optimizationPreview.suggestedCategories.filter(
          category =>
            !applyUnusedCleanup ||
            !optimizationPreview.unusedCustomLabels.some(
              label => normalizeCategoryLabel(label) === normalizeCategoryLabel(category.label),
            ),
        )
      : filteredCategories;

    const nextPreferredGroupOrder = applySuggestedOrdering
      ? optimizationPreview.suggestedGroupOrder
      : currentGroupOrder;

    const currentVisibleGroups = groupCategories(
      createUnifiedCategories(defaultCategories, currentCategories, optimizationTarget, currentGroupOrder),
      fallbackGroup,
      optimizationTarget,
      currentGroupOrder,
    ).map(group => ({
      id: normalizeCategoryLabel(group.group),
      label: group.group,
    }));

    const nextVisibleGroupOrder = normalizeGroupOrder(
      nextPreferredGroupOrder,
      mergeCategoriesByUserOrder(defaultCategories, nextCategories, optimizationTarget, nextPreferredGroupOrder),
      optimizationTarget,
    );

    const nextVisibleGroups = groupCategories(
      createUnifiedCategories(defaultCategories, nextCategories, optimizationTarget, nextVisibleGroupOrder),
      fallbackGroup,
      optimizationTarget,
      nextVisibleGroupOrder,
    ).map(group => ({
      id: normalizeCategoryLabel(group.group),
      label: group.group,
    }));

    const currentCustomCategories = currentCategories.map(category => ({
      id: getCategoryId(category.label),
      label: category.label,
      helperText: getCategoryGroupLabel(category.group) || fallbackGroup,
    }));

    const nextCustomCategories = nextCategories.map(category => ({
      id: getCategoryId(category.label),
      label: category.label,
      helperText: getCategoryGroupLabel(category.group) || fallbackGroup,
    }));

    return {
      currentVisibleGroups,
      nextVisibleGroups,
      currentCustomCategories,
      nextCustomCategories,
      movedGroupIds: getMovedItemIds(currentVisibleGroups, nextVisibleGroups),
      movedCategoryIds: getMovedItemIds(currentCustomCategories, nextCustomCategories),
    };
  }, [
    applySuggestedOrdering,
    applyUnusedCleanup,
    expenseCategories,
    expenseGroupOrder,
    optimizationPreview,
    optimizationTarget,
    revenueCategories,
    revenueGroupOrder,
  ]);

  useEffect(() => {
    if (!uid) {
      setOptimizationAvailability({
        expense: false,
        revenue: false,
        loading: false,
      });
      return;
    }

    let active = true;
    const previousMonth = dayjs().subtract(1, 'month').format('MM/YYYY');

    setOptimizationAvailability(previous => ({
      ...previous,
      loading: true,
    }));

    Promise.all([
      getUserInvoices(uid, previousMonth),
      getUserRevenues(uid, previousMonth),
    ])
      .then(([previousMonthExpenses, previousMonthRevenues]) => {
        if (!active) {
          return;
        }

        setOptimizationAvailability({
          expense: previousMonthExpenses.length > 0,
          revenue: previousMonthRevenues.length > 0,
          loading: false,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setOptimizationAvailability({
          expense: false,
          revenue: false,
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const resetDialogState = () => {
    setExpenseLabel('');
    setRevenueLabel('');
    setExpenseGroup('');
    setRevenueGroup('');
  };

  const handleOpenCreateDialogWithGroup = (group: string) => {
    resetDialogState();

    if (tabSelected === 0) {
      setExpenseGroup(group);
    } else {
      setRevenueGroup(group);
    }

    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    resetDialogState();
  };

  const handleCloseOptimizationDialog = () => {
    setOptimizationDialogOpen(false);
    setOptimizationLoading(false);
    setOptimizationPreview(null);
    setApplySuggestedOrdering(true);
    setApplyUnusedCleanup(false);
  };

  const addExpenseCategoryByValue = async (category: CategoryOption, fromDefault = false) => {
    const normalizedLabel = normalizeCategoryLabel(category.label || '');

    if (!normalizedLabel) {
      enqueueSnackbar('Informe o nome da categoria de despesa.', {
        variant: 'warning',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }

    if (expenseCustomLabels.has(normalizedLabel)) {
      enqueueSnackbar('Essa categoria de despesa ja existe na lista.', {
        variant: 'info',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }

    try {
      await addExpenseCategory(category);

      enqueueSnackbar(
        fromDefault ? 'Categoria adicionada ao seu conjunto personalizado.' : 'Categoria de despesa salva.',
        {
          variant: 'success',
          autoHideDuration: 2000,
          anchorOrigin: { horizontal: 'center', vertical: 'top' },
        },
      );
      return true;
    } catch {
      enqueueSnackbar('Não foi possível salvar a categoria de despesa.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }
  };

  const addRevenueCategoryByValue = async (category: CategoryOption, fromDefault = false) => {
    const normalizedLabel = normalizeCategoryLabel(category.label || '');

    if (!normalizedLabel) {
      enqueueSnackbar('Informe o nome da categoria de receita.', {
        variant: 'warning',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }

    if (revenueCustomLabels.has(normalizedLabel)) {
      enqueueSnackbar('Essa categoria de receita ja existe na lista.', {
        variant: 'info',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }

    try {
      await addRevenueCategory(category);

      enqueueSnackbar(
        fromDefault ? 'Categoria adicionada ao seu conjunto personalizado.' : 'Categoria de receita salva.',
        {
          variant: 'success',
          autoHideDuration: 2000,
          anchorOrigin: { horizontal: 'center', vertical: 'top' },
        },
      );
      return true;
    } catch {
      enqueueSnackbar('Não foi possível salvar a categoria de receita.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      return false;
    }
  };

  const handleSaveExpenseCategory = async () => {
    const created = await addExpenseCategoryByValue({
      label: expenseLabel.trim(),
      group: expenseGroup.trim() || undefined,
    });

    if (created) {
      handleCloseCreateDialog();
    }
  };

  const handleSaveRevenueCategory = async () => {
    const created = await addRevenueCategoryByValue({
      label: revenueLabel.trim(),
      group: revenueGroup.trim() || undefined,
    });

    if (created) {
      handleCloseCreateDialog();
    }
  };

  const handleDeleteExpenseCategory = async (label: string) => {
    try {
      await removeExpenseCategory(label);
      enqueueSnackbar('Categoria de despesa removida.', {
        variant: 'success',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    } catch {
      enqueueSnackbar('Não foi possível remover a categoria de despesa.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleDeleteRevenueCategory = async (label: string) => {
    try {
      await removeRevenueCategory(label);
      enqueueSnackbar('Categoria de receita removida.', {
        variant: 'success',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    } catch {
      enqueueSnackbar('Não foi possível remover a categoria de receita.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleReorderExpenseCategories = async (activeId: string, overId: string) => {
    try {
      await reorderExpenseCategories(activeId, overId);
    } catch {
      enqueueSnackbar('Não foi possível reordenar as categorias de despesa.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleReorderRevenueCategories = async (activeId: string, overId: string) => {
    try {
      await reorderRevenueCategories(activeId, overId);
    } catch {
      enqueueSnackbar('Não foi possível reordenar as categorias de receita.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleReorderExpenseGroups = async (activeId: string, overId: string) => {
    try {
      await reorderExpenseGroups(activeId, overId);
    } catch {
      enqueueSnackbar('Não foi possível reordenar os agrupamentos de despesa.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleReorderRevenueGroups = async (activeId: string, overId: string) => {
    try {
      await reorderRevenueGroups(activeId, overId);
    } catch {
      enqueueSnackbar('Não foi possível reordenar os agrupamentos de receita.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const handleOpenOptimizationDialog = async (target: CategoryKind) => {
    if (!uid) {
      return;
    }

    setOptimizationTarget(target);
    setOptimizationDialogOpen(true);
    setOptimizationLoading(true);
    setOptimizationPreview(null);

    try {
      const recentMonths = getRecentMonths(6);

      if (target === 'expense') {
        const invoicesByMonth = await Promise.all(recentMonths.map(month => getUserInvoices(uid, month)));
        const preview = buildCategoryOptimization({
          type: 'expense',
          defaultCategories: defaultExpenseCategories,
          customCategories: expenseCategories,
          currentGroupOrder: expenseGroupOrder,
          historyCategoryLabels: invoicesByMonth.flat().map(invoice => invoice.invoiceCategory).filter(Boolean),
          fallbackGroup: 'Sem grupo',
        });

        setOptimizationPreview(preview);
        setApplySuggestedOrdering(true);
        setApplyUnusedCleanup(preview.unusedCustomLabels.length > 0);
      } else {
        const revenuesByMonth = await Promise.all(recentMonths.map(month => getUserRevenues(uid, month)));
        const preview = buildCategoryOptimization({
          type: 'revenue',
          defaultCategories: defaultRevenueCategories,
          customCategories: revenueCategories,
          currentGroupOrder: revenueGroupOrder,
          historyCategoryLabels: revenuesByMonth.flat().map(revenue => revenue.revenueCategory).filter(Boolean),
          fallbackGroup: 'Receitas',
        });

        setOptimizationPreview(preview);
        setApplySuggestedOrdering(true);
        setApplyUnusedCleanup(preview.unusedCustomLabels.length > 0);
      }
    } catch {
      enqueueSnackbar('Não foi possível analisar os últimos 6 meses.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      handleCloseOptimizationDialog();
    } finally {
      setOptimizationLoading(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimizationPreview || (!applySuggestedOrdering && !applyUnusedCleanup)) {
      return;
    }

    try {
      const isExpense = optimizationTarget === 'expense';
      const currentCategories = isExpense ? expenseCategories : revenueCategories;
      const defaultCategories = isExpense ? defaultExpenseCategories : defaultRevenueCategories;
      const currentGroupOrder = isExpense ? expenseGroupOrder : revenueGroupOrder;
      const unusedLabels = new Set(optimizationPreview.unusedCustomLabels.map(label => normalizeCategoryLabel(label)));

      let nextCategories = applyUnusedCleanup
        ? currentCategories.filter(category => !unusedLabels.has(normalizeCategoryLabel(category.label)))
        : [...currentCategories];

      if (applySuggestedOrdering) {
        const suggestedCategories = optimizationPreview.suggestedCategories.filter(
          category => !applyUnusedCleanup || !unusedLabels.has(normalizeCategoryLabel(category.label)),
        );
        const suggestedLabels = new Set(suggestedCategories.map(category => normalizeCategoryLabel(category.label)));
        const remainingCategories = nextCategories.filter(
          category => !suggestedLabels.has(normalizeCategoryLabel(category.label)),
        );

        nextCategories = [...suggestedCategories, ...remainingCategories];
      }

      const preferredGroupOrder = applySuggestedOrdering
        ? optimizationPreview.suggestedGroupOrder
        : currentGroupOrder;

      const nextGroupOrder = normalizeGroupOrder(
        preferredGroupOrder,
        mergeCategoriesByUserOrder(defaultCategories, nextCategories, optimizationTarget, preferredGroupOrder),
        optimizationTarget,
      );

      if (isExpense) {
        await updateExpenseOrganization(nextCategories, nextGroupOrder);
      } else {
        await updateRevenueOrganization(nextCategories, nextGroupOrder);
      }

      enqueueSnackbar('Otimização aplicada.', {
        variant: 'success',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
      handleCloseOptimizationDialog();
    } catch {
      enqueueSnackbar('Não foi possível aplicar a otimização.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  const optimizationButtonProps = useMemo(
    () => ({
      expense: {
        visible: optimizationAvailability.expense && !optimizationAvailability.loading,
        onClick: () => handleOpenOptimizationDialog('expense'),
      },
      revenue: {
        visible: optimizationAvailability.revenue && !optimizationAvailability.loading,
        onClick: () => handleOpenOptimizationDialog('revenue'),
      },
    }),
    [optimizationAvailability],
  );

  return (
    <>
      <Head>
        <title>Configurações</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <LayoutMobile tabSelected='/settings'>
        <Box
          sx={{
            maxWidth: 1080,
            mx: 'auto',
            px: { xs: 1.3, sm: 2 },
            width: '100%',
          }}
        >
          <Stack spacing={2}>
            <Card
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(6, 42, 63, 0.08)',
                background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
                color: '#eefcff',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: 24, sm: 28 }, lineHeight: 1.15 }}>
                      Configurações de categorias
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 52,
                      minHeight: 52,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#eefcff',
                      backgroundColor: 'rgba(238, 252, 255, 0.12)',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <SettingsRoundedIcon />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card
              variant='outlined'
              sx={{
                borderRadius: 4,
                borderColor: 'rgba(6, 42, 63, 0.10)',
                boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
              }}
            >
              <CardContent sx={{ p: { xs: 1.4, sm: 1.8 } }}>
                <Tabs
                  value={tabSelected}
                  onChange={(_event, newValue) => setTabSelected(newValue)}
                  variant='fullWidth'
                  sx={{
                    mb: 1,
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #0f6a72 0%, #15917c 100%)',
                    },
                  }}
                >
                  <Tab label='Despesas' />
                  <Tab label='Receitas' />
                </Tabs>

                {loadingCategories ? (
                  <Stack alignItems='center' justifyContent='center' sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                  </Stack>
                ) : (
                  <>
                    <TabPanel value={tabSelected} index={0}>
                      <Stack spacing={2} sx={{ pt: 1 }}>
                        <CategoryManagementSection
                          title='Categorias de despesa'
                          groups={expenseGroups}
                          emptyText='Nenhuma categoria disponível.'
                          headerAction={
                            optimizationButtonProps.expense.visible ? (
                              <Button
                                size='small'
                                variant='outlined'
                                startIcon={<AutoFixHighRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={optimizationButtonProps.expense.onClick}
                                sx={{
                                  borderRadius: 999,
                                  minWidth: 0,
                                  whiteSpace: 'nowrap',
                                  borderColor: 'rgba(15, 106, 114, 0.18)',
                                  color: '#0f6a72',
                                }}
                              >
                                Otimizar ordenações
                              </Button>
                            ) : null
                          }
                          onAdd={category => addExpenseCategoryByValue(category, true)}
                          onCreateInGroup={handleOpenCreateDialogWithGroup}
                          onDelete={handleDeleteExpenseCategory}
                          onReorder={handleReorderExpenseCategories}
                          onGroupReorder={handleReorderExpenseGroups}
                        />
                      </Stack>
                    </TabPanel>

                    <TabPanel value={tabSelected} index={1}>
                      <Stack spacing={2} sx={{ pt: 1 }}>
                        <CategoryManagementSection
                          title='Categorias de receita'
                          groups={revenueGroups}
                          emptyText='Nenhuma categoria disponível.'
                          headerAction={
                            optimizationButtonProps.revenue.visible ? (
                              <Button
                                size='small'
                                variant='outlined'
                                startIcon={<AutoFixHighRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={optimizationButtonProps.revenue.onClick}
                                sx={{
                                  borderRadius: 999,
                                  minWidth: 0,
                                  whiteSpace: 'nowrap',
                                  borderColor: 'rgba(15, 106, 114, 0.18)',
                                  color: '#0f6a72',
                                }}
                              >
                                Otimizar ordenações
                              </Button>
                            ) : null
                          }
                          onAdd={category => addRevenueCategoryByValue(category, true)}
                          onCreateInGroup={handleOpenCreateDialogWithGroup}
                          onDelete={handleDeleteRevenueCategory}
                          onReorder={handleReorderRevenueCategories}
                          onGroupReorder={handleReorderRevenueGroups}
                        />
                      </Stack>
                    </TabPanel>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>

        <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} fullWidth maxWidth='xs'>
          <DialogTitle sx={{ fontWeight: 700, color: '#123047' }}>
            {tabSelected === 0 ? 'Nova categoria de despesa' : 'Nova categoria de receita'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Autocomplete<string, false, false, true>
                freeSolo
                options={tabSelected === 0 ? expenseGroupOptions : revenueGroupOptions}
                value={
                  (tabSelected === 0 ? expenseGroupOptions : revenueGroupOptions).includes(
                    tabSelected === 0 ? expenseGroup : revenueGroup,
                  )
                    ? tabSelected === 0
                      ? expenseGroup
                      : revenueGroup
                    : null
                }
                inputValue={tabSelected === 0 ? expenseGroup : revenueGroup}
                clearOnBlur={false}
                onChange={(_event, value) => {
                  if (typeof value === 'string') {
                    if (tabSelected === 0) {
                      setExpenseGroup(value);
                    } else {
                      setRevenueGroup(value);
                    }
                  }
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    if (tabSelected === 0) {
                      setExpenseGroup(value);
                    } else {
                      setRevenueGroup(value);
                    }
                  }
                }}
                renderInput={(params) => <TextField {...params} label='Agrupamento' size='small' fullWidth />}
              />

              <TextField
                label='Categoria'
                size='small'
                fullWidth
                value={tabSelected === 0 ? expenseLabel : revenueLabel}
                onChange={event => {
                  if (tabSelected === 0) {
                    setExpenseLabel(event.target.value);
                  } else {
                    setRevenueLabel(event.target.value);
                  }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseCreateDialog}>Cancelar</Button>
            <Button
              variant='contained'
              onClick={tabSelected === 0 ? handleSaveExpenseCategory : handleSaveRevenueCategory}
              sx={{
                borderRadius: 999,
                px: 2,
                background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
              }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={optimizationDialogOpen}
          onClose={optimizationLoading ? undefined : handleCloseOptimizationDialog}
          fullWidth
          maxWidth='sm'
        >
          <DialogTitle sx={{ fontWeight: 700, color: '#123047' }}>
            {optimizationTarget === 'expense'
              ? 'Otimizar ordenações de despesas'
              : 'Otimizar ordenações de receitas'}
          </DialogTitle>
          <DialogContent>
            {optimizationLoading ? (
              <Stack alignItems='center' justifyContent='center' spacing={1.5} sx={{ py: 4 }}>
                <CircularProgress size={28} />
                <Typography sx={{ color: '#527287' }}>
                  Analisando os últimos 6 meses desta aba...
                </Typography>
              </Stack>
            ) : optimizationPreview ? (
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(15, 106, 114, 0.06)',
                    border: '1px solid rgba(15, 106, 114, 0.10)',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: '#123047', mb: 0.5 }}>
                    Resumo da análise
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: '#527287' }}>
                    Foram avaliados {optimizationPreview.totalEntries} lançamentos dos últimos 6 meses para sugerir
                    uma ordem mais coerente com o uso real.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: 3,
                    border: '1px solid rgba(8, 43, 67, 0.08)',
                    backgroundColor: 'rgba(8, 43, 67, 0.02)',
                  }}
                >
                  <Stack spacing={0.25} sx={{ mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, color: '#123047' }}>O que você quer aplicar?</Typography>
                    <Typography sx={{ fontSize: 13, color: '#607d92' }}>
                      A prévia abaixo muda em tempo real conforme você marca as opções.
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={applySuggestedOrdering}
                          onChange={event => setApplySuggestedOrdering(event.target.checked)}
                        />
                      }
                      label='Aplicar a nova ordenação sugerida'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={applyUnusedCleanup}
                          disabled={optimizationPreview.unusedCustomLabels.length === 0}
                          onChange={event => setApplyUnusedCleanup(event.target.checked)}
                        />
                      }
                      label={
                        optimizationPreview.unusedCustomLabels.length > 0
                          ? `Excluir ${optimizationPreview.unusedCustomLabels.length} categorias sem uso nos últimos 6 meses`
                          : 'Não há categorias personalizadas sem uso para exclusão'
                      }
                    />
                  </Stack>
                </Box>

                {optimizationComparison ? (
                  <>
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 700, color: '#123047' }}>Agrupamentos</Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                          gap: 1.2,
                        }}
                      >
                        <OptimizationOrderColumn
                          title='Como está'
                          items={optimizationComparison.currentVisibleGroups}
                          movedItemIds={optimizationComparison.movedGroupIds}
                          emptyText='Nenhum agrupamento disponível.'
                        />
                        <OptimizationOrderColumn
                          title='Como fica'
                          items={optimizationComparison.nextVisibleGroups}
                          movedItemIds={optimizationComparison.movedGroupIds}
                          emptyText='Nenhum agrupamento disponível.'
                          accent='highlight'
                        />
                      </Box>
                    </Stack>

                    <Stack spacing={1}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#123047' }}>Categorias personalizadas</Typography>
                        <Typography sx={{ fontSize: 13, color: '#607d92' }}>
                          Essa comparação considera apenas as categorias criadas por você.
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                          gap: 1.2,
                        }}
                      >
                        <OptimizationOrderColumn
                          title='Como está'
                          items={optimizationComparison.currentCustomCategories}
                          movedItemIds={optimizationComparison.movedCategoryIds}
                          emptyText='Você ainda não tem categorias personalizadas.'
                        />
                        <OptimizationOrderColumn
                          title='Como fica'
                          items={optimizationComparison.nextCustomCategories}
                          movedItemIds={optimizationComparison.movedCategoryIds}
                          emptyText='Nenhuma categoria personalizada permanecerá após essa ação.'
                          accent='highlight'
                        />
                      </Box>
                    </Stack>
                  </>
                ) : null}

                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700, color: '#123047' }}>Mais usadas</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {optimizationPreview.topGroups.slice(0, 3).map(group => (
                      <Chip key={group.label} label={`${group.label} (${group.count})`} size='small' />
                    ))}
                    {optimizationPreview.topCategories.slice(0, 5).map(category => (
                      <Chip
                        key={category.label}
                        label={`${category.label} (${category.count})`}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                </Stack>

                {optimizationPreview.unusedCustomLabels.length > 0 ? (
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700, color: '#123047' }}>Sem uso nos últimos 6 meses</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {optimizationPreview.unusedCustomLabels.slice(0, 8).map(label => (
                        <Chip key={label} label={label} size='small' color='warning' variant='outlined' />
                      ))}
                    </Box>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseOptimizationDialog}>Cancelar</Button>
            <Button
              variant='contained'
              disabled={
                optimizationLoading ||
                !optimizationPreview ||
                (!applySuggestedOrdering && !applyUnusedCleanup)
              }
              onClick={handleApplyOptimization}
              sx={{
                borderRadius: 999,
                px: 2,
                background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
              }}
            >
              Aplicar
            </Button>
          </DialogActions>
        </Dialog>
      </LayoutMobile>
    </>
  );
}
