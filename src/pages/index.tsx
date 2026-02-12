import React, { useContext, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
  subtitle?: string;
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

  const { monthlyExpenses, invoices, loadingGetInvoices } = useContext(ExpensesContext);
  const { loadingGetRevenues, monthlyRevenues } = useContext(RevenuesContext);
  const { dateToAnalyze } = useContext(MonthSelectedContext);

  const [showValues, setShowValues] = useState(false);
  const [showFinancialHelp, setShowFinancialHelp] = useState(false);
  const [selectedExpenseDate, setSelectedExpenseDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  });

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
    return monthlyRevenues - monthlyExpenses - monthlyInvestments.realInvestments;
  }, [monthlyExpenses, monthlyInvestments.realInvestments, monthlyRevenues]);

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

  const monthProgress = useMemo(() => {
    const selectedDate = dateToAnalyze.toDate();
    const now = new Date();

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
      return 100;
    }

    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
      return 0;
    }

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const currentDay = Math.min(now.getDate(), daysInMonth);

    return (currentDay / daysInMonth) * 100;
  }, [dateToAnalyze]);

  const financialWellness = useMemo(() => {
    if (monthlyRevenues <= 0) {
      return {
        score: 0,
        label: 'Sem receita no mês',
        emoji: '😶',
        color: '#ffd8cf',
        expenseRate: 0,
        investmentRate: 0,
        expectedExpenseRate: 0,
        monthProgress,
      };
    }

    // Referência prática: despesas até 70%, investimentos em torno de 20% e folga de caixa de 10%.
    const expenseRate = (monthlyExpenses / monthlyRevenues) * 100;
    const investmentRate = (monthlyInvestments.realInvestments / monthlyRevenues) * 100;
    const freeCashRate = (asWeAre / monthlyRevenues) * 100;
    const expectedExpenseRate = (70 * monthProgress) / 100;

    const expenseScore = Math.max(0, Math.min(100, ((70 - expenseRate) / 70) * 100));
    const investmentScore = Math.max(0, Math.min(100, (investmentRate / 20) * 100));
    const freeCashScore = Math.max(0, Math.min(100, ((freeCashRate + 10) / 20) * 100));

    const paceTolerance = 8;
    const paceOverflow = expenseRate - (expectedExpenseRate + paceTolerance);
    const paceScore = monthProgress >= 100
      ? expenseScore
      : Math.max(0, Math.min(100, 100 - Math.max(0, paceOverflow) * 4));

    const score = Math.max(
      0,
      Math.min(100, expenseScore * 0.3 + investmentScore * 0.25 + freeCashScore * 0.15 + paceScore * 0.3)
    );

    if (score >= 85) return { score, label: 'Excelente equilíbrio', emoji: '😁', color: '#d4ffe2', expenseRate, investmentRate, expectedExpenseRate, monthProgress };
    if (score >= 70) return { score, label: 'Bom equilíbrio', emoji: '🙂', color: '#dfffe9', expenseRate, investmentRate, expectedExpenseRate, monthProgress };
    if (score >= 55) return { score, label: 'Atenção aos gastos', emoji: '😐', color: '#fff3d4', expenseRate, investmentRate, expectedExpenseRate, monthProgress };
    if (score >= 40) return { score, label: 'Risco de aperto', emoji: '😟', color: '#ffe7d1', expenseRate, investmentRate, expectedExpenseRate, monthProgress };

    return { score, label: 'Ajuste urgente', emoji: '😣', color: '#ffd8cf', expenseRate, investmentRate, expectedExpenseRate, monthProgress };
  }, [asWeAre, monthProgress, monthlyExpenses, monthlyInvestments.realInvestments, monthlyRevenues]);

  const practicalExample = useMemo(() => {
    const baseRevenue = monthlyRevenues > 0 ? monthlyRevenues : 10000;

    return {
      baseRevenue,
      expensesIdeal: baseRevenue * 0.7,
      investmentsIdeal: baseRevenue * 0.2,
      freeAmountIdeal: baseRevenue * 0.1,
      usesUserRevenue: monthlyRevenues > 0,
    };
  }, [monthlyRevenues]);

  const expensesOfSelectedDate = useMemo(() => {
    return invoices.filter(invoice => invoice.addDate?.format('YYYY-MM-DD') === selectedExpenseDate);
  }, [invoices, selectedExpenseDate]);

  const valueOrMask = (value: number, prefix = '') => {
    if (!showValues) {
      return '****';
    }

    return `${prefix}${formatterCurrency(value)}`;
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
                position: 'relative',
                px: { xs: 0.2, sm: 0.4 },
                py: 0.5,
                fontFamily: '"Avenir Next", "Trebuchet MS", "Century Gothic", sans-serif',
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
                        <Typography
                          sx={{
                            mt: 0.2,
                            fontSize: { xs: 30, sm: 38 },
                            fontWeight: 800,
                            color: financialWellness.color,
                          }}
                        >
                          {showValues ? `${asWeAre > 0 ? '+' : ''}${formatterCurrency(asWeAre)} ${financialWellness.emoji}` : '****'}
                        </Typography>
                        <Stack direction='row' spacing={0.6} alignItems='center' sx={{ mt: 0.25 }}>
                          <Typography sx={{ fontSize: 11.5, opacity: 0.8 }}>
                            Nota geral: {financialWellness.score.toFixed(0)}% · {financialWellness.label}
                          </Typography>
                          <IconButton
                            size='small'
                            onClick={() => setShowFinancialHelp(prev => !prev)}
                            sx={{ color: '#d2f3ff', p: 0.35 }}
                          >
                            <InfoOutlinedIcon fontSize='inherit' />
                          </IconButton>
                        </Stack>
                        <Collapse in={showFinancialHelp}>
                          <Box
                            sx={{
                              mt: 0.9,
                              p: 1.1,
                              borderRadius: 2,
                              border: '1px solid rgba(213, 248, 255, .28)',
                              backgroundColor: 'rgba(4, 34, 53, .28)',
                            }}
                          >
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#d9f7ff' }}>
                              O que essa nota significa?
                            </Typography>
                            <Typography sx={{ mt: 0.45, fontSize: 12, opacity: 0.9 }}>
                              Essa nota mostra a saúde do seu mês: quanto menores os gastos e quanto maior o investimento, melhor.
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                              Nota ruim: abaixo de 55% · Nota mediana: de 55% até 84% · Nota excelente: 85% ou mais.
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                              {practicalExample.usesUserRevenue ? 'Exemplo com sua receita do mês' : 'Exemplo com receita de R$ 10.000'} ({formatterCurrency(practicalExample.baseRevenue)}): ideal seria gastar até {formatterCurrency(practicalExample.expensesIdeal)} (70%), investir cerca de {formatterCurrency(practicalExample.investmentsIdeal)} (20%) e manter {formatterCurrency(practicalExample.freeAmountIdeal)} livres (10%).
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                              Hoje: Gastos {financialWellness.expenseRate.toFixed(0)}% da receita · Investimentos {financialWellness.investmentRate.toFixed(0)}% da receita.
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                              Ritmo do mês: já passou {financialWellness.monthProgress.toFixed(0)}% do mês, então o ideal seria ter gasto até cerca de {financialWellness.expectedExpenseRate.toFixed(0)}% da receita.
                            </Typography>
                          </Box>
                        </Collapse>
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
                    icon={<TrendingUpRoundedIcon />}
                    accent='#127a49'
                    delay='160ms'
                  />
                  <StatCard
                    title='Despesas'
                    value={valueOrMask(monthlyExpenses)}
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
                      <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={1}>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#102435' }}>
                          Despesas do dia
                        </Typography>
                        <TextField
                          type='date'
                          size='small'
                          value={selectedExpenseDate}
                          onChange={event => setSelectedExpenseDate(event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            width: 142,
                            '& .MuiInputBase-root': { height: 32, fontSize: 12 },
                            '& input': { py: 0.7, px: 1 },
                          }}
                        />
                      </Stack>
                      <Typography sx={{ mt: 0.5, mb: 1.2, fontSize: 13, color: '#607d92' }}>
                        Movimentações lançadas na data selecionada.
                      </Typography>
                      {expensesOfSelectedDate.length > 0 ? (
                        <ExpensesOfDay expensesOfDay={expensesOfSelectedDate} />
                      ) : (
                        <Typography sx={{ fontSize: 14, color: '#607d92' }}>
                          Nenhuma despesa registrada para esta data.
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



