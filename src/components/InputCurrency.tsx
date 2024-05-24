import React, { useEffect, useRef } from 'react';
import { TextField } from '@mui/material';
import { FormikValues } from 'formik';
import { NumericFormat } from 'react-number-format';

interface Props {
  form: FormikValues;
  nameOfKeyValue: string;
}

export const CurrencyInput: React.FC<Props> = ({ nameOfKeyValue, form }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusUsernameInputField = (input: HTMLInputElement | null) => {
    if (input) {
      inputRef.current = input;
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => { console.log('here'); inputRef.current!.focus() }, 100);
    }
  }, []);

  return (
    <NumericFormat
      value={form.values[nameOfKeyValue]}
      onValueChange={({ floatValue }) => { form.setFieldValue(nameOfKeyValue, floatValue) }}
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      prefix="R$"
      customInput={TextField}
      label='Valor' size='small' margin='normal' fullWidth
      type='tel'
      autoComplete='off'
      inputRef={focusUsernameInputField}
    />
  );
};