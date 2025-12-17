import type { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

type Props = {
  open: boolean;
  title: ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  multiline?: boolean;
  minRows?: number;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function PromptDialog({
  open,
  title,
  label,
  value,
  placeholder,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  required = false,
  multiline = false,
  minRows,
  onChange,
  onConfirm,
  onClose,
}: Props) {
  const confirmDisabled = required && !value.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          multiline={multiline}
          minRows={minRows}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={confirmDisabled}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

