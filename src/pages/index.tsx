import React, { useContext } from 'react';
import { CssBaseline, Divider, Typography } from '@mui/material';
import Head from 'next/head';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { useProtectPage } from '../hooks/useAuth';
import { formatterCurrency } from '../utils/formatters';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { PieChart } from '../components/ExpensesPieChart';
import { Stack } from '@mui/system';
import { ExpensesOfDay } from '../components/ExpensesOfDay';
import { LoadingHomePage } from '../components/SkeletonLoadingHomePage';
import { ImCool, ImHappy, ImSmile, ImWondering, ImSad, ImAngry, ImConfused } from "react-icons/im";
import CSS from 'csstype';
import { ExpensesContext } from '../contexts/expenses';
import { RevenuesContext } from '../contexts/revenues';

export default function Home() {
  useProtectPage()

  const { monthlyExpenses, expensesIndicatedPerDay, invoices, expensesOfDay, loadingGetInvoices } = useContext(ExpensesContext);
  const { loadingGetRevenues, monthlyRevenues } = useContext(RevenuesContext);

  const HappyOrSad = () => {
    const iconStyle: CSS.Properties = {
      position: 'relative', top: '5px', fontSize: '28px'
    }

    if (monthlyRevenues - monthlyExpenses > 2000) {
      return <ImCool style={iconStyle} />
    } else if (monthlyRevenues - monthlyExpenses > 1500) {
      return <ImHappy style={iconStyle} />
    } else if (monthlyRevenues - monthlyExpenses > 1000) {
      return <ImSmile style={iconStyle} />
    } else if (monthlyRevenues - monthlyExpenses > 600) {
      return <ImWondering style={iconStyle} />
    } else if (monthlyRevenues - monthlyExpenses > 300) {
      return <ImSad style={iconStyle} />
    } else if (monthlyRevenues - monthlyExpenses <= 300) {
      return <ImAngry style={iconStyle} />
    } else {
      return <ImConfused style={iconStyle} />
    }
  }

  return (
    <>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CssBaseline />
      <LayoutMobile tabSelected='/'>
        {
          loadingGetInvoices || loadingGetRevenues ? <LoadingHomePage /> :
            <Stack flexDirection='column' justifyContent='center' alignItems='center'>
              <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                <Card variant='outlined' sx={{ width: '90%', mb: 4 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                      Como estamos?
                    </Typography>
                    <Typography sx={{ fontSize: 30, fontWeight: 'bold' }} color={monthlyRevenues - monthlyExpenses > 0 ? 'green' : 'red'}>
                      {monthlyRevenues - monthlyExpenses > 0 && '+'}
                      {formatterCurrency(monthlyRevenues - monthlyExpenses)} <HappyOrSad />
                    </Typography>

                    <Divider sx={{ my: 4 }} />

                    <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                      Receitas
                    </Typography>
                    <Typography sx={{ fontSize: 20 }} color="green">
                      {formatterCurrency(monthlyRevenues)}
                    </Typography>

                    <Divider sx={{ my: 4 }} />

                    <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                      Despesas
                    </Typography>
                    <Typography sx={{ fontSize: 20 }} color="red">
                      {formatterCurrency(monthlyExpenses)}
                    </Typography>

                  </CardContent>
                </Card>

              </Box>
              <Box>
                <Typography sx={{ fontSize: 18 }} color="primary">
                  Despesa diária indicada <span style={{ fontSize: 13 }}>(até o dia 25)</span>
                </Typography>
                <Typography sx={{ fontSize: 20, textAlign: 'center' }} color="primary">
                  <span style={{
                    color: monthlyRevenues - monthlyExpenses > 0 ? 'green' : 'red'
                  }}>
                    {formatterCurrency(expensesIndicatedPerDay)}
                  </span>
                </Typography>
              </Box>

              <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                <Divider sx={{ my: 4, width: '90%' }} />
              </Box>
              <Typography sx={{ fontSize: 18 }} color="text.primary" gutterBottom>
                Despesas do dia
              </Typography>
              <ExpensesOfDay expensesOfDay={expensesOfDay} />

              <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                <Divider sx={{ my: 4, width: '90%' }} />
              </Box>
              <Typography sx={{ fontSize: 18 }} color="text.primary" gutterBottom>
                Despesas por categoria
              </Typography>
              <Box sx={{ width: 1, maxWidth: '400px', height: '200px', display: 'flex', justifyContent: 'center' }}>
                <PieChart expenses={invoices} />
              </Box>
            </Stack>
        }
      </LayoutMobile>
    </>
  )
}
