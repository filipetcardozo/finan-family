import { CssBaseline, Divider, Typography } from '@mui/material'
import Head from 'next/head'
import { LayoutMobile } from '../components/app-layout/LayoutMobile'
import { useProtectPage } from '../hooks/auth/useAuth'
import { useInvoices } from '../hooks/useInvoices'
import { formatterCurrency } from '../utils/formatters'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { PieChart } from '../components/charts/pieChart'
import { Stack } from '@mui/system'

export default function Home() {
  useProtectPage()

  const { monthlyExpenses, loadingGetInvoices, invoices } = useInvoices();

  const revenueMonthly = 5850;

  return (
    <>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CssBaseline />
      <LayoutMobile tabSelected='/'>
        <Stack flexDirection='column'>
          <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
            <Card variant='outlined' sx={{ width: '90%', mb: 4 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                  Despesas do mês:
                </Typography>
                <Typography sx={{ fontSize: 20 }} color="red">
                  {formatterCurrency(monthlyExpenses)}
                </Typography>
                <Divider sx={{ my: 4 }} />
                <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                  Receitas:
                </Typography>
                <Typography sx={{ fontSize: 20 }} color="green">
                  {formatterCurrency(revenueMonthly)}
                </Typography>
                <Divider sx={{ my: 4 }} />
                <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                  Resultado:
                </Typography>
                <Typography sx={{ fontSize: 30 }} color={revenueMonthly - monthlyExpenses > 0 ? 'green' : 'red'}>
                  {revenueMonthly - monthlyExpenses > 0 && '+'}
                  {formatterCurrency(revenueMonthly - monthlyExpenses)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: 1, height: '200px', display: 'flex', justifyContent: 'center' }}>
            <PieChart expenses={invoices} />
          </Box>
        </Stack>
      </LayoutMobile>
    </>
  )
}
