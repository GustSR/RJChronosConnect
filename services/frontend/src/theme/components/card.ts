import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Card overrides do Uko Template
export const cardOverrides = (theme: Theme): Components['MuiCard'] => ({
  styleOverrides: {
    root: {
      borderRadius: theme.shape.borderRadius * 2, // 16px se borderRadius for 8px
      boxShadow:
        theme.palette.mode === 'light'
          ? '0px 4px 20px rgba(0, 0, 0, 0.05)'
          : '0px 4px 20px rgba(0, 0, 0, 0.3)',
      border:
        theme.palette.mode === 'light'
          ? `1px solid ${theme.palette.grey[100]}`
          : `1px solid ${theme.palette.grey[800]}`,
      backgroundColor: theme.palette.background.paper,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow:
          theme.palette.mode === 'light'
            ? '0px 8px 30px rgba(0, 0, 0, 0.08)'
            : '0px 8px 30px rgba(0, 0, 0, 0.4)',
        transform: 'translateY(-2px)',
      },
    },
  },

  variants: [
    // Card elevado - Para destaques
    {
      props: { elevation: 2 },
      style: {
        boxShadow:
          theme.palette.mode === 'light'
            ? '0px 8px 30px rgba(0, 0, 0, 0.08)'
            : '0px 8px 30px rgba(0, 0, 0, 0.4)',
      },
    },
    // Card com shadow forte - Para modais/dialogs
    {
      props: { elevation: 8 },
      style: {
        boxShadow:
          theme.palette.mode === 'light'
            ? '0px 16px 40px rgba(0, 0, 0, 0.12)'
            : '0px 16px 40px rgba(0, 0, 0, 0.5)',
      },
    },
  ],
});
