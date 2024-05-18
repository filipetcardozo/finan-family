import React, { useContext, useMemo } from 'react';
import { Container, CssBaseline, Divider, Typography } from '@mui/material';
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
import { PulsingFeature } from '../components/PulsingFeature';

export default function Home() {
  useProtectPage()

  const { monthlyExpenses, invoices, expensesOfDay, loadingGetInvoices } = useContext(ExpensesContext);
  const { loadingGetRevenues, monthlyRevenues } = useContext(RevenuesContext);

  const monthlyInvestments = useMemo(() => {
    let realInvestments = 0;
    let plannedInvestments = 0;

    invoices.forEach(invoice => {
      if (invoice.invoiceCategory === 'Investimentos') {
        realInvestments += invoice.value ?? 0;
        plannedInvestments += invoice.value ?? 0;
      }
    });

    let asWeAre = monthlyRevenues - realInvestments - monthlyExpenses;

    if (plannedInvestments > 0 && asWeAre < 0) {
      realInvestments += asWeAre
    };

    if (realInvestments < 0) realInvestments = 0;

    return { realInvestments: realInvestments, plannedInvestments: plannedInvestments };
  }, [invoices, monthlyExpenses, monthlyRevenues]);

  const asWeAre = useMemo(() => {
    let realAsWeAre = monthlyRevenues - monthlyExpenses;

    if (realAsWeAre > 0) {
      return realAsWeAre - monthlyInvestments.plannedInvestments;
    } else {
      return realAsWeAre;
    }
  }, [monthlyExpenses, monthlyInvestments, monthlyRevenues, invoices]);

  const HappyOrSad = () => {
    const iconStyle: CSS.Properties = {
      position: 'relative', top: '5px', fontSize: '28px'
    }

    if (asWeAre > 2000) {
      return <ImCool style={iconStyle} />
    } else if (asWeAre > 1500) {
      return <ImHappy style={iconStyle} />
    } else if (asWeAre > 1000) {
      return <ImSmile style={iconStyle} />
    } else if (asWeAre > 600) {
      return <ImWondering style={iconStyle} />
    } else if (asWeAre > 300) {
      return <ImSad style={iconStyle} />
    } else if (asWeAre <= 300) {
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
        <Container maxWidth='sm'>
          {
            loadingGetInvoices || loadingGetRevenues ? <LoadingHomePage /> :
              <Stack flexDirection='column' justifyContent='center' alignItems='center'>
                <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                  <Card variant='outlined' sx={{ width: '90%', mb: 4 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 20 }} color="text.primary" gutterBottom>
                        Como estamos?
                      </Typography>
                      <Typography sx={{ fontSize: 30, fontWeight: 'bold' }} color={asWeAre > 0 ? 'green' : 'red'}>
                        {asWeAre > 0 && '+'}
                        {formatterCurrency(asWeAre)} <HappyOrSad />
                      </Typography>
                      {
                        monthlyInvestments.plannedInvestments > 0 && monthlyInvestments.realInvestments < monthlyInvestments.plannedInvestments && <PulsingFeature>
                          <Typography color='orange' fontSize={13}>
                            ⚠️ Você está gastando do investimento! ⚠️
                          </Typography>
                        </PulsingFeature>
                      }

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

                      <Divider sx={{ my: 4 }} />

                      <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
                        Investimentos
                      </Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 'bold' }} color='green'>
                        {formatterCurrency(monthlyInvestments.realInvestments)}
                      </Typography>
                      {
                        monthlyInvestments.plannedInvestments !== monthlyInvestments.realInvestments && <Typography
                          sx={{ fontSize: 14 }} color='red'
                        >
                          Planejado: {monthlyInvestments.plannedInvestments > 0 ? formatterCurrency(monthlyInvestments.plannedInvestments) : '-'}
                        </Typography>
                      }

                    </CardContent>
                  </Card>
                </Box>

                {
                  expensesOfDay.length > 0 && <>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                      <Divider sx={{ my: 4, width: '90%' }} />
                    </Box>
                    <Typography sx={{ fontSize: 18 }} color="text.primary" gutterBottom>
                      Despesas do dia
                    </Typography>
                    <ExpensesOfDay expensesOfDay={expensesOfDay} />
                  </>
                }

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
        </Container>
      </LayoutMobile>
    </>
  )
}
