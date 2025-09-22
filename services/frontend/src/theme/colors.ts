import { alpha } from '@mui/material/styles';

// Sistema de cores completo do Uko Template
export interface ColorPalette {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  main: string;
}

// Cores Primárias (Purple) - Uko
export const primary: ColorPalette = {
  25: '#FCFAFF',
  50: '#F9F5FF',
  100: '#F4EBFF',
  200: '#E9D7FE',
  300: '#D6BBFB',
  400: '#B692F6',
  500: '#9333EA',
  600: '#7C3AED',
  700: '#6B21A8',
  800: '#581C87',
  900: '#4C1D95',
  main: '#6950E8',
};

// Cores Secundárias (Grey) - Uko
export const secondary = {
  25: '#FCFCFD',
  50: '#F9FAFB',
  100: '#F2F4F7',
  200: '#EAECF0',
  300: '#D0D5DD',
  400: '#98A2B3',
  500: '#667085',
  600: '#475467',
  700: '#344054',
  800: '#1D2939',
  900: '#101828',
  main: '#667085',
};

// Success (Green) - Uko
export const success = {
  25: '#F6FEF9',
  50: '#ECFDF3',
  100: '#D1FADF',
  200: '#A6F4C5',
  300: '#6CE9A6',
  400: '#32D583',
  500: '#12B76A',
  600: '#039855',
  700: '#027A48',
  800: '#05603A',
  900: '#054F31',
  main: '#11B886',
};

// Warning (Yellow/Orange) - Uko
export const warning = {
  25: '#FFFCF5',
  50: '#FFFAEB',
  100: '#FEF0C7',
  200: '#FEDF89',
  300: '#FEC84B',
  400: '#FDB022',
  500: '#F79009',
  600: '#DC6803',
  700: '#B54708',
  800: '#93370D',
  900: '#7A2E0E',
  main: '#FEBF06',
};

// Error (Red/Pink) - Uko
export const error = {
  25: '#FFFBFA',
  50: '#FEF3F2',
  100: '#FEE4E2',
  200: '#FECDCA',
  300: '#FDA29B',
  400: '#F97066',
  500: '#F04438',
  600: '#D92D20',
  700: '#B42318',
  800: '#912018',
  900: '#7A271A',
  main: '#EF4770',
};

// Info (Blue) - Uko
export const info = {
  25: '#FBFAFF',
  50: '#F5F3FF',
  100: '#EBE9FE',
  200: '#D9D6FE',
  300: '#BDB4FE',
  400: '#9B8AFB',
  500: '#7A5AF8',
  600: '#6938EF',
  700: '#5925DC',
  800: '#4A1FB8',
  900: '#3E1C96',
  main: '#8C8DFF',
};

// Grey para textos e elementos neutros
export const grey = secondary;

// Background colors para light/dark mode
export const background = {
  light: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
    neutral: '#F9FAFB',
    disabled: '#F2F4F7',
  },
  dark: {
    default: '#0C111D',
    paper: '#1A202C',
    neutral: '#2D3748',
    disabled: '#4A5568',
  },
};

// Text colors para light/dark mode
export const text = {
  light: {
    primary: '#101828',
    secondary: '#344054',
    disabled: '#98A2B3',
  },
  dark: {
    primary: '#FFFFFF',
    secondary: '#E2E8F0',
    disabled: '#718096',
  },
};

// Função para criar variações com alpha
export const createAlpha = (color: string, opacity: number) =>
  alpha(color, opacity);

// Export das cores para uso no theme
export const colors = {
  primary,
  secondary,
  success,
  warning,
  error,
  info,
  grey,
  background,
  text,
  createAlpha,
};

export default colors;
