import React from 'react';
import { Alert, Box, Button, FormControl, FormControlLabel, FormLabel, LinearProgress, Radio, RadioGroup } from '@mui/material';

export type InstallmentEditScope = 'single' | 'all';

interface Props {
  scope: InstallmentEditScope;
  onChange(scope: InstallmentEditScope): void;
  loading: boolean;
  disabled: boolean;
  error: string;
  onRetry(): void;
}

export function InstallmentEditOptions({ scope, onChange, loading, disabled, error, onRetry }: Props) {
  return (
    <Box sx={{ mt: 2 }}>
      <FormControl disabled={disabled}>
        <FormLabel id='installment-edit-scope' sx={{ fontSize: 12 }}>Aplicar alteração</FormLabel>
        <RadioGroup row aria-labelledby='installment-edit-scope' value={scope} onChange={event => onChange(event.target.value as InstallmentEditScope)}>
          <FormControlLabel value='single' control={<Radio size='small' />} label='Só esta parcela' sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }} />
          <FormControlLabel value='all' control={<Radio size='small' />} label='Todas as parcelas' sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }} />
        </RadioGroup>
      </FormControl>
      {loading && <LinearProgress aria-label='Carregando parcelas da compra' sx={{ mt: 1 }} />}
      {error && <Alert severity='error' sx={{ mt: 1 }} action={<Button type='button' color='inherit' size='small' disabled={disabled} onClick={onRetry}>Tentar novamente</Button>}>{error}</Alert>}
    </Box>
  );
}
