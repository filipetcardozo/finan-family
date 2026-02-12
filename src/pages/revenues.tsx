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
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import dayjs from 'dayjs';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { LoadingTransactionsPage } from '../components/SkeletonLoadingTransactionsPage';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { RevenuesContext } from '../contexts/revenues';
import { useProtectPage } from '../hooks/useAuth';
import { IRevenue } from '../providers/revenues/types';
import { formatterCurrency } from '../utils/formatters';

export default function Revenues() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { revenues, handleDeleteRevenue, monthlyRevenues, loadingGetRevenues } = useContext(RevenuesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);

  const [searchText, setSearchText] = useState('');
  const [editRevenueModal, setEditRevenueModal] = useState<{
    open: boolean;
    revenue: IRevenue | undefined;
  }>({
    open: false,
    revenue: undefined,
  });

  const [openModalDeleteRevenue, setOpenModalDeleteRevenue] = useState({
    open: false,
    revenueId: '',
  });

  const filteredRevenues = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return revenues;
    }

    return revenues.filter(revenue => {
      const category = revenue.revenueCategory?.toLowerCase() ?? '';
      const description = revenue.description?.toLowerCase() ?? '';
      const addDate = revenue.addDate?.format('DD/MM/YYYY') ?? '';

      return category.includes(normalizedSearch) || description.includes(normalizedSearch) || addDate.includes(normalizedSearch);
    });
  }, [revenues, searchText]);

  const monthLabel = useMemo(() => {
    return dateToAnalyze.format('MMMM [de] YYYY');
  }, [dateToAnalyze]);

  const categoryCount = useMemo(() => {
    const categories = new Set(filteredRevenues.map(revenue => revenue.revenueCategory));
    return categories.size;
  }, [filteredRevenues]);

  const infoCardSx = {
    borderRadius: 4,
    borderColor: 'rgba(6, 42, 63, 0.10)',
    boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
  };

  const handleCloseModalDeleteRevenue = () => {
    setOpenModalDeleteRevenue({ revenueId: '', open: false });
  };

  const columns: GridColDef[] = [
    {
      field: 'revenueCategory',
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
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'addDate',
      headerName: 'Data',
      minWidth: 120,
      renderCell: ({ value }: any) => dayjs(value).format('DD/MM/YYYY'),
    },
    {
      field: 'id',
      headerName: 'Ações',
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }: any) => (
        <>
          <IconButton color='primary' onClick={() => setEditRevenueModal({ revenue: row, open: true })}>
            <Tooltip title='Editar receita'>
              <BorderColorIcon fontSize='small' />
            </Tooltip>
          </IconButton>
          <IconButton color='error' onClick={() => setOpenModalDeleteRevenue({ open: true, revenueId: row.id })}>
            <Tooltip title='Excluir receita'>
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
        <title>Receitas</title>
        <link rel='icon' href='/favicon.ico' />
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
                        Receitas
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
                            color: '#567086',
                          }}
                        >
                          Total no mês
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: '#102435' }}>
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
                          color: '#127a49',
                          background: '#127a4918',
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
                            color: '#567086',
                          }}
                        >
                          Lançamentos
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: '#102435' }}>
                          {filteredRevenues.length}
                        </Typography>
                        <Typography sx={{ mt: 0.6, fontSize: 13, color: '#607d92' }}>
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
                          color: '#3f5e91',
                          background: '#3f5e9118',
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
                        rows={filteredRevenues}
                        columns={columns}
                        pageSize={12}
                        rowsPerPageOptions={[12, 25, 50]}
                        disableSelectionOnClick
                        localeText={{ noRowsLabel: 'Nenhuma receita encontrada.' }}
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
          revenue={editRevenueModal.revenue}
          open={editRevenueModal.open}
          handleClose={() => setEditRevenueModal({ ...editRevenueModal, open: false })}
        />

        <Dialog
          open={openModalDeleteRevenue.open}
          onClose={handleCloseModalDeleteRevenue}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>
            Tem certeza que deseja deletar esta receita?
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseModalDeleteRevenue}>Cancelar</Button>
            <Button
              onClick={async () => {
                await handleDeleteRevenue(openModalDeleteRevenue.revenueId);
                handleCloseModalDeleteRevenue();
                enqueueSnackbar('Receita removida', {
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
