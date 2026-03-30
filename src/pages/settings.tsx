import React, { useContext, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
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
import { useProtectPage } from '../hooks/useAuth';
import { getCategoryId } from '../utils/categoryCollections';
import { getCategoryGroupLabel } from '../utils/categoryGroupLabels';
import {
  mergeCategoriesByUserOrder,
  sortGroupNamesByPriority,
  type CategoryKind,
} from '../utils/categoryOrdering';

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

export default function Settings() {
  useProtectPage();

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
  } = useContext(CategoriesContext);

  const [tabSelected, setTabSelected] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseGroup, setExpenseGroup] = useState('');
  const [revenueLabel, setRevenueLabel] = useState('');
  const [revenueGroup, setRevenueGroup] = useState('');

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
      enqueueSnackbar('Nao foi possivel salvar a categoria de despesa.', {
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
      enqueueSnackbar('Nao foi possivel salvar a categoria de receita.', {
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
      enqueueSnackbar('Nao foi possivel remover a categoria de despesa.', {
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
      enqueueSnackbar('Nao foi possivel remover a categoria de receita.', {
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
      enqueueSnackbar('Nao foi possivel reordenar as categorias de despesa.', {
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
      enqueueSnackbar('Nao foi possivel reordenar as categorias de receita.', {
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
      enqueueSnackbar('Nao foi possivel reordenar os agrupamentos de despesa.', {
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
      enqueueSnackbar('Nao foi possivel reordenar os agrupamentos de receita.', {
        variant: 'error',
        autoHideDuration: 2000,
        anchorOrigin: { horizontal: 'center', vertical: 'top' },
      });
    }
  };

  return (
    <>
      <Head>
        <title>Configuracoes</title>
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
                      Configuracoes de categorias
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
                          emptyText='Nenhuma categoria disponivel.'
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
                          emptyText='Nenhuma categoria disponivel.'
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
      </LayoutMobile>
    </>
  );
}
