import React from 'react';
import { Autocomplete, FormControl, TextField } from '@mui/material';
import type { CategoryOption } from './types';

interface CategoryAutocompleteProps {
  options: CategoryOption[];
  value: string;
  onChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
}

export function CategoryAutocomplete({ options, value, onChange, groupBy }: CategoryAutocompleteProps) {
  return (
    <FormControl fullWidth size="small">
      <Autocomplete<CategoryOption, false, false, false>
        options={options}
        getOptionLabel={(option) => option.label}
        groupBy={groupBy}
        isOptionEqualToValue={(option, selected) => option.label === selected.label}
        renderInput={(params) => (
          <TextField {...params} label="Categoria" variant="outlined" size="small" />
        )}
        onChange={(_event, selectedValue) => onChange(selectedValue ? selectedValue.label : '')}
        value={options.find((option) => option.label === value) || null}
      />
    </FormControl>
  );
}
