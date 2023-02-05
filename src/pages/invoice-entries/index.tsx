import Head from 'next/head'
import { LayoutMobile } from '../../components/app-layout'
import { useProtectPage } from '../../hooks/auth/useAuth'
import { useInvoices } from '../../hooks/useInvoices'
import { IInvoice } from '../../providers/invoices/types'
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { Box } from '@mui/material'
import dayjs from 'dayjs'
import Typography from '@mui/material/Typography';

export default function InvoiceEntries() {
  useProtectPage()
  const { invoices } = useInvoices();

  const columns: GridColDef[] = [
    {
      field: 'invoiceCategory',
      headerName: 'Categoria',
    },
    {
      field: 'value',
      headerName: 'Valor',
      renderCell: (({ value }) => value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }))
    },
    {
      field: 'description',
      headerName: 'Descrição',
    },
    {
      field: 'addDate',
      headerName: 'Data',
      renderCell: (({ value }) => dayjs(value).format('DD/MM/YYYY'))
    },
  ];

  return (
    <>
      <Head>
        <title>Lançamentos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LayoutMobile tabSelected='/invoice-entries'>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ height: 400, width: '90%', maxWidth: 600, mt: 3 }}>
            <DataGrid
              rows={invoices}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
            />
          </Box>
        </Box>
      </LayoutMobile>
    </>
  )
}