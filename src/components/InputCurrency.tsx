import React, { useRef } from 'react';
import { TextField } from '@mui/material';
import { FormikValues } from 'formik';

interface Props {
  form: FormikValues;
  nameOfKeyValue: string;
  disabled?: boolean;
  label?: string;
}

export const CurrencyInput: React.FC<Props> = ({ nameOfKeyValue, form, disabled = false, label = 'Valor' }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setInputRef = (input: HTMLInputElement | null) => {
    if (input) {
      inputRef.current = input;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const value = form.values[nameOfKeyValue];
  const displayValue = value === undefined || value === null
    ? ''
    : formatCurrency(Number(value));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, '');

    if (!digitsOnly) {
      form.setFieldValue(nameOfKeyValue, undefined);
      return;
    }

    const cents = parseInt(digitsOnly, 10);
    form.setFieldValue(nameOfKeyValue, cents / 100);
  };

  return (
    <TextField
      disabled={disabled}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => {
        if (inputRef.current) {
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }}
      label={label}
      size='small'
      margin='dense'
      fullWidth
      type='tel'
      autoComplete='off'
      inputRef={setInputRef}
      inputProps={{ inputMode: 'numeric' }}
      placeholder='R$ 0,00'
    />
  );
};
