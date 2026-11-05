import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import { formatterCurrency } from '../utils/formatters';
import { isInstallmentInvoice } from '../utils/installments';
import { getExpenseSeries } from '../utils/expenseSeries';
import type { ExpenseDeletionOptions } from '../providers/invoices/deletion';

interface Props {
  transaction: IInvoice | IRevenue | null;
  kind: 'expense' | 'revenue';
  onClose(): void;
  onConfirm(id: string, options?: ExpenseDeletionOptions): Promise<void>;
  onLoadFuture?: (transaction: IInvoice) => Promise<IInvoice[]>;
}

export function DeleteTransactionDialog({ transaction, kind, onClose, onConfirm, onLoadFuture }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [includeFuture, setIncludeFuture] = useState(false);
  const [future, setFuture] = useState<IInvoice[] | null>(null);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [futureError, setFutureError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const noun = kind === 'expense' ? 'despesa' : 'receita';
  const installment = Boolean(transaction && kind === 'expense' && isInstallmentInvoice(transaction as IInvoice));
  const monthly = installment || Boolean(transaction && 'isMonthlyFixed' in transaction && transaction.isMonthlyFixed);
  const category = transaction && (kind === 'expense' ? (transaction as IInvoice).invoiceCategory : (transaction as IRevenue).revenueCategory);
  const series = transaction && kind === 'expense' ? getExpenseSeries(transaction as IInvoice) : null;
  const hasSeries = Boolean(series && onLoadFuture);
  useEffect(() => { setError(''); setIncludeFuture(false); setFuture(null); setFutureError(''); }, [transaction?.id, kind]);
  useEffect(() => {
    if (!includeFuture || !hasSeries || !transaction || !onLoadFuture) return;
    let cancelled = false;
    setLoadingFuture(true);
    setFutureError('');
    onLoadFuture(transaction as IInvoice)
      .then(entries => { if (!cancelled) setFuture(entries); })
      .catch(() => { if (!cancelled) setFutureError('Não foi possível buscar os lançamentos futuros.'); })
      .finally(() => { if (!cancelled) setLoadingFuture(false); });
    return () => { cancelled = true; };
  }, [includeFuture, hasSeries, transaction, onLoadFuture, attempt]);

  const confirm = async () => {
    if (!transaction || busy.current || (includeFuture && (!future || loadingFuture || futureError))) return;
    busy.current = true;
    setDeleting(true);
    setError('');
    try {
      await onConfirm(transaction.id, { includeFuture, futureIds: includeFuture ? future!.map(entry => entry.id) : [] });
      onClose();
    } catch (failure) {
      setError((failure as { code?: string })?.code === 'expense-delete/review' ? (failure as Error).message
        : navigator.onLine ? 'Não foi possível excluir. Tente novamente.' : 'Conecte-se para excluir este lançamento.');
      if (includeFuture) { setFuture(null); setAttempt(value => value + 1); }
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };

  return <Dialog open={Boolean(transaction)} onClose={() => { if (!busy.current) onClose(); }} disableEscapeKeyDown={deleting}
    fullWidth maxWidth='xs' aria-labelledby={`delete-${kind}-title`} aria-describedby={`delete-${kind}-details`}
    PaperProps={{ sx: { borderRadius: 4, border: '1px solid var(--border)' } }}>
    <DialogTitle component='div' sx={{ px: 3, pt: 3, pb: 2 }}>
      <Stack direction='row' spacing={1.5} alignItems='center'>
        <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'var(--expense-soft)', color: 'var(--expense-text)' }}>
          <DeleteOutlineRoundedIcon />
        </Box>
        <Typography id={`delete-${kind}-title`} component='h2' sx={{ fontSize: 20, fontWeight: 700 }}>Excluir {noun}?</Typography>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ px: 3, pb: 1 }}>
      <Paper variant='outlined' id={`delete-${kind}-details`} sx={{ p: 2, borderRadius: 3, bgcolor: 'var(--subtle)', borderColor: 'var(--border)' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{category || 'Sem categoria'}</Typography>
        {transaction?.description && <Typography sx={{ fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere', mb: 1 }}>{transaction.description}</Typography>}
        <Typography sx={{ fontSize: 25, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatterCurrency(transaction?.value)}</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>{monthly ? transaction?.addDateFormatted : transaction?.addDate?.format('DD/MM/YYYY')}</Typography>
      </Paper>
      {hasSeries && <Box sx={{ mt: 1.5 }}>
        <FormControlLabel sx={{ alignItems: 'flex-start', mr: 0 }}
          control={<Checkbox checked={includeFuture} disabled={deleting} size='small' onChange={event => {
            setIncludeFuture(event.target.checked); setFuture(null); setFutureError(''); setError('');
          }} sx={{ pt: 0.4 }} />}
          label={<Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>Excluir também todos os lançamentos futuros</Typography>} />
        {includeFuture && <Box sx={{ ml: 3.8, mt: 0.5 }}>
          {loadingFuture ? <Stack direction='row' alignItems='center' spacing={1}><CircularProgress size={13} /><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Buscando lançamentos futuros...</Typography></Stack>
            : futureError ? <Alert severity='warning' sx={{ fontSize: 12, borderRadius: 2 }} action={<Button size='small' onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button>}>{futureError}</Alert>
            : future && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{future.length} {future.length === 1 ? 'lançamento futuro' : 'lançamentos futuros'}</Typography>}
          {series?.kind === 'recurring' && <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>A recorrência também será interrompida.</Typography>}
        </Box>}
      </Box>}
      <Typography sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary' }}>{installment && !hasSeries ? 'Somente esta parcela será excluída.' : 'Esta ação não pode ser desfeita.'}</Typography>
      {error && <Alert severity='error' sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
      <Button onClick={onClose} disabled={deleting} autoFocus>Cancelar</Button>
      <LoadingButton onClick={confirm} loading={deleting} variant='contained' color='error' sx={{
        borderRadius: 2, px: 2, bgcolor: 'var(--expense-text)', color: 'var(--surface)',
        '&:hover': { bgcolor: 'var(--expense-text)' },
      }} disabled={includeFuture && (loadingFuture || !future || Boolean(futureError))}>Excluir</LoadingButton>
    </DialogActions>
  </Dialog>;
}
