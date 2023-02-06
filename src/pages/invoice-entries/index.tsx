import React, { useState } from 'react'
import Head from 'next/head'
import { LayoutMobile } from '../../components/app-layout';
import { useProtectPage } from '../../hooks/auth/useAuth';
import { useInvoices } from '../../hooks/useInvoices';
import { IInvoice } from '../../providers/invoices/types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { formatterCurrency } from '../../utils/formatters';
import IconButton from '@mui/material/IconButton';
import BorderColorIcon from '@mui/icons-material/BorderColorOutlined';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AddInvoiceModal } from '../../components/modal-addInvoice';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';

export default function InvoiceEntries() {
  useProtectPage();

  const { enqueueSnackbar } = useSnackbar();
  const { invoices, handleUpdateInvoice, handleDeleteInvoice } = useInvoices();

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
      headerName: 'Categoria'
    },
    {
      field: 'value',
      headerName: 'Valor',
      renderCell: (({ value }) => formatterCurrency(value))
    },
    {
      field: 'description',
      headerName: 'Descrição'
    },
    {
      field: 'addDate',
      headerName: 'Data',
      renderCell: (({ value }) => dayjs(value).format('DD/MM/YYYY'))
    },
    {
      field: 'id',
      headerName: 'Ações',
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
      <LayoutMobile tabSelected='/invoice-entries'>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ height: 600, width: '90%', maxWidth: 600, mt: 3 }}>
            <DataGrid
              rows={invoices}
              columns={columns}
              pageSize={8}
              rowsPerPageOptions={[8]}
              disableSelectionOnClick
            />
          </Box>
        </Box>
        <AddInvoiceModal
          invoice={editInvoiceModal.invoice}
          open={editInvoiceModal.open}
          handleClose={() => setEditInvoiceModal({ ...editInvoiceModal, open: false })}
          handleUpdateInvoice={handleUpdateInvoice}
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