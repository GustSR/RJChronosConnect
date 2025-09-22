import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Paper overrides do Uko Template
export const paperOverrides = (theme: Theme): Components['MuiPaper'] => ({
  styleOverrides: {
    root: {
      borderRadius: theme.shape.borderRadius * 1.5,
      backgroundColor: theme.palette.background.paper,
      transition: 'box-shadow 0.2s ease',
    },
    elevation1: {
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 1px 2px rgba(0, 0, 0, 0.03)'
          : '0px 1px 2px rgba(0, 0, 0, 0.06)',
    },
    elevation2: {
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 4px 8px rgba(0, 0, 0, 0.04)'
          : '0px 4px 8px rgba(0, 0, 0, 0.08)',
    },
    elevation4: {
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 8px 20px rgba(0, 0, 0, 0.08)'
          : '0px 8px 20px rgba(0, 0, 0, 0.12)',
    },
    elevation8: {
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 16px 40px rgba(0, 0, 0, 0.12)'
          : '0px 16px 40px rgba(0, 0, 0, 0.16)',
    },
  },
});
