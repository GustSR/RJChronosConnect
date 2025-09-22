import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// AppBar overrides do Uko Template
export const appBarOverrides = (theme: Theme): Components['MuiAppBar'] => ({
  styleOverrides: {
    root: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 2px 8px rgba(0, 0, 0, 0.06)'
          : '0px 2px 8px rgba(0, 0, 0, 0.15)',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
});
