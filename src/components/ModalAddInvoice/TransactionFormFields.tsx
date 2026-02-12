import React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { FormikProps } from 'formik';
import { CurrencyInput } from '../InputCurrency';
import { CategoryAutocomplete } from './CategoryAutocomplete';
import type { CategoryOption, TransactionFormValues } from './types';

interface TransactionFormFieldsProps<T extends TransactionFormValues> {
  form: FormikProps<T>;
  stackSpacing: number;
  categoryOptions: CategoryOption[];
  categoryValue: string;
  onCategoryChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
}

export function TransactionFormFields<T extends TransactionFormValues>({
  form,
  stackSpacing,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  groupBy,
}: TransactionFormFieldsProps<T>) {
  return (
    <Stack spacing={stackSpacing}>
      <CategoryAutocomplete
        options={categoryOptions}
        value={categoryValue}
        onChange={onCategoryChange}
        groupBy={groupBy}
      />

      <CurrencyInput nameOfKeyValue="value" form={form} />

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-BR">
        <MobileDatePicker
          label="Data"
          value={form.values.addDate}
          onChange={(value) => {
            form.setFieldValue('addDate', value);
            form.setFieldValue('addDateFormatted', value ? value.format('MM/YYYY').toString() : '');
          }}
          renderInput={(params) => (
            <TextField {...params} size="small" name="addDate" autoComplete="off" fullWidth />
          )}
        />
      </LocalizationProvider>

      <TextField
        label="Descrição"
        name="description"
        id="description"
        onChange={form.handleChange}
        value={form.values.description}
        variant="outlined"
        size="small"
        autoComplete="off"
        type="text"
        fullWidth
        multiline
        rows={3}
      />
    </Stack>
  );
}
