import React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { FormikProps } from 'formik';
import { CurrencyInput } from '../InputCurrency';
import { CategorySelect } from './CategorySelect';
import type { CategoryOption, TransactionFormValues } from './types';

interface TransactionFormFieldsProps<T extends TransactionFormValues> {
  form: FormikProps<T>;
  stackSpacing: number;
  categoryOptions: CategoryOption[];
  categoryValue: string;
  onCategoryChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
  valueLabel?: string;
  valueInputRef?: React.Ref<HTMLInputElement>;
  autoFocusValue?: boolean;
  allowMonthlyFixed?: boolean;
}

export function TransactionFormFields<T extends TransactionFormValues>({
  form,
  stackSpacing,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  groupBy,
  valueLabel,
  valueInputRef,
  autoFocusValue = true,
  allowMonthlyFixed = false,
}: TransactionFormFieldsProps<T>) {
  const isMonthlyFixed = allowMonthlyFixed && Boolean(form.values.isMonthlyFixed);
  return (
    <Stack spacing={stackSpacing}>
      <CategorySelect
        options={categoryOptions}
        value={categoryValue}
        onChange={onCategoryChange}
        groupBy={groupBy}
      />

      <CurrencyInput nameOfKeyValue="value" form={form} label={valueLabel} inputRef={valueInputRef} autoFocus={autoFocusValue} />

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-BR">
        <MobileDatePicker
          key={isMonthlyFixed ? 'month' : 'day'}
          label={isMonthlyFixed ? 'Mês de referência' : 'Data'}
          views={isMonthlyFixed ? ['year', 'month'] : ['year', 'month', 'day']}
          inputFormat={isMonthlyFixed ? 'MM/YYYY' : 'DD/MM/YYYY'}
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
