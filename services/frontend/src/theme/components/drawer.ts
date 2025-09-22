import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Drawer overrides do Uko Template
export const drawerOverrides = (theme: Theme): Components['MuiDrawer'] => ({
  styleOverrides: {
    paper: {
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 8px 45px rgba(3, 0, 71, 0.09)'
          : '0px 8px 45px rgba(0, 0, 0, 0.4)',
    },
  },
});
