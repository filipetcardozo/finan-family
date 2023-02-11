import { useMemo } from 'react'
import { PieChart as PieChartRecharts, ResponsiveContainer, Pie, Cell, Legend } from 'recharts'
import { IInvoice } from '../../providers/invoices/types'
import { formatterCurrency } from '../../utils/formatters'

interface Props {
  expenses: IInvoice[]
}

export const PieChart: React.FC<Props> = ({
  expenses
}) => {
  const COLORS = ['#d00000', '#ffba08', '#1b998b', '#3e517a', '#ffba08', '#cf0bf1', '#46237a', '#c3c4e9', '#9cc76d', '#4d86a5'];
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if ((percent * 100) > 5) {
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

  return <ResponsiveContainer width='96%' height='100%'>
    <PieChartRecharts
      width={400} height={400}
    >
      <Legend iconSize={15}
        formatter={(value, payload: any) => <text
          style={{
            fontSize: 11,

          }}
        >
          {value}: {formatterCurrency(payload.payload.value)}
        </text>}
        layout='vertical'
        verticalAlign='middle'
        align='left'
      />
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
}