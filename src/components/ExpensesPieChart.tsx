import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import { useMemo } from 'react';
import { Cell, Pie, PieChart as PieChartRecharts, ResponsiveContainer } from 'recharts';
import { IInvoice } from '../providers/invoices/types';
import { formatterCurrency } from '../utils/formatters';

interface Props {
  expenses: IInvoice[];
}

export const PieChart: React.FC<Props> = ({ expenses }) => {
  const COLORS = ['#d1495b', '#edae49', '#00798c', '#30638e', '#4f772d', '#6c4f7d', '#ef5d60', '#4f6d7a'];
  const RADIAN = Math.PI / 180;

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

  const dataPieChart = useMemo(() => {
    const categories = new Map<string, number>();

    expenses.forEach(invoice => {
      if (isInvestmentCategory(invoice.invoiceCategory)) {
        return;
      }

      const currentValue = categories.get(invoice.invoiceCategory) ?? 0;
      categories.set(invoice.invoiceCategory, currentValue + (invoice.value ?? 0));
    });

    return Array.from(categories.entries())
      .map(([expenseCategory, value]) => ({ expenseCategory, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if ((percent * 100) <= 5) {
      return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text fontSize={12} x={x} y={y} fill='white' textAnchor='middle' dominantBaseline='central'>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (dataPieChart.length === 0) {
    return <Typography sx={{ fontSize: 14, color: '#607d92' }}>Sem despesas para gerar o gráfico neste mês.</Typography>;
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems='stretch' width={1}>
      <Box
        sx={{
          width: { xs: '100%', sm: '52%' },
          maxHeight: 220,
          overflowY: 'auto',
          borderRadius: 2,
          border: '1px solid rgba(16, 50, 72, 0.09)',
          backgroundColor: '#ffffffb2',
        }}
      >
        <List dense>
          {dataPieChart.map((v, index) => {
            return (
              <ListItem disablePadding key={`${v.expenseCategory}-${v.value}`} sx={{ px: 1, py: 0.25 }}>
                <DonutLargeIcon
                  sx={{ mr: 0.8, fontSize: 13, color: COLORS[index % COLORS.length], flexShrink: 0 }}
                />
                <ListItemText
                  primary={
                    <Box component='span' sx={{ fontSize: 12.5, color: '#103248' }}>
                      {v.expenseCategory}: {formatterCurrency(v.value)}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ width: { xs: '100%', sm: '48%' }, height: 220, minHeight: 220 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChartRecharts>
            <Pie
              data={dataPieChart}
              dataKey='value'
              nameKey='expenseCategory'
              cx='50%'
              cy='50%'
              outerRadius='90%'
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {dataPieChart.map((entry, index) => (
                <Cell key={`${entry.expenseCategory}-${entry.value}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChartRecharts>
        </ResponsiveContainer>
      </Box>
    </Stack>
  );
};
