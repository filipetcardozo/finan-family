import { TextField } from '@mui/material';
import { FormikValues } from 'formik';
import React, { useState } from 'react';
import { NumericFormat } from 'react-number-format';

interface Props {
  // value: number;
  form: FormikValues
  nameOfKeyValue: string;
}

export const CurrencyInput: React.FC<Props> = ({ nameOfKeyValue, form }) => {
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
    />
  );
};