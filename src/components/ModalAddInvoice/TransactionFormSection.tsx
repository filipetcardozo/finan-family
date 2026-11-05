import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import type { FormikProps } from 'formik';
import type { SxProps, Theme } from '@mui/material/styles';
import { ModalFormActions } from './ModalFormActions';
import { TransactionFormFields } from './TransactionFormFields';
import type { CategoryOption, TransactionFormValues } from './types';

interface TransactionFormSectionProps<T extends TransactionFormValues> {
  form: FormikProps<T>;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  dialogContentSx: SxProps<Theme>;
  stackSpacing: number;
  categoryOptions: CategoryOption[];
  categoryValue: string;
  onCategoryChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
  loading: boolean;
  submitLabel: string;
  submitIcon: React.ReactNode;
  handleClose(): void;
  secondaryActionSx: SxProps<Theme>;
  primaryActionSx: SxProps<Theme>;
  children?: React.ReactNode;
  valueLabel?: string;
  submitDisabled?: boolean;
  valueInputRef?: React.Ref<HTMLInputElement>;
  autoFocusValue?: boolean;
  allowMonthlyFixed?: boolean;
}

export function TransactionFormSection<T extends TransactionFormValues>({
  form,
  onSubmit,
  dialogContentSx,
  stackSpacing,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  groupBy,
  loading,
  submitLabel,
  submitIcon,
  handleClose,
  secondaryActionSx,
  primaryActionSx,
  children,
  valueLabel,
  submitDisabled,
  valueInputRef,
  autoFocusValue,
  allowMonthlyFixed,
}: TransactionFormSectionProps<T>) {
  return (
    <form onSubmit={onSubmit}>
      <DialogContent sx={dialogContentSx}>
        <Box component='fieldset' disabled={loading} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <TransactionFormFields
            form={form}
            stackSpacing={stackSpacing}
            categoryOptions={categoryOptions}
            categoryValue={categoryValue}
            onCategoryChange={onCategoryChange}
            groupBy={groupBy}
            valueLabel={valueLabel}
            valueInputRef={valueInputRef}
            autoFocusValue={autoFocusValue}
            allowMonthlyFixed={allowMonthlyFixed}
          />
          {children}
        </Box>
      </DialogContent>

      <ModalFormActions
        handleClose={handleClose}
        loading={loading}
        submitLabel={submitLabel}
        submitIcon={submitIcon}
        secondaryActionSx={secondaryActionSx}
        primaryActionSx={primaryActionSx}
        disabled={submitDisabled}
      />
    </form>
  );
}
