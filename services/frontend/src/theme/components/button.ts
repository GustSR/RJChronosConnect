import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Button overrides completos do Uko Template
export const buttonOverrides = (theme: Theme): Components['MuiButton'] => ({
  styleOverrides: {
    root: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '14px',
      borderRadius: theme.shape.borderRadius * 1.5, // 12px se borderRadius for 8px
      padding: theme.spacing(1.5, 3),
      minHeight: '40px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none',
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
      '&.Mui-disabled': {
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[800],
        color: theme.palette.mode === 'light' 
          ? theme.palette.grey[400] 
          : theme.palette.grey[500],
      },
    },
    
    // Primary variant - Cor principal do Uko
    containedPrimary: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: `0px 4px 12px ${theme.palette.primary.main}30`,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: `0px 6px 20px ${theme.palette.primary.main}40`,
        transform: 'translateY(-2px)',
      },
      '&:active': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'translateY(0px)',
        boxShadow: `0px 2px 8px ${theme.palette.primary.main}50`,
      },
    },
    
    // Secondary variant
    containedSecondary: {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.common.black,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
      },
    },
    
    // Success variant
    containedSuccess: {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText,
      boxShadow: `0px 4px 12px ${theme.palette.success.main}30`,
      '&:hover': {
        backgroundColor: theme.palette.success.dark,
        boxShadow: `0px 6px 20px ${theme.palette.success.main}40`,
        transform: 'translateY(-2px)',
      },
    },
    
    // Error variant
    containedError: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      boxShadow: `0px 4px 12px ${theme.palette.error.main}30`,
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
        boxShadow: `0px 6px 20px ${theme.palette.error.main}40`,
        transform: 'translateY(-2px)',
      },
    },
    
    // Warning variant
    containedWarning: {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
      boxShadow: `0px 4px 12px ${theme.palette.warning.main}30`,
      '&:hover': {
        backgroundColor: theme.palette.warning.dark,
        boxShadow: `0px 6px 20px ${theme.palette.warning.main}40`,
        transform: 'translateY(-2px)',
      },
    },
    
    // Outlined variants
    outlinedPrimary: {
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      borderWidth: '1.5px',
      '&:hover': {
        borderWidth: '1.5px',
        backgroundColor: `${theme.palette.primary.main}08`,
        borderColor: theme.palette.primary.dark,
        transform: 'translateY(-1px)',
      },
    },
    
    outlinedSecondary: {
      borderColor: theme.palette.secondary.main,
      color: theme.palette.secondary.main,
      borderWidth: '1.5px',
      '&:hover': {
        borderWidth: '1.5px',
        backgroundColor: `${theme.palette.secondary.main}08`,
        borderColor: theme.palette.secondary.dark,
      },
    },
    
    // Text variants
    textPrimary: {
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}08`,
      },
    },
    
    textSecondary: {
      color: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: `${theme.palette.secondary.main}08`,
      },
    },
    
    // Tamanhos diferentes
    sizeSmall: {
      padding: theme.spacing(1, 2),
      fontSize: '13px',
      minHeight: '32px',
      borderRadius: theme.shape.borderRadius * 1.25, // 10px
    },
    
    sizeLarge: {
      padding: theme.spacing(2, 4),
      fontSize: '15px',
      minHeight: '48px',
      borderRadius: theme.shape.borderRadius * 1.75, // 14px
    },
  },
  
  // Variantes customizadas do Uko
  variants: [
    // Soft variants - Estilo popular no Uko
    {
      props: { variant: 'contained', color: 'primary' },
      style: {
        '&.soft': {
          backgroundColor: `${theme.palette.primary.main}15`,
          color: theme.palette.primary.main,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: `${theme.palette.primary.main}25`,
            boxShadow: 'none',
          },
        },
      },
    },
    {
      props: { variant: 'contained', color: 'success' },
      style: {
        '&.soft': {
          backgroundColor: `${theme.palette.success.main}15`,
          color: theme.palette.success.main,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: `${theme.palette.success.main}25`,
            boxShadow: 'none',
          },
        },
      },
    },
    {
      props: { variant: 'contained', color: 'error' },
      style: {
        '&.soft': {
          backgroundColor: `${theme.palette.error.main}15`,
          color: theme.palette.error.main,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: `${theme.palette.error.main}25`,
            boxShadow: 'none',
          },
        },
      },
    },
    {
      props: { variant: 'contained', color: 'warning' },
      style: {
        '&.soft': {
          backgroundColor: `${theme.palette.warning.main}15`,
          color: theme.palette.warning.main,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: `${theme.palette.warning.main}25`,
            boxShadow: 'none',
          },
        },
      },
    },
    
    // Ghost variant - Transparente com borda
    {
      props: { variant: 'outlined' },
      style: {
        '&.ghost': {
          backgroundColor: 'transparent',
          borderColor: theme.palette.mode === 'light' 
            ? theme.palette.grey[300] 
            : theme.palette.grey[600],
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' 
              ? theme.palette.grey[50] 
              : theme.palette.grey[800],
            borderColor: theme.palette.mode === 'light' 
              ? theme.palette.grey[400] 
              : theme.palette.grey[500],
          },
        },
      },
    },
  ],
});