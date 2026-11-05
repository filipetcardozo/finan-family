import React, { useContext, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { ExpensesContext } from '../contexts/expenses';
import { RevenuesContext } from '../contexts/revenues';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { PieChart } from '../components/ExpensesPieChart';
import { MonthlyExpensesTimeline } from '../components/MonthlyExpensesTimeline';
import { MonthlyExpenseCharts } from '../components/MonthlyExpenseCharts';
import { useProtectPage } from '../hooks/useAuth';
import { LoadingHomePage } from '../components/SkeletonLoadingHomePage';
import { formatterCurrency } from '../utils/formatters';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { AddInvoiceModal } from '../components/ModalAddInvoice';
import type { IInvoice } from '../providers/invoices/types';
import { useOfflineSync } from '../contexts/offlineSync';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: 'income' | 'expense' | 'primary' | 'secondary';
  delay: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accent, delay }) => {
  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 4,
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow)',
        animation: 'fadeInUp .65s ease both',
        animationDelay: delay,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 23, fontWeight: 700, color: 'var(--text)' }}>
              {value}
            </Typography>
            <Typography sx={{ mt: 0.6, fontSize: 13, color: 'var(--muted)' }}>
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
              color: `var(--${accent}-text)`,
              background: `var(--${accent}-soft)`,
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
  const { online } = useOfflineSync();
  const [editingExpense, setEditingExpense] = useState<IInvoice | undefined>();

  const [showValues, setShowValues] = useState(false);
  const [showFinancialHelp, setShowFinancialHelp] = useState(false);
  const [monthlyExpensesExpanded, setMonthlyExpensesExpanded] = useState(true);

  const isInvestmentCategory = (category?: string) => {
    if (!category) {
      return false;
    }

    const normalized = category
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalized.startsWith('invest');
  };

  const monthlyInvestments = useMemo(() => {
    let realInvestments = 0;
    let plannedInvestments = 0;

    invoices.forEach(invoice => {
      if (isInvestmentCategory(invoice.invoiceCategory)) {
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
    // monthlyExpenses ja considera investimentos cadastrados como despesa.
    return monthlyRevenues - monthlyExpenses;
  }, [monthlyExpenses, monthlyRevenues]);

  const budgetUsage = useMemo(() => {
    if (monthlyRevenues <= 0) {
      return 0;
    }

    const usage = (monthlyExpenses / monthlyRevenues) * 100;
    return Math.max(0, Math.min(usage, 100));
  }, [monthlyExpenses, monthlyRevenues]);

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

  const financialAnalysis = useMemo(() => {
    if (monthlyRevenues <= 0) {
      return {
        simple: {
          positiveAmount: 0,
          positiveRate: 0,
          label: 'Sem receita no mês',
          emoji: '😶',
          color: 'var(--hero-error)',
        },
        complex: {
          spentRate: 0,
          investmentRate: 0,
          nonInvestmentRate: 0,
          expectedSpentRate: 0,
          monthProgress,
          label: 'Não há dados de receita para análise detalhada.',
        },
      };
    }

    const positiveAmount = asWeAre;
    const positiveRate = (positiveAmount / monthlyRevenues) * 100;
    const spentRate = (monthlyExpenses / monthlyRevenues) * 100;
    const investmentRate = (monthlyInvestments.realInvestments / monthlyRevenues) * 100;
    const nonInvestmentRate = Math.max(0, spentRate - investmentRate);
    const expectedSpentRate = monthProgress;

    let simpleLabel = 'No limite';
    let simpleEmoji = '😐';
    let simpleColor = 'var(--hero-warning)';

    if (positiveRate >= 20) {
      simpleLabel = 'Saldo bem positivo';
      simpleEmoji = '😁';
      simpleColor = 'var(--hero-success)';
    } else if (positiveRate >= 10) {
      simpleLabel = 'Saldo positivo';
      simpleEmoji = '🙂';
      simpleColor = 'var(--hero-success)';
    } else if (positiveRate >= 0) {
      simpleLabel = 'Saldo curto, mas positivo';
      simpleEmoji = '😌';
      simpleColor = 'var(--hero-warning)';
    } else if (positiveRate >= -10) {
      simpleLabel = 'Saldo negativo';
      simpleEmoji = '😟';
      simpleColor = 'var(--hero-warning)';
    } else {
      simpleLabel = 'Atenção: negativo alto';
      simpleEmoji = '😣';
      simpleColor = 'var(--hero-error)';
    }

    const paceDiff = spentRate - expectedSpentRate;
    const paceLabel = paceDiff <= 5 ? 'ritmo de gastos controlado' : 'ritmo de gastos acima do esperado';
    const complexLabel = `Você já gastou ${spentRate.toFixed(0)}% da receita no mês. Desse total, ${investmentRate.toFixed(0)}% foi investimento. Hoje, ${paceLabel}.`;

    return {
      simple: {
        positiveAmount,
        positiveRate,
        label: simpleLabel,
        emoji: simpleEmoji,
        color: simpleColor,
      },
      complex: {
        spentRate,
        investmentRate,
        nonInvestmentRate,
        expectedSpentRate,
        monthProgress,
        label: complexLabel,
      },
    };
  }, [asWeAre, monthProgress, monthlyExpenses, monthlyInvestments.realInvestments, monthlyRevenues]);

  const practicalExample = useMemo(() => {
    const baseRevenue = monthlyRevenues > 0 ? monthlyRevenues : 10000;

    return {
      baseRevenue,
      expensesIdeal: baseRevenue * 0.8,
      investmentsIdeal: baseRevenue * 0.2,
      freeAmountIdeal: baseRevenue * 0.2,
      usesUserRevenue: monthlyRevenues > 0,
    };
  }, [monthlyRevenues]);

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
      </Head>
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
                    background: 'var(--hero)',
                    color: 'var(--hero-text)',
                    border: 'none',
                    boxShadow: 'var(--shadow)',
                    animation: 'fadeInUp .6s ease both',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.4, sm: 3 } }}>
                    <Stack spacing={1.6}>
                      <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={1.5}>
                        <Typography sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 700, lineHeight: 1.1 }}>
                          Como estamos?
                        </Typography>
                        <IconButton
                          aria-label={showValues ? 'Ocultar valores' : 'Mostrar valores'}
                          onClick={() => {
                            if (showValues) setShowFinancialHelp(false);
                            setShowValues(visible => !visible);
                          }}
                          sx={{ width: 40, height: 40, flexShrink: 0, color: 'var(--hero-text)', bgcolor: 'rgba(255,255,255,.12)', '&:hover': { bgcolor: 'rgba(255,255,255,.22)' } }}
                        >
                          {showValues ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                        </IconButton>
                      </Stack>

                      <Box>
                        <Typography
                          sx={{
                            mt: 0.2,
                            fontSize: { xs: 30, sm: 38 },
                            fontWeight: 800,
                            color: financialAnalysis.simple.color,
                          }}
                        >
                          {showValues ? `${asWeAre > 0 ? '+' : ''}${formatterCurrency(asWeAre)} ${financialAnalysis.simple.emoji}` : '****'}
                        </Typography>
                        {showValues && (
                          <>
                            <Stack direction='row' spacing={0.6} alignItems='center' sx={{ mt: 0.25 }}>
                              <Typography sx={{ fontSize: 11.5, opacity: 0.8 }}>
                                {financialAnalysis.simple.positiveRate.toFixed(0)}% da receita livre · {financialAnalysis.simple.label}
                              </Typography>
                              <IconButton
                                size='small'
                                onClick={() => setShowFinancialHelp(prev => !prev)}
                                sx={{ color: 'var(--hero-accent)', p: 0.35 }}
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
                                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'var(--hero-text)' }}>
                                  Como ler este resumo?
                                </Typography>
                                <Typography sx={{ mt: 0.45, fontSize: 12, opacity: 0.9 }}>
                                  Considera o saldo do mês em relação à receita.
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                                  Agora: {formatterCurrency(financialAnalysis.simple.positiveAmount)} ({financialAnalysis.simple.positiveRate.toFixed(0)}% da receita).
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                                  Análise complexa: {financialAnalysis.complex.label}
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 12, opacity: 0.9 }}>
                                  {practicalExample.usesUserRevenue ? 'Exemplo com sua receita do mês' : 'Exemplo com receita de R$ 10.000'} ({formatterCurrency(practicalExample.baseRevenue)}): investir {formatterCurrency(practicalExample.investmentsIdeal)} (20%), gastos totais até {formatterCurrency(practicalExample.expensesIdeal)} (80%) e saldo positivo de pelo menos {formatterCurrency(practicalExample.freeAmountIdeal)} (20%).
                                </Typography>
                              </Box>
                            </Collapse>
                          </>
                        )}
                      </Box>

                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  variant='outlined'
                  sx={{
                    borderRadius: 4,
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow)',
                    animation: 'fadeInUp .65s ease both',
                    animationDelay: '110ms',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.2, sm: 2.6 } }}>
                    <Stack spacing={1}>
                      <Stack direction='row' alignItems='center' justifyContent='space-between'>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                          Consumo do orçamento
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-text)' }}>
                          {showValues ? `${budgetUsage.toFixed(0)}%` : '****'}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant='determinate'
                        value={showValues ? budgetUsage : 100}
                        aria-hidden={!showValues}
                        aria-label='Consumo do orçamento'
                        sx={{
                          height: 10,
                          borderRadius: 8,
                          backgroundColor: 'var(--track)',
                          '& .MuiLinearProgress-bar': {
                            transition: showValues ? undefined : 'none',
                            borderRadius: 8,
                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
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
                    accent='income'
                    delay='160ms'
                  />
                  <StatCard
                    title='Despesas'
                    value={valueOrMask(monthlyExpenses)}
                    icon={<TrendingDownRoundedIcon />}
                    accent='expense'
                    delay='220ms'
                  />
                  {monthlyInvestments.realInvestments !== 0 && (
                    <StatCard
                      title='Investimentos'
                      value={valueOrMask(monthlyInvestments.realInvestments)}
                      subtitle='Aplicado até agora'
                      icon={<SavingsRoundedIcon />}
                      accent='primary'
                      delay='280ms'
                    />
                  )}
                  {monthlyInvestments.plannedInvestments !== 0 && (
                    <StatCard
                      title='Investimento planejado'
                      value={valueOrMask(monthlyInvestments.plannedInvestments)}
                      subtitle='Meta total do mês'
                      icon={<InsightsRoundedIcon />}
                      accent='secondary'
                      delay='340ms'
                    />
                  )}
                </Box>

                <MonthlyExpenseCharts expenses={invoices} month={dateToAnalyze} showValues={showValues} />

                <Divider sx={{ borderColor: 'var(--border)' }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
                    alignItems: 'start',
                    gap: 2,
                  }}
                >
                  <Card
                    variant='outlined'
                    sx={{
                      borderRadius: 4,
                      borderColor: 'var(--border)',
                      boxShadow: 'var(--shadow)',
                      animation: 'fadeInUp .7s ease both',
                      animationDelay: '360ms',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
                      <CardActionArea
                        onClick={() => setMonthlyExpensesExpanded(expanded => !expanded)}
                        aria-label={monthlyExpensesExpanded ? 'Recolher despesas do mês' : 'Expandir despesas do mês'}
                        aria-expanded={monthlyExpensesExpanded}
                        aria-controls='monthly-expenses-timeline'
                        sx={{ borderRadius: 2, textAlign: 'left' }}
                      >
                        <Stack direction='row' alignItems='center' spacing={1.2}>
                          <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
                            <TimelineRoundedIcon />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography id='monthly-expenses-heading' component='h2' sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'var(--text)' }}>Despesas do mês</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
                              <Chip label={`${invoices.length} ${invoices.length === 1 ? 'despesa' : 'despesas'}`} size='small' sx={{ bgcolor: 'var(--subtle)', color: 'var(--muted)', fontSize: 11, fontWeight: 500 }} />
                            </Box>
                          </Box>
                          <ExpandMoreRoundedIcon sx={{ color: 'var(--primary-text)', transform: monthlyExpensesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }} />
                        </Stack>
                      </CardActionArea>
                      <Collapse in={monthlyExpensesExpanded} timeout='auto' unmountOnExit>
                        <Box id='monthly-expenses-timeline' role='region' aria-labelledby='monthly-expenses-heading' sx={{ pt: 2.5 }}>
                          <MonthlyExpensesTimeline expenses={invoices} onEdit={setEditingExpense} canEdit={online} />
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>

                  <Card
                    variant='outlined'
                    sx={{
                      borderRadius: 4,
                      borderColor: 'var(--border)',
                      boxShadow: 'var(--shadow)',
                      animation: 'fadeInUp .7s ease both',
                      animationDelay: '420ms',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                        Despesas por categoria
                      </Typography>
                      <Typography sx={{ mt: 0.5, mb: 1.2, fontSize: 13, color: 'var(--muted)' }}>
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
        <AddInvoiceModal invoice={editingExpense} open={Boolean(editingExpense)} handleClose={() => setEditingExpense(undefined)} />
      </LayoutMobile>
    </>
  );
}




