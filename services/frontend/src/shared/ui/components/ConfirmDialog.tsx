import type { ReactNode } from 'react';
import type { ButtonProps, DialogProps } from '@mui/material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

type Props = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ButtonProps['color'];
  maxWidth?: DialogProps['maxWidth'];
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
  maxWidth = 'sm',
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {description ? <DialogContent>{description}</DialogContent> : null}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

