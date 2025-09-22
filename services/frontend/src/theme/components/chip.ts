import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Chip overrides do Uko Template
export const chipOverrides = (theme: Theme): Components['MuiChip'] => ({
  styleOverrides: {
    root: {
      borderRadius: theme.shape.borderRadius * 1.5,
      fontSize: '12px',
      fontWeight: 500,
      height: 'auto',
      padding: theme.spacing(0.5, 1),
    },
    colorPrimary: {
      backgroundColor: `${theme.palette.primary.main}15`,
      color: theme.palette.primary.main,
      '& .MuiChip-deleteIcon': {
        color: theme.palette.primary.main,
      },
    },
    colorSecondary: {
      backgroundColor: `${theme.palette.secondary.main}15`,
      color: theme.palette.secondary.main,
    },
    colorSuccess: {
      backgroundColor: `${theme.palette.success.main}15`,
      color: theme.palette.success.main,
    },
    colorError: {
      backgroundColor: `${theme.palette.error.main}15`,
      color: theme.palette.error.main,
    },
    colorWarning: {
      backgroundColor: `${theme.palette.warning.main}15`,
      color: theme.palette.warning.main,
    },
    colorInfo: {
      backgroundColor: `${theme.palette.info.main}15`,
      color: theme.palette.info.main,
    },
  },
});
