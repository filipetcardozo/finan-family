import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import type { SxProps, Theme } from '@mui/material/styles';

interface ModalFormActionsProps {
  handleClose(): void;
  loading: boolean;
  submitLabel: string;
  submitIcon: React.ReactNode;
  secondaryActionSx: SxProps<Theme>;
  primaryActionSx: SxProps<Theme>;
  disabled?: boolean;
}

export function ModalFormActions({
  handleClose,
  loading,
  submitLabel,
  submitIcon,
  secondaryActionSx,
  primaryActionSx,
  disabled,
}: ModalFormActionsProps) {
  return (
    <DialogActions disableSpacing sx={{ px: { xs: 2, sm: 3 }, pb: 2.2, pt: 1.2, gap: 1, flexWrap: 'wrap' }}>
      <Button size="small" variant="text" onClick={handleClose} disabled={loading} sx={secondaryActionSx}>
        Fechar
      </Button>
      <LoadingButton type="submit" variant="contained" size="small" startIcon={submitIcon} loading={loading} disabled={disabled} sx={primaryActionSx}>
        {submitLabel}
      </LoadingButton>
    </DialogActions>
  );
}
