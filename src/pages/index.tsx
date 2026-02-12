import React, { useContext, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import CSS from 'csstype';
import { ImAngry, ImConfused, ImCool, ImHappy, ImSad, ImSmile, ImWondering } from 'react-icons/im';
import { ExpensesContext } from '../contexts/expenses';
import { RevenuesContext } from '../contexts/revenues';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { PieChart } from '../components/ExpensesPieChart';
import { ExpensesOfDay } from '../components/ExpensesOfDay';
import { useProtectPage } from '../hooks/useAuth';
import { LoadingHomePage } from '../components/SkeletonLoadingHomePage';
import { formatterCurrency } from '../utils/formatters';
import { MonthSelectedContext } from '../contexts/monthSelected';

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  delay: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accent, delay }) => {
  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 4,
        borderColor: 'rgba(6, 42, 63, 0.10)',
        boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
        animation: 'fadeInUp .65s ease both',
        animationDelay: delay,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase', color: '#567086' }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: '#102435' }}>
              {value}
            </Typography>
            <Typography sx={{ mt: 0.6, fontSize: 13, color: '#607d92' }}>
              {subtitle}
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
              color: accent,
              background: `${accent}18`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  useProtectPage();

  const { monthlyExpenses, invoices, expensesOfDay, loadingGetInvoices } = useContext(ExpensesContext);
  const { loadingGetRevenues, monthlyRevenues } = useContext(RevenuesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);

  const [showValues, setShowValues] = useState(false);

  const monthlyInvestments = useMemo(() => {
    let realInvestments = 0;
    let plannedInvestments = 0;

    invoices.forEach(invoice => {
      if (invoice.invoiceCategory === 'Investimentos') {
        realInvestments += invoice.value ?? 0;
        plannedInvestments += invoice.value ?? 0;
      }
    });

    const currentBalance = monthlyRevenues - realInvestments - monthlyExpenses;

    if (plannedInvestments > 0 && currentBalance < 0) {
      realInvestments += currentBalance;
    }

    if (realInvestments < 0) {
      realInvestments = 0;
    }

    return { realInvestments, plannedInvestments };
  }, [invoices, monthlyExpenses, monthlyRevenues]);

  const asWeAre = useMemo(() => {
    const currentBalance = monthlyRevenues - monthlyExpenses;

    if (currentBalance > 0) {
      return currentBalance - monthlyInvestments.plannedInvestments;
    }

    return currentBalance;
  }, [monthlyExpenses, monthlyInvestments, monthlyRevenues]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(dateToAnalyze.toDate());
  }, [dateToAnalyze]);

  const budgetUsage = useMemo(() => {
    if (monthlyRevenues <= 0) {
      return 0;
    }

    const usage = ((monthlyExpenses + monthlyInvestments.realInvestments) / monthlyRevenues) * 100;
    return Math.max(0, Math.min(usage, 100));
  }, [monthlyExpenses, monthlyInvestments.realInvestments, monthlyRevenues]);

  const valueOrMask = (value: number, prefix = '') => {
    if (!showValues) {
      return '****';
    }

    return `${prefix}${formatterCurrency(value)}`;
  };

  const HappyOrSad = () => {
    const iconStyle: CSS.Properties = {
      position: 'relative',
      top: '4px',
      fontSize: '28px',
    };

    if (asWeAre > 2000) return <ImCool style={iconStyle} />;
    if (asWeAre > 1500) return <ImHappy style={iconStyle} />;
    if (asWeAre > 1000) return <ImSmile style={iconStyle} />;
    if (asWeAre > 300) return <ImWondering style={iconStyle} />;
    if (asWeAre > 100) return <ImSad style={iconStyle} />;
    if (asWeAre <= 100) return <ImAngry style={iconStyle} />;
    return <ImConfused style={iconStyle} />;
  };

  return (
    <>
      <Head>
        <title>Home</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <CssBaseline />
      <LayoutMobile tabSelected='/'>
        <Container maxWidth='lg'>
          {loadingGetInvoices || loadingGetRevenues ? (
            <LoadingHomePage />
          ) : (
            <Box
              sx={{
                '--shape-main': '#c7f0d8',
                '--shape-soft': '#d8ecff',
                '--bg-top': '#f6fbff',
                '--bg-middle': '#fff7eb',
                '--bg-bottom': '#f2faf6',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 6,
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2.5, sm: 3.5 },
                background: 'linear-gradient(145deg, var(--bg-top) 0%, var(--bg-middle) 52%, var(--bg-bottom) 100%)',
                border: '1px solid rgba(6, 42, 63, 0.08)',
                boxShadow: '0 32px 55px -38px rgba(16, 36, 53, 0.55)',
                fontFamily: '"Avenir Next", "Trebuchet MS", "Century Gothic", sans-serif',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                },
                '&::before': {
                  width: 270,
                  height: 270,
                  top: -90,
                  right: -60,
                  background: 'radial-gradient(circle, var(--shape-main) 0%, rgba(199, 240, 216, 0) 72%)',
                  animation: 'floatBlob 11s ease-in-out infinite',
                },
                '&::after': {
                  width: 220,
                  height: 220,
                  bottom: -90,
                  left: -60,
                  background: 'radial-gradient(circle, var(--shape-soft) 0%, rgba(216, 236, 255, 0) 74%)',
                  animation: 'floatBlob 13s ease-in-out infinite reverse',
                },
                '@keyframes floatBlob': {
                  '0%': { transform: 'translate(0, 0)' },
                  '50%': { transform: 'translate(0, 16px)' },
                  '100%': { transform: 'translate(0, 0)' },
                },
                '@keyframes fadeInUp': {
                  from: { opacity: 0, transform: 'translateY(12px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  '&, & *': {
                    animation: 'none !important',
                    transition: 'none !important',
                  },
                },
              }}
            >
              <Stack spacing={2.5}>
                <Card
                  variant='outlined'
                  sx={{
                    borderRadius: 4,
                    background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
                    color: '#f6feff',
                    border: 'none',
                    boxShadow: '0 24px 45px -30px rgba(3, 35, 56, 0.7)',
                    animation: 'fadeInUp .6s ease both',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.4, sm: 3 } }}>
                    <Stack spacing={1.6}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.3}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent='space-between'
                      >
                        <Box>
                          <Typography sx={{ fontSize: 14, opacity: 0.86 }}>
                            Panorama financeiro
                          </Typography>
                          <Typography sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 700, lineHeight: 1.1 }}>
                            Como estamos?
                          </Typography>
                        </Box>
                        <Chip
                          icon={<CalendarMonthRoundedIcon sx={{ color: '#d5f8ff !important' }} />}
                          label={monthLabel}
                          sx={{
                            color: '#d5f8ff',
                            borderColor: 'rgba(213, 248, 255, .4)',
                            backgroundColor: 'rgba(213, 248, 255, .12)',
                            textTransform: 'capitalize',
                          }}
                          variant='outlined'
                        />
                      </Stack>

                      <Box>
                        <Typography sx={{ fontSize: 13, opacity: 0.8, letterSpacing: '.02em' }}>
                          Saldo livre do mês
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.4,
                            fontSize: { xs: 30, sm: 38 },
                            fontWeight: 800,
                            color: asWeAre >= 0 ? '#d4ffe2' : '#ffd8cf',
                          }}
                        >
                          {showValues ? (
                            <>
                              {asWeAre > 0 ? '+' : ''}
                              {formatterCurrency(asWeAre)} <HappyOrSad />
                            </>
                          ) : (
                            '****'
                          )}
                        </Typography>
                      </Box>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.2}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent='space-between'
                      >
                        <Button
                          variant='contained'
                          onClick={() => setShowValues(prev => !prev)}
                          startIcon={showValues ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 10,
                            minWidth: 172,
                            fontWeight: 600,
                            color: '#04374a',
                            backgroundColor: '#d2f3ff',
                            '&:hover': {
                              backgroundColor: '#bbecff',
                            },
                          }}
                        >
                          {showValues ? 'Ocultar valores' : 'Mostrar valores'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  variant='outlined'
                  sx={{
                    borderRadius: 4,
                    borderColor: 'rgba(6, 42, 63, 0.08)',
                    boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.45)',
                    animation: 'fadeInUp .65s ease both',
                    animationDelay: '110ms',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.2, sm: 2.6 } }}>
                    <Stack spacing={1}>
                      <Stack direction='row' alignItems='center' justifyContent='space-between'>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#123047' }}>
                          Consumo do orçamento
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#19536e' }}>
                          {showValues ? `${budgetUsage.toFixed(0)}%` : '****'}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant='determinate'
                        value={budgetUsage}
                        sx={{
                          height: 10,
                          borderRadius: 8,
                          backgroundColor: '#dceff8',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 8,
                            background: 'linear-gradient(90deg, #0b6c79 0%, #2aa287 100%)',
                          },
                        }}
                      />
                      <Typography sx={{ fontSize: 12.5, color: '#607d92' }}>
                        Receita do mês utilizada por despesas e investimentos reais.
                      </Typography>
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
                  <StatCard
                    title='Receitas'
                    value={valueOrMask(monthlyRevenues)}
                    subtitle='Total recebido no mês'
                    icon={<TrendingUpRoundedIcon />}
                    accent='#127a49'
                    delay='160ms'
                  />
                  <StatCard
                    title='Despesas'
                    value={valueOrMask(monthlyExpenses)}
                    subtitle='Total gasto no mês'
                    icon={<TrendingDownRoundedIcon />}
                    accent='#b83d2f'
                    delay='220ms'
                  />
                  <StatCard
                    title='Investimentos'
                    value={valueOrMask(monthlyInvestments.realInvestments)}
                    subtitle='Aplicado até agora'
                    icon={<SavingsRoundedIcon />}
                    accent='#176c6f'
                    delay='280ms'
                  />
                  <StatCard
                    title='Investimento planejado'
                    value={valueOrMask(monthlyInvestments.plannedInvestments)}
                    subtitle='Meta total do mês'
                    icon={<InsightsRoundedIcon />}
                    accent='#3f5e91'
                    delay='340ms'
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(16, 36, 53, 0.1)' }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Card
                    variant='outlined'
                    sx={{
                      borderRadius: 4,
                      borderColor: 'rgba(6, 42, 63, 0.10)',
                      boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
                      animation: 'fadeInUp .7s ease both',
                      animationDelay: '360ms',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#102435' }}>
                        Despesas do dia
                      </Typography>
                      <Typography sx={{ mt: 0.5, mb: 1.2, fontSize: 13, color: '#607d92' }}>
                        Movimentações lançadas hoje.
                      </Typography>
                      {expensesOfDay.length > 0 ? (
                        <ExpensesOfDay expensesOfDay={expensesOfDay} />
                      ) : (
                        <Typography sx={{ fontSize: 14, color: '#607d92' }}>
                          Nenhuma despesa registrada hoje.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <Card
                    variant='outlined'
                    sx={{
                      borderRadius: 4,
                      borderColor: 'rgba(6, 42, 63, 0.10)',
                      boxShadow: '0 18px 30px -26px rgba(6, 42, 63, 0.5)',
                      animation: 'fadeInUp .7s ease both',
                      animationDelay: '420ms',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#102435' }}>
                        Despesas por categoria
                      </Typography>
                      <Typography sx={{ mt: 0.5, mb: 1.2, fontSize: 13, color: '#607d92' }}>
                        Leia rapidamente onde está indo a maior parte dos gastos.
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          minHeight: 240,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PieChart expenses={invoices} />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>
            </Box>
          )}
        </Container>
      </LayoutMobile>
    </>
  );
}
