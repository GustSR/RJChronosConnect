import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Dialog overrides do Uko Template
export const dialogOverrides = (theme: Theme): Components['MuiDialog'] => ({
  styleOverrides: {
    paper: {
      borderRadius: theme.shape.borderRadius * 2,
      boxShadow: theme.palette.mode === 'light' 
        ? '0px 20px 60px rgba(0, 0, 0, 0.15)'
        : '0px 20px 60px rgba(0, 0, 0, 0.6)',
      backgroundColor: theme.palette.background.paper,
    },
  },
});