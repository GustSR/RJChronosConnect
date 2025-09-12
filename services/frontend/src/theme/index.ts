import { createTheme, Theme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { colors } from './colors';
import { createShadows } from './shadows';
import { typography } from './typography';
import { createComponentOverrides } from './components';

// Configuração do shape (border radius)
const shape = {
  borderRadius: 8,
};

// Configuração de breakpoints
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Configuração de spacing
const spacing = (factor: number) => `${8 * factor}px`;

// Função para criar o theme completo do Uko
const createUkoTheme = (mode: 'light' | 'dark'): Theme => {
  // Criação do theme base
  const baseTheme = createTheme({
    palette: {
      mode,
      // Cores primárias
      primary: {
        ...colors.primary,
        main: colors.primary.main,
      },
      // Cores secundárias  
      secondary: {
        ...colors.secondary,
        main: colors.secondary.main,
      },
      // Cores semânticas
      success: {
        ...colors.success,
        main: colors.success.main,
      },
      warning: {
        ...colors.warning,
        main: colors.warning.main,
      },
      error: {
        ...colors.error,
        main: colors.error.main,
      },
      info: {
        ...colors.info,
        main: colors.info.main,
      },
      // Cores de background
      background: {
        default: mode === 'light' 
          ? colors.background.light.default 
          : colors.background.dark.default,
        paper: mode === 'light' 
          ? colors.background.light.paper 
          : colors.background.dark.paper,
      },
      // Cores de texto
      text: {
        primary: mode === 'light' 
          ? colors.text.light.primary 
          : colors.text.dark.primary,
        secondary: mode === 'light' 
          ? colors.text.light.secondary 
          : colors.text.dark.secondary,
        disabled: mode === 'light' 
          ? colors.text.light.disabled 
          : colors.text.dark.disabled,
      },
      // Dividers
      divider: mode === 'light' ? colors.grey[200] : colors.grey[700],
      // Grey palette
      grey: colors.grey,
    },
    typography,
    shape,
    breakpoints,
    spacing,
    shadows: createShadows(mode),
  }, ptBR);

  // Theme final com component overrides
  const themeWithComponents = createTheme({
    ...baseTheme,
    components: createComponentOverrides(baseTheme),
  });

  return themeWithComponents;
};

// Themes light e dark
export const lightTheme = createUkoTheme('light');
export const darkTheme = createUkoTheme('dark');

// Configurações adicionais do Uko
export const ukoConfig = {
  // Configurações de layout
  layout: {
    contentWidth: 'fixed' as const, // ou 'fluid'
    headerHeight: 64,
    sidebarWidth: 280,
    sidebarCollapsedWidth: 80,
    footerHeight: 56,
  },
  
  // Configurações de animação
  animation: {
    duration: {
      short: 200,
      standard: 300,
      complex: 400,
    },
    easing: {
      // Easings do Uko
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  },
  
  // Z-index scale do Uko
  zIndex: {
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// Type declarations para TypeScript
declare module '@mui/material/styles' {
  interface Theme {
    ukoConfig?: typeof ukoConfig;
  }
  
  interface ThemeOptions {
    ukoConfig?: typeof ukoConfig;
  }

  interface Palette {
    grey: typeof colors.grey;
  }
  
  interface PaletteOptions {
    grey?: typeof colors.grey;
  }
}

// Export default da função de criação de theme (compatibilidade)
export const ukoTheme = () => lightTheme;

// Export dos themes
export { lightTheme as default };
