import React, { useCallback, useContext, useMemo, useState } from 'react';
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
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import { useSnackbar } from 'notistack';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import { DeleteTransactionDialog } from '../components/DeleteTransactionDialog';
import { RecurringTransactionsButton } from '../components/RecurringTransactions';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { LoadingTransactionsPage } from '../components/SkeletonLoadingTransactionsPage';
import { ExpensesContext } from '../contexts/expenses';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { useAuth, useProtectPage } from '../hooks/useAuth';
import { deleteExpenseAndFuture, getFutureSeriesExpenses } from '../providers/invoices/deletion';
import { IInvoice } from '../providers/invoices/types';
import { formatterCurrency } from '../utils/formatters';
import { filterTransactions } from '../utils/transactionSearch';
import { ExpensesTable } from '../components/ExpensesTable';
import { useOfflineSync } from '../contexts/offlineSync';

export default function Expenses() {
  useProtectPage();
  const { uid } = useAuth();
  const loadFuture = useCallback((invoice: IInvoice) => getFutureSeriesExpenses(uid, invoice), [uid]);

  const { enqueueSnackbar } = useSnackbar();
  const { invoices, handleDeleteInvoice, monthlyExpenses, loadingGetInvoices } = useContext(ExpensesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);
  const { online } = useOfflineSync();

  const [searchText, setSearchText] = useState('');
  const [editInvoiceModal, setEditInvoiceModal] = useState<{
    open: boolean;
    invoice: IInvoice | undefined;
  }>({
    open: false,
    invoice: undefined,
  });

  const [deletingInvoice, setDeletingInvoice] = useState<IInvoice | null>(null);

  const filteredInvoices = useMemo(() => filterTransactions(invoices, searchText), [invoices, searchText]);

  const monthLabel = useMemo(() => {
    return dateToAnalyze.format('MMMM [de] YYYY');
  }, [dateToAnalyze]);

  const categoryCount = useMemo(() => {
    const categories = new Set(filteredInvoices.map(invoice => invoice.invoiceCategory));
    return categories.size;
  }, [filteredInvoices]);

  const infoCardSx = {
    borderRadius: 4,
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow)',
  };

  const handleCloseModalDeleteInvoice = () => {
    setDeletingInvoice(null);
  };

  return (
    <>
      <Head>
        <title>Despesas</title>
      </Head>
      <LayoutMobile tabSelected='/expenses'>
        {loadingGetInvoices ? (
          <LoadingTransactionsPage type='expenses' />
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
                        Despesas
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
                          {formatterCurrency(monthlyExpenses)}
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
                          color: 'var(--primary-text)',
                          background: 'var(--primary-soft)',
                        }}
                      >
                        <PaidRoundedIcon />
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
                          {filteredInvoices.length}
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
                    <RecurringTransactionsButton kind='expense' />
                    <TextField
                      size='small'
                      label='Buscar por qualquer informação'
                      placeholder='Valor, categoria, descrição, data...'
                      value={searchText}
                      onChange={event => setSearchText(event.target.value)}
                      fullWidth
                    />

                    <ExpensesTable
                      invoices={filteredInvoices}
                      canManage={online}
                      onEdit={invoice => setEditInvoiceModal({ invoice, open: true })}
                      onDelete={id => setDeletingInvoice(invoices.find(entry => entry.id === id) ?? null)}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        <AddInvoiceModal
          invoice={editInvoiceModal.invoice}
          open={editInvoiceModal.open}
          handleClose={() => setEditInvoiceModal({ ...editInvoiceModal, open: false })}
        />

        <DeleteTransactionDialog
          transaction={deletingInvoice} kind='expense' onClose={handleCloseModalDeleteInvoice}
          onLoadFuture={loadFuture}
          onConfirm={async (id, options) => {
            let count = 1;
            if (options?.includeFuture && deletingInvoice) count = (await deleteExpenseAndFuture(uid, deletingInvoice, options.futureIds ?? [])).length;
            else await handleDeleteInvoice(id);
            enqueueSnackbar(count > 1 ? `${count} lançamentos removidos` : 'Despesa removida', {
              autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' },
            });
          }}
        />
      </LayoutMobile>
    </>
  );
}
