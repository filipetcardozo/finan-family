import React, { useState, useContext } from 'react'
import Head from 'next/head'
import { LayoutMobile } from '../components/AppLayoutMobile';
import { useProtectPage } from '../hooks/useAuth';
import { IInvoice } from '../providers/invoices/types';
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
import { ExpensesContext } from '../contexts/expenses';

export default function Expenses() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { invoices, handleDeleteInvoice } = useContext(ExpensesContext);

  const [editInvoiceModal, setEditInvoiceModal] = useState<{
    open: boolean,
    invoice: IInvoice | undefined
  }>({
    open: false,
    invoice: undefined
  });

  const [openModalDeleteInvoice, setOpenModalDeleteInvoice] = useState({
    open: false,
    invoiceId: ''
  });

  const handleCloseModalDeleteInvoice = () => {
    setOpenModalDeleteInvoice({ invoiceId: '', open: false })
  };

  const columns: GridColDef[] = [
    {
      field: 'invoiceCategory',
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
      field: 'addDate',
      headerName: 'Data',
      minWidth: 50,
      renderCell: (({ value }) => dayjs(value).format('DD/MM/YYYY')),
    },
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
    },
    {
      field: 'id',
      headerName: 'Ações',
      minWidth: 50,
      renderCell: (({ value, row }) => {
        return <>
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
      })
    }
  ];

  return (
    <>
      <Head>
        <title>Lançamentos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LayoutMobile tabSelected='/expenses'>
        <Box sx={{ justifyContent: 'center', display: 'flex', width: '100%' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ height: 600, width: 620 }}>
              <DataGrid
                rows={invoices}
                columns={columns}
                pageSize={100}
                rowsPerPageOptions={[100]}
                disableSelectionOnClick
              />
            </Box>
          </Box>
        </Box>
        <AddInvoiceModal
          invoice={editInvoiceModal.invoice}
          open={editInvoiceModal.open}
          handleClose={() => setEditInvoiceModal({ ...editInvoiceModal, open: false })}
        />
        <Dialog
          open={openModalDeleteInvoice.open}
          onClose={handleCloseModalDeleteInvoice}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Tem certeza que deseja deletar esta despesa?
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleCloseModalDeleteInvoice}>Cancelar</Button>
            <Button onClick={async () => {
              await handleDeleteInvoice(openModalDeleteInvoice.invoiceId)
              handleCloseModalDeleteInvoice()
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