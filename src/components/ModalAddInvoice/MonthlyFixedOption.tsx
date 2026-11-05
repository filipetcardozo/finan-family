import React from 'react';
import { Checkbox, FormControlLabel, Typography } from '@mui/material';

interface Props {
  checked: boolean;
  disabled: boolean;
  onChange(checked: boolean): void;
}

export function MonthlyFixedOption({ checked, disabled, onChange }: Props) {
  return (
    <FormControlLabel sx={{ m: 0, ml: -1.25 }}
      control={<Checkbox checked={checked} disabled={disabled} size='small'
        onChange={event => onChange(event.target.checked)} sx={{ p: 1.25, minHeight: 44, minWidth: 44 }} />}
      label={<Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Despesa fixa do mês</Typography>}
    />
  );
}
