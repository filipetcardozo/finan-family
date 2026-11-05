import React, { useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Box, Card, CardContent, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import type { IInvoice } from '../providers/invoices/types';
import { buildMonthlyExpenseAnalysis } from '../utils/monthlyExpenseAnalysis';
import { formatterCurrency } from '../utils/formatters';

interface Props {
  expenses: IInvoice[];
  month: Dayjs;
  showValues: boolean;
}

function HiddenChart() {
  return (
    <Stack alignItems='center' justifyContent='center' spacing={1} sx={{ height: 260, bgcolor: 'var(--subtle)', borderRadius: 3, color: 'text.secondary' }}>
      <VisibilityOffOutlinedIcon />
      <Typography sx={{ fontSize: 13 }}>Valores ocultos</Typography>
    </Stack>
  );
}

export function MonthlyExpenseCharts({ expenses, month, showValues }: Props) {
  const theme = useTheme();
  const today = dayjs().format('YYYY-MM-DD');
  const analysis = useMemo(() => buildMonthlyExpenseAnalysis(expenses, month, dayjs(today)), [expenses, month, today]);
  const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)'];
  const cardSx = { minWidth: 0, borderRadius: 4, borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
  const hasDailyExpenses = analysis.days.some(day => day.count > 0);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      <Card variant='outlined' sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
          <Typography component='h2' sx={{ fontSize: 18, fontWeight: 600, mb: 0.5 }}>Gastos por dia</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>Somente despesas avulsas</Typography>
          {!showValues ? <HiddenChart /> : !hasDailyExpenses ? (
            <Stack justifyContent='center' alignItems='center' sx={{ height: 260 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Nenhuma despesa avulsa no período.</Typography>
            </Stack>
          ) : (
            <Box sx={{ height: 260, minWidth: 0 }} role='img' aria-label='Despesas avulsas por dia do mês, em reais'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={analysis.days} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke='var(--border)' />
                  <XAxis dataKey='day' interval='preserveStartEnd' minTickGap={16} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                  <YAxis width={64} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    tickFormatter={value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 0 }).format(value)} />
                  <ChartTooltip<number | string, string> cursor={{ fill: 'var(--subtle)' }} formatter={value => [formatterCurrency(Number(value)), 'Despesas']}
                    labelFormatter={day => month.date(Number(day)).format('DD/MM/YYYY')}
                    contentStyle={{ borderRadius: 12, borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontFamily: theme.typography.fontFamily, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--primary-text)' }} />
                  <Bar dataKey='value' fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
      <Card variant='outlined' sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
          <Typography component='h2' sx={{ fontSize: 18, fontWeight: 600, mb: 2 }}>Composição das despesas</Typography>
          {!showValues ? <HiddenChart /> : analysis.total === 0 ? (
            <Stack justifyContent='center' alignItems='center' sx={{ height: 260 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Nenhuma despesa neste mês.</Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5} sx={{ minHeight: 280 }}>
              <Typography sx={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatterCurrency(analysis.total)}</Typography>
              <Box sx={{ display: 'flex', height: 22, borderRadius: 2, overflow: 'hidden' }} role='img'
                aria-label={analysis.groups.map(group => `${group.label}: ${formatterCurrency(group.value)}, ${group.percentage.toFixed(1)}%`).join('; ')}>
                {analysis.groups.filter(group => group.value > 0).map(group => (
                  <Tooltip key={group.key} title={`${group.label}: ${formatterCurrency(group.value)} (${group.percentage.toFixed(1)}%)`}>
                    <Box sx={{ width: `${group.percentage}%`, bgcolor: colors[analysis.groups.indexOf(group)] }} />
                  </Tooltip>
                ))}
              </Box>
              <Stack component='ul' spacing={2} sx={{ p: 0, m: 0, listStyle: 'none' }}>
                {analysis.groups.map((group, index) => (
                  <Stack key={group.key} component='li' direction='row' alignItems='center' spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors[index], flexShrink: 0 }} />
                    <Typography sx={{ flex: 1, fontSize: 13 }}>{group.label}</Typography>
                    <Box sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatterCurrency(group.value)}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{group.percentage.toFixed(1).replace('.', ',')}%</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
