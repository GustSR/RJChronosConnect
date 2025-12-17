import { Close } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import type { DialogProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  dividers?: boolean;
  fullWidth?: boolean;
  maxWidth?: DialogProps['maxWidth'];
  closeButton?: boolean;
  closeButtonLabel?: string;
  titleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
  onClose: () => void;
};

export function ConfigDialog({
  open,
  title,
  children,
  actions,
  dividers = true,
  fullWidth = true,
  maxWidth = 'md',
  closeButton = true,
  closeButtonLabel = 'Fechar',
  titleSx,
  contentSx,
  actionsSx,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth={fullWidth} maxWidth={maxWidth}>
      <DialogTitle sx={[closeButton ? { pr: 6 } : undefined, titleSx]}>
        {title}
        {closeButton ? (
          <IconButton
            aria-label={closeButtonLabel}
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <Close fontSize="small" />
          </IconButton>
        ) : null}
      </DialogTitle>

      <DialogContent dividers={dividers} sx={contentSx}>
        {children}
      </DialogContent>

      {actions ? <DialogActions sx={actionsSx}>{actions}</DialogActions> : null}
    </Dialog>
  );
}
