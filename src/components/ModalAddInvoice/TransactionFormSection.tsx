import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import type { FormikProps } from 'formik';
import type { SxProps, Theme } from '@mui/material/styles';
import { ModalFormActions } from './ModalFormActions';
import { TransactionFormFields } from './TransactionFormFields';
import type { CategoryOption, TransactionFormValues } from './types';

interface TransactionFormSectionProps<T extends TransactionFormValues> {
  title: string;
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
  handleClose(): void;
  secondaryActionSx: SxProps<Theme>;
  primaryActionSx: SxProps<Theme>;
  children?: React.ReactNode;
  valueLabel?: string;
  submitDisabled?: boolean;
  onCategoryOpen?(): void;
  valueInputRef?: React.Ref<HTMLInputElement>;
}

export function TransactionFormSection<T extends TransactionFormValues>({
  title,
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
  handleClose,
  secondaryActionSx,
  primaryActionSx,
  children,
  valueLabel,
  submitDisabled,
  onCategoryOpen,
  valueInputRef,
}: TransactionFormSectionProps<T>) {
  return (
    <>
      <DialogTitle sx={{ fontSize: 20, fontWeight: 700, color: '#123047' }}>{title}</DialogTitle>

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
              onCategoryOpen={onCategoryOpen}
              valueInputRef={valueInputRef}
            />
            {children}
          </Box>
        </DialogContent>

        <ModalFormActions
          handleClose={handleClose}
          loading={loading}
          submitLabel={submitLabel}
          secondaryActionSx={secondaryActionSx}
          primaryActionSx={primaryActionSx}
          disabled={submitDisabled}
        />
      </form>
    </>
  );
}
