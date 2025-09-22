import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// TextField overrides do Uko Template
export const textFieldOverrides = (
  theme: Theme
): Components['MuiTextField'] => ({
  styleOverrides: {
    root: {
      '& .MuiOutlinedInput-root': {
        borderRadius: theme.shape.borderRadius * 1.5, // 12px
        transition: 'all 0.2s ease',
        backgroundColor:
          theme.palette.mode === 'light'
            ? theme.palette.grey[50]
            : theme.palette.grey[900],
        '& fieldset': {
          borderColor:
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[700],
          borderWidth: '1px',
        },
        '&:hover fieldset': {
          borderColor: theme.palette.primary.main,
          borderWidth: '1px',
        },
        '&.Mui-focused': {
          backgroundColor: theme.palette.background.paper,
          '& fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px',
          },
        },
        '&.Mui-error fieldset': {
          borderColor: theme.palette.error.main,
        },
        '&.Mui-disabled': {
          backgroundColor:
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[800],
          '& fieldset': {
            borderColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[700],
          },
        },
      },

      // Input text styling
      '& .MuiOutlinedInput-input': {
        padding: theme.spacing(1.5, 1.75),
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.5,
        '&::placeholder': {
          color:
            theme.palette.mode === 'light'
              ? theme.palette.grey[500]
              : theme.palette.grey[400],
          opacity: 1,
        },
      },

      // Label styling
      '& .MuiInputLabel-root': {
        fontSize: '14px',
        fontWeight: 500,
        color:
          theme.palette.mode === 'light'
            ? theme.palette.grey[600]
            : theme.palette.grey[300],
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
        '&.Mui-error': {
          color: theme.palette.error.main,
        },
      },

      // Helper text styling
      '& .MuiFormHelperText-root': {
        fontSize: '12px',
        marginLeft: theme.spacing(0.5),
        marginTop: theme.spacing(0.5),
        '&.Mui-error': {
          color: theme.palette.error.main,
        },
      },
    },
  },

  variants: [
    // Small variant
    {
      props: { size: 'small' },
      style: {
        '& .MuiOutlinedInput-input': {
          padding: theme.spacing(1.25, 1.5),
          fontSize: '13px',
        },
        '& .MuiInputLabel-root': {
          fontSize: '13px',
        },
      },
    },

    // Medium variant (default, mas explícito)
    {
      props: { size: 'medium' },
      style: {
        '& .MuiOutlinedInput-input': {
          padding: theme.spacing(1.5, 1.75),
          fontSize: '14px',
        },
      },
    },
  ],
});
