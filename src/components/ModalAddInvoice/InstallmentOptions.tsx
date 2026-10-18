import React from 'react';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { isValidInstallmentCount, MAX_INSTALLMENTS } from '../../utils/installments';
import { formatterCurrency } from '../../utils/formatters';

interface InstallmentOptionsProps {
  checked: boolean;
  count: string;
  value: number | undefined;
  disabled: boolean;
  onCheckedChange(checked: boolean): void;
  onCountChange(count: string): void;
}

export function InstallmentOptions({ checked, count, value, disabled, onCheckedChange, onCountChange }: InstallmentOptionsProps) {
  const quantity = Number(count);
  const valid = isValidInstallmentCount(quantity);
  return (
    <Box sx={{ mt: 1 }}>
      <FormControlLabel sx={{ m: 0, ml: -1.25 }}
        control={<Checkbox checked={checked} disabled={disabled} size='small'
          onChange={event => onCheckedChange(event.target.checked)} sx={{ p: 1.25, minHeight: 44, minWidth: 44 }} />}
        label={<Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Compra parcelada</Typography>}
      />
      {checked && <TextField
        label='Quantidade de parcelas' size='small' type='number' fullWidth autoComplete='off'
        value={count} disabled={disabled} error={!valid}
        onChange={event => onCountChange(event.target.value)}
        inputProps={{ min: 2, max: MAX_INSTALLMENTS, step: 1, inputMode: 'numeric' }}
        helperText={!valid ? `Informe de 2 a ${MAX_INSTALLMENTS} parcelas.`
          : value && Number.isFinite(value) && value > 0
            ? `${quantity} × ${formatterCurrency(value)} · Total ${formatterCurrency(value * quantity)}`
            : 'O valor informado é de cada parcela.'}
        sx={{ mt: 1, '& .MuiInputBase-root': { minHeight: 44 } }}
      />}
    </Box>
  );
}
