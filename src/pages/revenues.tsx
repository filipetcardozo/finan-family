import React, { useState, useContext } from 'react'
import Head from 'next/head'
import { LayoutMobile } from '../components/AppLayoutMobile';
import { useProtectPage } from '../hooks/useAuth';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { formatterCurrency } from '../utils/formatters';
import IconButton from '@mui/material/IconButton';
import BorderColorIcon from '@mui/icons-material/BorderColorOutlined';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';
import { RevenuesContext } from '../contexts/revenues';
import { IRevenue } from '../providers/revenues/types';

export default function Revenues() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { revenues, handleDeleteRevenue } = useContext(RevenuesContext);

  const [editRevenueModal, setEditRevenueModal] = useState<{
    open: boolean,
    revenue: IRevenue | undefined
  }>({
    open: false,
    revenue: undefined
  });

  const [openModalDeleteRevenue, setOpenModalDeleteRevenue] = useState({
    open: false,
    revenueId: ''
  });

  const handleCloseModalDeleteRevenue = () => {
    setOpenModalDeleteRevenue({ revenueId: '', open: false })
  };

  const columns: GridColDef[] = [
    {
      field: 'revenueCategory',
      headerName: 'Categoria',
      flex: 1,
    },
    {
      field: 'value',
      headerName: 'Valor',
      renderCell: (({ value }) => formatterCurrency(value)),
      minWidth: 40,
    },
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
    },
    {
      field: 'addDate',
      headerName: 'Data',
      minWidth: 50,
      renderCell: (({ value }) => dayjs(value).format('DD/MM/YYYY')),
    },
    {
      field: 'id',
      headerName: 'Ações',
      minWidth: 50,
      renderCell: (({ value, row }) => {
        return <>
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
      })
    }
  ];

  return (
    <>
      <Head>
        <title>Lançamentos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LayoutMobile tabSelected='/revenues'>
        <Box sx={{ justifyContent: 'center', display: 'flex', width: '100%' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ height: 600, width: 620 }}>
              <DataGrid
                rows={revenues}
                columns={columns}
                pageSize={100}
                rowsPerPageOptions={[100]}
                disableSelectionOnClick
              />
            </Box>
          </Box>
        </Box>
        <AddInvoiceModal
          revenue={editRevenueModal.revenue}
          open={editRevenueModal.open}
          handleClose={() => setEditRevenueModal({ ...editRevenueModal, open: false })}
        />
        <Dialog
          open={openModalDeleteRevenue.open}
          onClose={handleCloseModalDeleteRevenue}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Tem certeza que deseja deletar esta receita?
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseModalDeleteRevenue}>Cancelar</Button>
            <Button onClick={async () => {
              await handleDeleteRevenue(openModalDeleteRevenue.revenueId)
              handleCloseModalDeleteRevenue()
              enqueueSnackbar('Despesa removida', { autoHideDuration: 2000, variant: 'success', anchorOrigin: { horizontal: 'center', vertical: 'top' } });
            }}>
              Deletar
            </Button>
          </DialogActions>
        </Dialog>
      </LayoutMobile>
    </>
  )
}