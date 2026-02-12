import React, { useContext, useMemo, useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BorderColorIcon from '@mui/icons-material/BorderColorOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import dayjs from 'dayjs';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { LoadingTransactionsPage } from '../components/SkeletonLoadingTransactionsPage';
import { ExpensesContext } from '../contexts/expenses';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { useProtectPage } from '../hooks/useAuth';
import { IInvoice } from '../providers/invoices/types';
import { formatterCurrency } from '../utils/formatters';

export default function Expenses() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { invoices, handleDeleteInvoice, monthlyExpenses, loadingGetInvoices } = useContext(ExpensesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);

  const [searchText, setSearchText] = useState('');
  const [editInvoiceModal, setEditInvoiceModal] = useState<{
    open: boolean;
    invoice: IInvoice | undefined;
  }>({
    open: false,
    invoice: undefined,
  });

  const [openModalDeleteInvoice, setOpenModalDeleteInvoice] = useState({
    open: false,
    invoiceId: '',
  });

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return invoices;
    }

    return invoices.filter(invoice => {
      const category = invoice.invoiceCategory?.toLowerCase() ?? '';
      const description = invoice.description?.toLowerCase() ?? '';
      const addDate = invoice.addDate?.format('DD/MM/YYYY') ?? '';

      return category.includes(normalizedSearch) || description.includes(normalizedSearch) || addDate.includes(normalizedSearch);
    });
  }, [invoices, searchText]);

  const monthLabel = useMemo(() => {
    return dateToAnalyze.format('MMMM [de] YYYY');
  }, [dateToAnalyze]);

  const categoryCount = useMemo(() => {
    const categories = new Set(filteredInvoices.map(invoice => invoice.invoiceCategory));
    return categories.size;
  }, [filteredInvoices]);

  const handleCloseModalDeleteInvoice = () => {
    setOpenModalDeleteInvoice({ invoiceId: '', open: false });
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceCategory',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 170,
    },
    {
      field: 'value',
      headerName: 'Valor',
      minWidth: 130,
      renderCell: ({ value }: any) => (
        <Typography sx={{ fontWeight: 700, color: '#0f4f63' }}>
          {formatterCurrency(value)}
        </Typography>
      ),
    },
    {
      field: 'addDate',
      headerName: 'Data',
      minWidth: 120,
      renderCell: ({ value }: any) => dayjs(value).format('DD/MM/YYYY'),
    },
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'id',
      headerName: 'Ações',
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }: any) => (
        <>
          <IconButton color='primary' onClick={() => setEditInvoiceModal({ invoice: row, open: true })}>
            <Tooltip title='Editar despesa'>
              <BorderColorIcon fontSize='small' />
            </Tooltip>
          </IconButton>
          <IconButton color='error' onClick={() => setOpenModalDeleteInvoice({ open: true, invoiceId: row.id })}>
            <Tooltip title='Excluir despesa'>
              <DeleteOutlineIcon fontSize='small' />
            </Tooltip>
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Despesas</title>
        <link rel='icon' href='/favicon.ico' />
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
                  border: '1px solid rgba(6, 42, 63, 0.08)',
                  background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
                  color: '#eefcff',
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
                        color: '#d5f8ff',
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
                  gap: 1.5,
                }}
              >
                <Card variant='outlined' sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: '#577084' }}>Total no mês</Typography>
                        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#102435' }}>
                          {formatterCurrency(monthlyExpenses)}
                        </Typography>
                      </Box>
                      <PaidRoundedIcon sx={{ color: '#0f6a72' }} />
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant='outlined' sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: '#577084' }}>Lançamentos</Typography>
                        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#102435' }}>
                          {filteredInvoices.length}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#6d8698' }}>
                          {categoryCount} categorias
                        </Typography>
                      </Box>
                      <InsightsRoundedIcon sx={{ color: '#0f6a72' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Card variant='outlined' sx={{ borderRadius: 4, borderColor: 'rgba(6, 42, 63, 0.08)' }}>
                <CardContent sx={{ p: { xs: 1.2, sm: 1.8 } }}>
                  <Stack spacing={1.2}>
                    <TextField
                      size='small'
                      label='Buscar por categoria, descrição ou data'
                      value={searchText}
                      onChange={event => setSearchText(event.target.value)}
                      fullWidth
                    />

                    <Box sx={{ width: '100%' }}>
                      <DataGrid
                        autoHeight
                        rows={filteredInvoices}
                        columns={columns}
                        pageSize={12}
                        rowsPerPageOptions={[12, 25, 50]}
                        disableSelectionOnClick
                        localeText={{ noRowsLabel: 'Nenhuma despesa encontrada.' }}
                        sx={{
                          border: '1px solid rgba(16, 50, 72, 0.12)',
                          borderRadius: 3,
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#eef8fc',
                            color: '#123047',
                            borderBottom: '1px solid rgba(16, 50, 72, 0.12)',
                          },
                          '& .MuiDataGrid-row:nth-of-type(even)': {
                            backgroundColor: '#f8fcff',
                          },
                        }}
                      />
                    </Box>
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

        <Dialog
          open={openModalDeleteInvoice.open}
          onClose={handleCloseModalDeleteInvoice}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>
            Tem certeza que deseja deletar esta despesa?
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseModalDeleteInvoice}>Cancelar</Button>
            <Button
              onClick={async () => {
                await handleDeleteInvoice(openModalDeleteInvoice.invoiceId);
                handleCloseModalDeleteInvoice();
                enqueueSnackbar('Despesa removida', {
                  autoHideDuration: 2000,
                  variant: 'success',
                  anchorOrigin: { horizontal: 'center', vertical: 'top' },
                });
              }}
            >
              Deletar
            </Button>
          </DialogActions>
        </Dialog>
      </LayoutMobile>
    </>
  );
}
