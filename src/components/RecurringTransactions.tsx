import React, { useContext, useEffect, useRef, useState } from 'react';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, IconButton, Menu, MenuItem, Paper, Stack, TextField,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useSnackbar } from 'notistack';
import { ExpensesContext } from '../contexts/expenses';
import { RevenuesContext } from '../contexts/revenues';
import { MonthSelectedContext } from '../contexts/monthSelected';
import { useAuth } from '../hooks/useAuth';
import { CurrencyInput } from './InputCurrency';
import { formatterCurrency } from '../utils/formatters';
import {
  buildRecurringCandidates, dateForRecurringDay, isValidRecurringSelection, normalizeRecurringText,
} from '../utils/recurringTransactions';
import { launchRecurringTransactions, loadRecurringData, stopRecurringTemplate } from '../providers/recurring/services';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import type { RecurringReviewRow, RecurringSelection, TransactionKind } from '../providers/recurring/types';

interface ReviewProps {
  kind: TransactionKind;
  uid: string;
  month: Dayjs;
  onClose(): void;
}

export function RecurringTransactionsButton({ kind }: { kind: TransactionKind }) {
  const { uid } = useAuth();
  const { dateToAnalyze } = useContext(MonthSelectedContext);
  // Changing account/month closes any review of the old context.
  return <RecurringEntry key={`${uid}:${dateToAnalyze.format('YYYY-MM')}`} kind={kind} uid={uid} month={dateToAnalyze} />;
}

function RecurringEntry({ kind, uid, month }: Omit<ReviewProps, 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant='outlined' startIcon={<RepeatRoundedIcon />} onClick={() => setOpen(true)} disabled={!uid}
        sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' }, minHeight: 44, borderRadius: 2.5 }}
      >
        Repetir lançamentos
      </Button>
      {open && <RecurringReview kind={kind} uid={uid} month={month} onClose={() => setOpen(false)} />}
    </>
  );
}

function RecurringReview({ kind, uid, month, onClose }: ReviewProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const { handleAddInvoices } = useContext(ExpensesContext);
  const { handleAddRevenues } = useContext(RevenuesContext);
  const [rows, setRows] = useState<RecurringReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; row: RecurringReviewRow } | null>(null);
  const [stoppingId, setStoppingId] = useState('');
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  const savingRef = useRef(false);
  const plural = kind === 'expense' ? 'despesas' : 'receitas';

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    loadRecurringData(uid, kind, month)
      .then(data => {
        if (cancelled) return;
        setRows(buildRecurringCandidates(kind, month, data.history, data.templates, data.current).map(candidate => ({
          ...candidate,
          selected: candidate.saved && !candidate.alreadyPosted,
          value: candidate.template.value,
          date: dateForRecurringDay(month, candidate.template.day),
        })));
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível buscar seus lançamentos. Tente novamente.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid, kind, month, attempt]);

  const updateRow = (id: string, update: Partial<RecurringReviewRow>) => {
    setRows(previous => previous.map(row => row.template.id === id ? { ...row, ...update } : row));
  };
  const selected = rows.filter(row => row.selected && !row.alreadyPosted);
  const total = selected.reduce((sum, row) => sum + (row.value || 0), 0);
  const toSelection = (row: RecurringReviewRow): RecurringSelection => ({
    template: row.template, value: row.value ?? NaN, date: row.date,
  });
  const valid = selected.every(row => isValidRecurringSelection(toSelection(row), month));
  const primaryRows = rows.filter(row => row.saved || row.suggested || row.selected);
  const historyRows = rows.filter(row => !row.saved && !row.suggested);
  const normalizedSearch = normalizeRecurringText(search);
  const filteredHistory = historyRows.filter(row => normalizeRecurringText(
    `${row.template.category} ${row.template.description}`,
  ).includes(normalizedSearch));
  const available = primaryRows.filter(row => !row.alreadyPosted);
  const busy = saving || Boolean(stoppingId);

  const handleClose = () => { if (!savingRef.current && !stoppingId) onClose(); };

  const launch = async () => {
    if (savingRef.current || busy || !selected.length || !valid) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const result = await launchRecurringTransactions(uid, kind, month, selected.map(toSelection));
      if (!mounted.current) return;
      if (kind === 'expense') handleAddInvoices(result.transactions as IInvoice[]);
      else handleAddRevenues(result.transactions as IRevenue[]);
      const message = result.createdCount
        ? `${result.createdCount} ${result.createdCount === 1 ? (kind === 'expense' ? 'despesa lançada' : 'receita lançada') : `${plural} lançadas`}.`
        : 'Os itens selecionados já foram lançados neste mês.';
      enqueueSnackbar(`${message}${result.skippedCount && result.createdCount ? ' Itens já lançados foram ignorados.' : ''}`, {
        variant: result.createdCount ? 'success' : 'info',
      });
      onClose();
    } catch {
      if (mounted.current) setError('Não foi possível confirmar os lançamentos. Tente novamente; os itens não serão duplicados.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const stopRepeating = async () => {
    if (!menu || busy) return;
    const { template } = menu.row;
    setMenu(null);
    setStoppingId(template.id);
    setError('');
    try {
      await stopRecurringTemplate(uid, template);
      if (!mounted.current) return;
      setRows(previous => previous.map(row => row.template.id === template.id
        ? { ...row, saved: false, suggested: false, selected: false } : row));
      enqueueSnackbar('Item removido da lista mensal. Os lançamentos anteriores foram mantidos.', { variant: 'success' });
    } catch {
      if (mounted.current) setError('Não foi possível alterar a lista mensal. Tente novamente.');
    } finally {
      if (mounted.current) setStoppingId('');
    }
  };

  const renderRow = (row: RecurringReviewRow, fromHistory = false) => {
    const { template } = row;
    const title = template.description.trim() || template.category;
    const dateValid = isValidRecurringSelection({ ...toSelection(row), value: 1 }, month);
    return (
      <Paper key={template.id} variant='outlined' sx={{
        p: 1.5, borderRadius: 3,
        borderColor: row.selected ? 'primary.main' : 'rgba(6,42,63,.12)',
        backgroundColor: row.selected ? '#f5fbfa' : 'background.paper',
      }}>
        <Stack direction='row' alignItems='flex-start' spacing={0.5}>
          <Checkbox
            id={`recurring-item-${encodeURIComponent(template.id)}`}
            checked={row.selected && !row.alreadyPosted}
            disabled={busy || row.alreadyPosted}
            inputProps={{ 'aria-label': `${row.alreadyPosted ? 'Já lançado' : 'Selecionar'}: ${title}` }}
            onChange={event => updateRow(template.id, { selected: event.target.checked })}
            sx={{ p: 1.25, ml: -0.75, mt: -0.5 }}
          />
          <Box sx={{ flex: 1, minWidth: 0, pt: 0.4 }}>
            <Typography component='label' htmlFor={`recurring-item-${encodeURIComponent(template.id)}`}
              sx={{ fontWeight: 600, display: 'block', overflowWrap: 'anywhere', cursor: row.alreadyPosted || busy ? 'default' : 'pointer' }}
            >
              {title}
            </Typography>
            {template.description.trim() && <Typography variant='body2' color='text.secondary'>{template.category}</Typography>}
            {!row.selected && <Typography variant='body2' sx={{ mt: 0.5 }}>{formatterCurrency(row.value)}</Typography>}
            {!row.saved && !fromHistory && !row.alreadyPosted && <Typography variant='caption' color='text.secondary'>Em {row.occurrences} dos últimos 6 meses</Typography>}
          </Box>
          {row.alreadyPosted ? <Chip label='Já lançado' size='small' sx={{ mt: 0.5 }} /> : row.saved ? (
            <IconButton aria-label={`Opções de ${title}`} disabled={busy}
              onClick={event => setMenu({ anchor: event.currentTarget, row })} sx={{ minWidth: 44, minHeight: 44 }}>
              <MoreVertRoundedIcon />
            </IconButton>
          ) : null}
        </Stack>
        {row.selected && !row.alreadyPosted && <Box sx={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 1.5, mt: 1.5,
          '& .MuiFormControl-root': { m: 0 },
          '& .MuiInputBase-root': { minHeight: 44 },
        }}>
          <Box sx={{ minWidth: 0 }}>
            <CurrencyInput nameOfKeyValue='value' disabled={busy} form={{
              values: { value: row.value },
              setFieldValue: (_name: string, value: number | undefined) => updateRow(template.id, { value }),
            }} />
            {(!row.value || !Number.isFinite(row.value) || row.value <= 0) && <Typography variant='caption' color='error'>Informe um valor maior que zero.</Typography>}
          </Box>
          <TextField
            label='Data' type='date' size='small' fullWidth disabled={busy}
            value={row.date} error={!dateValid}
            helperText={!dateValid ? 'Escolha uma data deste mês.' : undefined}
            onChange={event => updateRow(template.id, { date: event.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: month.startOf('month').format('YYYY-MM-DD'), max: month.endOf('month').format('YYYY-MM-DD') }}
            sx={{ minWidth: 0, '& input': { minWidth: 0, px: 1, minHeight: 24 } }}
          />
        </Box>}
      </Paper>
    );
  };

  return (
    <Dialog open onClose={handleClose} fullScreen={mobile} fullWidth maxWidth='sm'
      aria-labelledby='recurring-title' PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 } } }}>
      <DialogTitle component='div' sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(6,42,63,.1)' }}>
        <Stack direction='row' alignItems='center' spacing={1}>
          {historyOpen && <IconButton aria-label='Voltar para revisão' onClick={() => setHistoryOpen(false)} sx={{ minWidth: 44, minHeight: 44 }}><ArrowBackRoundedIcon /></IconButton>}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography id='recurring-title' component='h2' sx={{ fontSize: 20, fontWeight: 700 }}>
              {historyOpen ? 'Adicionar do histórico' : `Repetir ${plural}`}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ textTransform: 'capitalize' }}>{month.locale('pt-br').format('MMMM [de] YYYY')}</Typography>
          </Box>
          <IconButton aria-label='Fechar revisão' onClick={handleClose} disabled={busy} sx={{ minWidth: 44, minHeight: 44 }}><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 2, backgroundColor: '#fbfdfd' }}>
        {error && <Alert severity='error' sx={{ my: 1.5 }} action={!rows.length && !loading ? <Button color='inherit' onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button> : undefined}>{error}</Alert>}
        {loading ? <Stack alignItems='center' spacing={2} sx={{ py: 6 }} role='status'>
          <CircularProgress size={28} />
          <Typography variant='body2'>Buscando nos últimos 6 meses…</Typography>
        </Stack> : error && !rows.length ? null : historyOpen ? <Stack spacing={1.5} sx={{ pt: 1 }}>
          <TextField label='Buscar no histórico' value={search} onChange={event => setSearch(event.target.value)} size='small' fullWidth autoComplete='off' />
          <Typography variant='body2' color='text.secondary'>Escolha um item para incluir na sua lista mensal.</Typography>
          {filteredHistory.map(row => renderRow(row, true))}
          {!filteredHistory.length && <Typography sx={{ py: 3, textAlign: 'center' }}>Nenhum outro item encontrado.</Typography>}
        </Stack> : <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>Selecione os itens e revise valores e datas.</Typography>
          {available.length > 1 && <FormControlLabel sx={{ ml: 0 }}
            control={<Checkbox disabled={busy} checked={available.every(row => row.selected)}
              indeterminate={available.some(row => row.selected) && !available.every(row => row.selected)}
              onChange={event => {
                const checked = event.target.checked;
                const ids = new Set(available.map(row => row.template.id));
                setRows(previous => previous.map(row => ids.has(row.template.id) ? { ...row, selected: checked } : row));
              }} sx={{ minHeight: 44 }} />}
            label={<Typography variant='body2'>Selecionar todos</Typography>} />}
          {primaryRows.map(row => renderRow(row))}
          {!primaryRows.length && <Box sx={{ py: 4, textAlign: 'center' }}>
            <RepeatRoundedIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
            <Typography sx={{ fontWeight: 600 }}>Nenhum item mensal encontrado</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              {rows.length ? 'Você pode escolher itens do histórico para começar.' : 'Lançamentos repetidos em pelo menos dois dos últimos seis meses aparecerão aqui.'}
            </Typography>
          </Box>}
          {historyRows.length > 0 && <Button startIcon={<AddRoundedIcon />} disabled={busy}
            onClick={() => setHistoryOpen(true)} sx={{ alignSelf: 'flex-start', minHeight: 44 }}>Adicionar do histórico</Button>}
          {rows.length > 0 && <Typography variant='caption' color='text.secondary'>Os itens escolhidos ficam salvos para os próximos meses. Nada é lançado automaticamente.</Typography>}
        </Stack>}
      </DialogContent>
      <DialogActions sx={{
        display: 'block', p: 2, pb: 'max(16px, env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(6,42,63,.1)', backgroundColor: 'background.paper',
      }}>
        {historyOpen ? <Button variant='contained' fullWidth onClick={() => setHistoryOpen(false)} sx={{ minHeight: 48, borderRadius: 2.5 }}>Voltar para revisão{selected.length ? ` (${selected.length})` : ''}</Button> : <>
          {selected.length > 0 && <Typography variant='body2' sx={{ mb: 1.5 }} aria-live='polite'>
            {selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'} · <strong>{formatterCurrency(total)}</strong>
          </Typography>}
          <Stack direction='row' spacing={1}>
            <Button onClick={handleClose} disabled={busy} sx={{ minHeight: 48, px: 2 }}>Cancelar</Button>
            <Button variant='contained' onClick={launch} disabled={loading || busy || !selected.length || !valid}
              startIcon={saving ? <CircularProgress size={18} color='inherit' /> : undefined}
              sx={{ flex: 1, minHeight: 48, borderRadius: 2.5, boxShadow: 'none' }}>
              {saving ? 'Lançando…' : selected.length ? `Lançar ${selected.length} ${selected.length === 1 ? (kind === 'expense' ? 'despesa' : 'receita') : plural}` : 'Selecione os itens'}
            </Button>
          </Stack>
        </>}
      </DialogActions>
      <Menu open={Boolean(menu)} anchorEl={menu?.anchor} onClose={() => setMenu(null)}>
        <MenuItem onClick={stopRepeating} disabled={busy} sx={{ minHeight: 48 }}>Parar de repetir</MenuItem>
      </Menu>
    </Dialog>
  );
}
