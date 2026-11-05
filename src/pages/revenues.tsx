import React, { useContext, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useSnackbar } from 'notistack';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import { DeleteTransactionDialog } from '../components/DeleteTransactionDialog';
import { RecurringTransactionsButton } from '../components/RecurringTransactions';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { LoadingTransactionsPage } from '../components/SkeletonLoadingTransactionsPage';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { RevenuesContext } from '../contexts/revenues';
import { useProtectPage } from '../hooks/useAuth';
import { IRevenue } from '../providers/revenues/types';
import { formatterCurrency } from '../utils/formatters';
import { filterTransactions } from '../utils/transactionSearch';
import { useOfflineSync } from '../contexts/offlineSync';
import { RevenuesTable } from '../components/RevenuesTable';

export default function Revenues() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { revenues, handleDeleteRevenue, monthlyRevenues, loadingGetRevenues } = useContext(RevenuesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);
  const { online } = useOfflineSync();

  const [searchText, setSearchText] = useState('');
  const [editRevenueModal, setEditRevenueModal] = useState<{
    open: boolean;
    revenue: IRevenue | undefined;
  }>({
    open: false,
    revenue: undefined,
  });

  const [deletingRevenue, setDeletingRevenue] = useState<IRevenue | null>(null);

  const filteredRevenues = useMemo(() => filterTransactions(revenues, searchText), [revenues, searchText]);

  const monthLabel = useMemo(() => {
    return dateToAnalyze.format('MMMM [de] YYYY');
  }, [dateToAnalyze]);

  const categoryCount = useMemo(() => {
    const categories = new Set(filteredRevenues.map(revenue => revenue.revenueCategory));
    return categories.size;
  }, [filteredRevenues]);

  const infoCardSx = {
    borderRadius: 4,
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow)',
  };

  const handleCloseModalDeleteRevenue = () => {
    setDeletingRevenue(null);
  };


  return (
    <>
      <Head>
        <title>Receitas</title>
      </Head>
      <LayoutMobile tabSelected='/revenues'>
        {loadingGetRevenues ? (
          <LoadingTransactionsPage type='revenues' />
        ) : (
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
                  border: '1px solid var(--border)',
                  background: 'var(--hero)',
                  color: 'var(--nav-text)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' spacing={1.3}>
                    <Box>
                      <Typography sx={{ opacity: 0.88, fontSize: 13 }}>Visão mensal</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 24, sm: 28 }, lineHeight: 1.15 }}>
                        Receitas
                      </Typography>
                    </Box>
                    <Chip
                      label={monthLabel}
                      sx={{
                        color: 'var(--nav-muted)',
                        borderColor: 'rgba(213, 248, 255, .45)',
                        backgroundColor: 'rgba(213, 248, 255, .12)',
                        textTransform: 'capitalize',
                        maxWidth: 'fit-content',
                      }}
                      variant='outlined'
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Card variant='outlined' sx={infoCardSx}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            letterSpacing: '.04em',
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                          }}
                        >
                          Total no mês
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: 'var(--text)' }}>
                          {formatterCurrency(monthlyRevenues)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          minWidth: 42,
                          minHeight: 42,
                          borderRadius: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--income-text)',
                          background: 'var(--income-soft)',
                        }}
                      >
                        <TrendingUpRoundedIcon />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant='outlined' sx={infoCardSx}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            letterSpacing: '.04em',
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                          }}
                        >
                          Lançamentos
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: 'var(--text)' }}>
                          {filteredRevenues.length}
                        </Typography>
                        <Typography sx={{ mt: 0.6, fontSize: 13, color: 'var(--muted)' }}>
                          {categoryCount} categorias
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          minWidth: 42,
                          minHeight: 42,
                          borderRadius: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--secondary-text)',
                          background: 'var(--secondary-soft)',
                        }}
                      >
                        <InsightsRoundedIcon />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Card variant='outlined' sx={infoCardSx}>
                <CardContent sx={{ p: { xs: 1.2, sm: 1.8 } }}>
                  <Stack spacing={1.2}>
                    <RecurringTransactionsButton kind='revenue' />
                    <TextField
                      size='small'
                      label='Buscar por qualquer informação'
                      placeholder='Valor, categoria, descrição, data...'
                      value={searchText}
                      onChange={event => setSearchText(event.target.value)}
                      fullWidth
                    />

                    <RevenuesTable
                      revenues={filteredRevenues} canManage={online}
                      onEdit={revenue => setEditRevenueModal({ revenue, open: true })}
                      onDelete={id => setDeletingRevenue(revenues.find(entry => entry.id === id) ?? null)}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        <AddInvoiceModal
          revenue={editRevenueModal.revenue}
          open={editRevenueModal.open}
          handleClose={() => setEditRevenueModal({ ...editRevenueModal, open: false })}
        />

        <DeleteTransactionDialog
          transaction={deletingRevenue} kind='revenue' onClose={handleCloseModalDeleteRevenue}
          onConfirm={async id => {
            await handleDeleteRevenue(id);
            enqueueSnackbar('Receita removida', {
              autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          }}
        />
      </LayoutMobile>
    </>
  );
}
