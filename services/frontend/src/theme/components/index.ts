import { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles/components';

// Importações dos overrides individuais
import { buttonOverrides } from './button';
import { cardOverrides } from './card';
import { textFieldOverrides } from './textField';
import { paperOverrides } from './paper';
import { listOverrides } from './list';
import { drawerOverrides } from './drawer';
import { appBarOverrides } from './appBar';
import { chipOverrides } from './chip';
import { alertOverrides } from './alert';
import { dialogOverrides } from './dialog';

// Função para criar todos os component overrides do Uko
export const createComponentOverrides = (theme: Theme): Components => ({
  // Button components
  MuiButton: buttonOverrides(theme),
  
  // Surface components
  MuiCard: cardOverrides(theme),
  MuiPaper: paperOverrides(theme),
  
  // Input components
  MuiTextField: textFieldOverrides(theme),
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius * 1.5,
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: '2px',
          borderColor: theme.palette.primary.main,
        },
      },
    },
  },
  
  // Navigation components
  MuiList: listOverrides(theme),
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius * 1.5,
        margin: '0 8px',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.primary.main + '08'
            : theme.palette.primary.main + '12',
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.mode === 'light'
            ? theme.palette.primary.main + '10'
            : theme.palette.primary.main + '20',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
              ? theme.palette.primary.main + '15'
              : theme.palette.primary.main + '25',
          },
        },
      },
    },
  },
  
  MuiDrawer: drawerOverrides(theme),
  MuiAppBar: appBarOverrides(theme),
  
  // Feedback components
  MuiChip: chipOverrides(theme),
  MuiAlert: alertOverrides(theme),
  MuiDialog: dialogOverrides(theme),
  
  // Data display components
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius * 1.5,
        fontSize: '12px',
        fontWeight: 500,
        boxShadow: theme.shadows[8],
        padding: theme.spacing(1, 1.5),
      },
      arrow: {
        color: theme.palette.background.paper,
        '&::before': {
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
  },
  
  // Layout components
  MuiContainer: {
    styleOverrides: {
      root: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
          paddingLeft: theme.spacing(4),
          paddingRight: theme.spacing(4),
        },
      },
    },
  },
  
  // Typography components
  MuiTypography: {
    styleOverrides: {
      root: {
        fontFamily: theme.typography.fontFamily,
      },
      h1: {
        fontSize: '48px',
        fontWeight: 700,
        lineHeight: 1.2,
        [theme.breakpoints.down('md')]: {
          fontSize: '36px',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '28px',
        },
      },
      h2: {
        fontSize: '40px',
        fontWeight: 700,
        lineHeight: 1.3,
        [theme.breakpoints.down('md')]: {
          fontSize: '32px',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '24px',
        },
      },
      h3: {
        fontSize: '36px',
        fontWeight: 700,
        lineHeight: 1.3,
        [theme.breakpoints.down('md')]: {
          fontSize: '28px',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '22px',
        },
      },
      h4: {
        fontSize: '32px',
        fontWeight: 600,
        lineHeight: 1.4,
        [theme.breakpoints.down('md')]: {
          fontSize: '24px',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '20px',
        },
      },
      h5: {
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: 1.4,
        [theme.breakpoints.down('md')]: {
          fontSize: '22px',
        },
        [theme.breakpoints.down('sm')]: {
          fontSize: '18px',
        },
      },
      h6: {
        fontSize: '18px',
        fontWeight: 500,
        lineHeight: 1.4,
      },
    },
  },
});

export default createComponentOverrides;