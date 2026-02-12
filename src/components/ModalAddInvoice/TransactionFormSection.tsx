import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
}: TransactionFormSectionProps<T>) {
  return (
    <>
      <DialogTitle sx={{ fontSize: 20, fontWeight: 700, color: '#123047' }}>{title}</DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={dialogContentSx}>
          <TransactionFormFields
            form={form}
            stackSpacing={stackSpacing}
            categoryOptions={categoryOptions}
            categoryValue={categoryValue}
            onCategoryChange={onCategoryChange}
            groupBy={groupBy}
          />
        </DialogContent>

        <ModalFormActions
          handleClose={handleClose}
          loading={loading}
          submitLabel={submitLabel}
          secondaryActionSx={secondaryActionSx}
          primaryActionSx={primaryActionSx}
        />
      </form>
    </>
  );
}
