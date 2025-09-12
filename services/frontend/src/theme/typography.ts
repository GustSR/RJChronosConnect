import { TypographyOptions } from '@mui/material/styles/createTypography';

// Sistema de typography completo do Uko Template
export const typography: TypographyOptions = {
  // Font Family - Uko usa Inter
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Font weights disponíveis
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  
  // Headings - Hierarquia do Uko
  h1: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '40px',
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  h5: {
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: 1.0,
    letterSpacing: '-0.005em',
  },
  h6: {
    fontSize: '18px',
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: '0em',
  },

  // Subtítulos
  subtitle1: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.0015em',
  },
  subtitle2: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.001em',
  },

  // Corpo do texto
  body1: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.0015em',
  },
  body2: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00178em',
  },

  // Botões
  button: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.02em',
    textTransform: 'none' as const, // Uko não usa uppercase em botões
  },

  // Captions e outros
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '0.003em',
  },
  overline: {
    fontSize: '11px',
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};

// Variantes customizadas do Uko
export const customTypographyVariants = {
  // Display texts - Para títulos grandes
  display1: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },
  display2: {
    fontSize: '56px',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
  },
  
  // Labels - Para formulários
  label1: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.0025em',
  },
  label2: {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: '0.003em',
  },
  
  // Helper texts
  helper: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '0.003em',
  },
  
  // Code - Para textos de código
  code: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0em',
    fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
  },
  
  // Links
  link: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.0025em',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  
  // Small texts
  small: {
    fontSize: '11px',
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '0.005em',
  },
};

// Configuração para responsividade
export const responsiveTypography = {
  // Breakpoints para ajuste de tamanho
  h1: {
    '@media (max-width: 768px)': {
      fontSize: '36px',
    },
    '@media (max-width: 480px)': {
      fontSize: '28px',
    },
  },
  h2: {
    '@media (max-width: 768px)': {
      fontSize: '32px',
    },
    '@media (max-width: 480px)': {
      fontSize: '24px',
    },
  },
  h3: {
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
    '@media (max-width: 480px)': {
      fontSize: '22px',
    },
  },
  h4: {
    '@media (max-width: 768px)': {
      fontSize: '24px',
    },
    '@media (max-width: 480px)': {
      fontSize: '20px',
    },
  },
  h5: {
    '@media (max-width: 768px)': {
      fontSize: '22px',
    },
    '@media (max-width: 480px)': {
      fontSize: '18px',
    },
  },
  h6: {
    '@media (max-width: 768px)': {
      fontSize: '16px',
    },
    '@media (max-width: 480px)': {
      fontSize: '16px',
    },
  },
};

export default { typography, customTypographyVariants, responsiveTypography };