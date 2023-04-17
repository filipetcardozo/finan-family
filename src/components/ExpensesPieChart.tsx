import { List, Stack } from '@mui/material'
import { useMemo } from 'react'
import { PieChart as PieChartRecharts, ResponsiveContainer, Pie, Cell, Legend } from 'recharts'
import { IInvoice } from '../providers/invoices/types'
import { formatterCurrency } from '../utils/formatters'
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';

interface Props {
  expenses: IInvoice[]
}

export const PieChart: React.FC<Props> = ({
  expenses
}) => {
  const COLORS = ['#d00000', '#ffba08', '#1b998b', '#3e517a', '#a480f2', '#cf0bf1', '#46237a', '#c3c4e9', '#9cc76d', '#4d86a5'];
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if ((percent * 100) > 4) {
      return <text fontSize={15} x={x} y={y} fill='white' textAnchor='middle' dominantBaseline='central'>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    } else {
      return <></>
    };
  };

  const dataPieChart = useMemo(() => {
    if (expenses) {
      let categories: string[] = [];

      expenses.map(v => {
        if (!categories.includes(v.invoiceCategory)) {
          categories.push(v.invoiceCategory);
        }
      })

      return categories.map(category => {
        let categoryName = '';
        let valueTotal = 0;

        [...expenses].filter(v => {
          return v.invoiceCategory === category
        }).forEach(v => {
          categoryName = v.invoiceCategory;
          valueTotal += v.value!;
        })

        return {
          expenseCategory: categoryName,
          value: valueTotal
        }
      }).sort((a, b) => b.value - a.value)
    } else {
      return [];
    }
  }, [expenses])

  if (!dataPieChart) return <></>;

  return <Stack flexDirection='row' width={1}>
    <Box sx={{ width: '200px', height: '200px', overflowY: 'auto', display: 'flex', alignItems: dataPieChart.length > 5 ? 'flex-start' : 'center' }}>
      <List dense>
        {dataPieChart.map((v, index) => {
          return <ListItem disablePadding key={v.value} style={{ color: COLORS[index % COLORS.length] }}>
            <DonutLargeIcon style={{ marginRight: 7, marginLeft: 15, fontSize: 12, top: 1, position: 'relative' }} />
            <ListItemText primary={<span style={{ fontSize: 12 }}>{v.expenseCategory}: {formatterCurrency(v.value)}</span>} />
          </ListItem>
        })}
      </List>
    </Box>
    <ResponsiveContainer width='50%' height='100%'>
      <PieChartRecharts margin={{ right: 0 }}>
        <Pie
          data={dataPieChart}
          dataKey='value'
          nameKey='expenseCategory'
          cx='50%' cy='50%'
          label={renderCustomizedLabel}
          textAnchor=''
          legendType='line'
          labelLine={false}
        >
          {expenses.map((entry, index) => (
            <Cell stroke={COLORS[index % COLORS.length]} key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChartRecharts>
    </ResponsiveContainer>
  </Stack >
}