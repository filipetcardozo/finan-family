import { Typography } from '@mui/material'
import Head from 'next/head'
import { LayoutMobile } from '../components/app-layout'
import { useProtectPage } from '../hooks/auth/useAuth'
import { useInvoices } from '../hooks/useInvoices'
import { formatterCurrency } from '../utils/formatters'
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';

export default function Home() {
  useProtectPage()

  const { monthlyExpenses, loadingGetInvoices } = useInvoices();

  const revenueMonthly = 5850;

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LayoutMobile tabSelected='/'>
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
              Despesas do mês:
            </Typography>
            <Typography sx={{ fontSize: 20 }} color="red">
              {formatterCurrency(monthlyExpenses)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
              Receitas:
            </Typography>
            <Typography sx={{ fontSize: 20 }} color="green">
              {formatterCurrency(revenueMonthly)}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={5}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
              Resultado:
            </Typography>
            <Typography sx={{ fontSize: 30 }} color={revenueMonthly - monthlyExpenses > 0 ? 'green' : 'red'}>
              {revenueMonthly - monthlyExpenses > 0 ? '+' : '-'}
              {formatterCurrency(revenueMonthly - monthlyExpenses)}
            </Typography>
          </CardContent>
        </Card>
      </LayoutMobile>
    </>
  )
}
