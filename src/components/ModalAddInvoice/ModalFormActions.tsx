import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import type { SxProps, Theme } from '@mui/material/styles';

interface ModalFormActionsProps {
  handleClose(): void;
  loading: boolean;
  submitLabel: string;
  secondaryActionSx: SxProps<Theme>;
  primaryActionSx: SxProps<Theme>;
}

export function ModalFormActions({
  handleClose,
  loading,
  submitLabel,
  secondaryActionSx,
  primaryActionSx,
}: ModalFormActionsProps) {
  return (
    <DialogActions sx={{ px: 3, pb: 2.2, pt: 1.2 }}>
      <Button size="small" variant="outlined" onClick={handleClose} sx={secondaryActionSx}>
        Voltar
      </Button>
      <LoadingButton type="submit" variant="contained" size="small" loading={loading} sx={primaryActionSx}>
        {submitLabel}
      </LoadingButton>
    </DialogActions>
  );
}
