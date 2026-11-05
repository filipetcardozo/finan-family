import React, { useId, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { Box, CardActionArea, Chip, Collapse, Divider, Paper, Stack, Typography } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import type { IInvoice } from '../providers/invoices/types';
import { formatterCurrency } from '../utils/formatters';
import { isInstallmentInvoice } from '../utils/installments';
import { PendingSyncChip } from './PendingSyncChip';

interface Props {
  expenses: IInvoice[];
  onEdit?: (expense: IInvoice) => void;
  canEdit?: boolean;
}

function ExpenseGroup({ entries, highlight = false, onEdit, canEdit = true }: { entries: IInvoice[]; highlight?: boolean; onEdit?: Props['onEdit']; canEdit?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const total = entries.reduce((sum, expense) => sum + (expense.value ?? 0), 0);
  return (
    <Paper variant='outlined' sx={{ overflow: 'hidden', borderRadius: 3, borderColor: 'var(--border)', boxShadow: 'none' }}>
      <CardActionArea onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={detailsId}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, bgcolor: highlight ? 'var(--primary-soft)' : 'var(--subtle)' }}>
          <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>{entries.length} {entries.length === 1 ? 'lançamento' : 'lançamentos'}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatterCurrency(total)}</Typography>
          <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: 'var(--primary-text)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
        </Stack>
      </CardActionArea>
      <Collapse in={expanded} timeout='auto' id={detailsId}>
        <Divider sx={{ borderColor: 'var(--border)' }} />
        <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {entries.map(expense => (
            <Box component='li' key={expense.id} sx={{ '& + li': { borderTop: '1px solid var(--border)' } }}>
              <CardActionArea disabled={!onEdit || !canEdit || expense.pendingSync} onClick={() => onEdit?.(expense)}
                aria-label={`Editar despesa: ${expense.invoiceCategory}${expense.description ? `, ${expense.description}` : ''}`}
                sx={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', gap: 1,
                  px: { xs: 1.5, sm: 2 }, py: 1.5, textAlign: 'left',
                  transition: 'background-color .2s', '&:hover': { bgcolor: 'var(--subtle)' },
                }}>
                <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--text)' }}>{expense.invoiceCategory || 'Sem categoria'}</Typography>
                  {expense.description && <Typography sx={{ mt: 0.4, fontSize: 12, fontWeight: 400, lineHeight: 1.5, color: 'var(--muted)' }}>{expense.description}</Typography>}
                  {expense.pendingSync && <Box sx={{ mt: 0.6 }}><PendingSyncChip /></Box>}
                </Box>
                <Typography sx={{ pt: 0.1, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                  {formatterCurrency(expense.value)}
                </Typography>
              </CardActionArea>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

export const MonthlyExpensesTimeline = ({ expenses, onEdit, canEdit = true }: Props) => {
  const { groups, fixedExpenses, installmentExpenses } = useMemo(() => {
    const byDay = new Map<string, IInvoice[]>();
    const fixedExpenses: IInvoice[] = [];
    const installmentExpenses: IInvoice[] = [];
    // ISO date keys keep days in calendar order, regardless of the source order.
    expenses.forEach(expense => {
      if (isInstallmentInvoice(expense)) {
        installmentExpenses.push(expense);
        return;
      }
      if (expense.isMonthlyFixed) {
        fixedExpenses.push(expense);
        return;
      }
      const key = expense.addDate?.isValid() ? expense.addDate.format('YYYY-MM-DD') : '';
      const entries = byDay.get(key);
      if (entries) entries.push(expense);
      else byDay.set(key, [expense]);
    });
    const groups = Array.from(byDay, ([date, entries]) => ({
      date,
      entries: [...entries].sort((left, right) => (right.addDate?.valueOf() ?? 0) - (left.addDate?.valueOf() ?? 0)),
    })).sort((left, right) => right.date.localeCompare(left.date));
    const byCategory = (left: IInvoice, right: IInvoice) => (left.invoiceCategory ?? '').localeCompare(right.invoiceCategory ?? '', 'pt-BR')
      || (left.description ?? '').localeCompare(right.description ?? '', 'pt-BR');
    fixedExpenses.sort(byCategory);
    installmentExpenses.sort(byCategory);
    return { groups, fixedExpenses, installmentExpenses };
  }, [expenses]);

  if (!expenses.length) {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 5, px: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 4, bgcolor: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
          <ReceiptLongRoundedIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>Nenhuma despesa neste mês.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {[
        { id: 'fixed-monthly-expenses-heading', title: 'Despesas fixas do mês', entries: fixedExpenses, icon: <CalendarMonthRoundedIcon fontSize='small' /> },
        { id: 'installment-expenses-heading', title: 'Despesas parceladas', entries: installmentExpenses, icon: <CreditCardRoundedIcon fontSize='small' /> },
      ].filter(group => group.entries.length > 0).map(group => (
        <Box key={group.id} component='section' aria-labelledby={group.id}>
          <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'var(--primary-soft)', color: 'var(--primary-text)', flexShrink: 0 }}>
              {group.icon}
            </Box>
            <Typography id={group.id} component='h3' sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>{group.title}</Typography>
          </Stack>
          <ExpenseGroup entries={group.entries} highlight onEdit={onEdit} canEdit={canEdit} />
        </Box>
      ))}
      {groups.length > 0 && (
        <Timeline aria-label='Despesas do mês, da mais recente à mais antiga' sx={{ m: 0, p: 0 }}>
          {groups.map((group, index) => {
            const date = group.date ? dayjs(group.date).locale('pt-br') : null;
            const isToday = group.date === dayjs().format('YYYY-MM-DD');
            const isLatest = index === 0 && Boolean(date);
            return (
              <TimelineItem key={group.date || 'undated'} sx={{ '&::before': { display: 'none' }, minHeight: 0 }}>
                <TimelineSeparator>
                  <TimelineDot
                    variant={isLatest ? 'filled' : 'outlined'}
                    sx={{
                      m: 0, mt: 0.5, p: 0, width: 34, height: 34, boxSizing: 'border-box',
                      borderColor: isLatest ? 'var(--primary-text)' : 'var(--border)',
                      bgcolor: isLatest ? 'var(--action)' : 'var(--subtle)', color: isLatest ? 'var(--action-text)' : 'var(--muted)',
                      boxShadow: isLatest ? '0 0 0 4px var(--primary-soft)' : 'none',
                      display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {date?.format('DD') ?? '—'}
                  </TimelineDot>
                  {index < groups.length - 1 && <TimelineConnector sx={{ bgcolor: 'var(--border)', width: 2, my: 1 }} />}
                </TimelineSeparator>
                <TimelineContent sx={{ minWidth: 0, pt: 0, pr: 0, pl: { xs: 1.5, sm: 2 }, pb: index === groups.length - 1 ? 0 : 3 }}>
                  <Stack direction='row' spacing={1} alignItems='center' sx={{ minHeight: 42, mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Typography component='h3' sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)', textTransform: 'capitalize' }}>
                      {date?.format('dddd, D [de] MMMM') ?? 'Sem data'}
                    </Typography>
                    {(isToday || isLatest) && (
                      <Chip
                        size='small'
                        label={isToday ? 'Hoje' : 'Mais recente'}
                        sx={{ height: 21, fontSize: 10, fontWeight: 500, bgcolor: 'var(--primary-soft)', color: 'var(--primary-text)', '& .MuiChip-label': { px: 1 } }}
                      />
                    )}
                  </Stack>
                  <ExpenseGroup entries={group.entries} highlight={isLatest} onEdit={onEdit} canEdit={canEdit} />
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Stack>
  );
};
