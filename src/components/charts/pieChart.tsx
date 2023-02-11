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
  const COLORS = ['#012a4a', '#013a63', '#01497c', '#014f86', '#2a6f97', '#2c7da0', '#468faf', '#61a5c2', '#89c2d9', '#a9d6e5'];
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

  return <ResponsiveContainer width='80%' height='100%'>
    <PieChartRecharts
      width={400} height={400}
    >
      <Legend iconSize={15}
        formatter={(value, payload: any) => <text
          style={{
            fontSize: 15,

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
        fill='#012a4a'
        stroke='#013a63'
      >
        {expenses.map((entry, index) => (
          <Cell stroke={COLORS[index % COLORS.length]} key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChartRecharts>
  </ResponsiveContainer>
}