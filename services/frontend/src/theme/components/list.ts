import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// List overrides do Uko Template
export const listOverrides = (theme: Theme): Components['MuiList'] => ({
  styleOverrides: {
    root: {
      padding: theme.spacing(1),
    },
  },
});