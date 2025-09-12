import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Alert overrides do Uko Template
export const alertOverrides = (theme: Theme): Components['MuiAlert'] => ({
  styleOverrides: {
    root: {
      borderRadius: theme.shape.borderRadius * 1.5,
      border: 'none',
      fontSize: '14px',
      fontWeight: 400,
    },
    standardSuccess: {
      backgroundColor: `${theme.palette.success.main}08`,
      color: theme.palette.success.dark,
      '& .MuiAlert-icon': {
        color: theme.palette.success.main,
      },
    },
    standardError: {
      backgroundColor: `${theme.palette.error.main}08`,
      color: theme.palette.error.dark,
      '& .MuiAlert-icon': {
        color: theme.palette.error.main,
      },
    },
    standardWarning: {
      backgroundColor: `${theme.palette.warning.main}08`,
      color: theme.palette.warning.dark,
      '& .MuiAlert-icon': {
        color: theme.palette.warning.main,
      },
    },
    standardInfo: {
      backgroundColor: `${theme.palette.info.main}08`,
      color: theme.palette.info.dark,
      '& .MuiAlert-icon': {
        color: theme.palette.info.main,
      },
    },
  },
});