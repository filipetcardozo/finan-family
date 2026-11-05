import React from 'react';
import TextField from '@mui/material/TextField';
import type { CategoryOption } from './types';

interface Props {
  options: CategoryOption[];
  value: string;
  onChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
}

export function CategorySelect({ options, value, onChange, groupBy }: Props) {
  const groups = new Map<string, CategoryOption[]>();
  if (groupBy) options.forEach(option => {
    const group = groupBy(option);
    const entries = groups.get(group);
    if (entries) entries.push(option);
    else groups.set(group, [option]);
  });

  return (
    <TextField
      select fullWidth size='small' label='Categoria' name='category'
      value={value} onChange={event => onChange(event.target.value)}
      SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
    >
      <option value='' disabled aria-label='Categoria' />
      {value && !options.some(option => option.label === value) && <option value={value}>{value}</option>}
      {groupBy ? Array.from(groups, ([group, entries]) => (
        <optgroup key={group} label={group}>
          {entries.map(option => <option key={option.label} value={option.label}>{option.label}</option>)}
        </optgroup>
      )) : options.map(option => <option key={option.label} value={option.label}>{option.label}</option>)}
    </TextField>
  );
}
