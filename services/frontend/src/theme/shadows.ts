import { alpha } from '@mui/material/styles';
import { Shadows } from '@mui/material/styles/createTheme';
import { grey } from './colors';

// Sistema de shadows completo do Uko Template
export const createShadows = (mode: 'light' | 'dark'): Shadows => {
  // Cores base para shadows baseado no modo
  const shadowColorMain = mode === 'light' ? grey[500] : '#000000';

  // Variações de alpha para diferentes intensidades
  const shadowColor1 = alpha(shadowColorMain, mode === 'light' ? 0.03 : 0.06);
  const shadowColor2 = alpha(shadowColorMain, mode === 'light' ? 0.04 : 0.08);
  const shadowColor3 = alpha(shadowColorMain, mode === 'light' ? 0.08 : 0.12);
  const shadowColor4 = alpha(shadowColorMain, mode === 'light' ? 0.12 : 0.16);
  const shadowColor5 = alpha(shadowColorMain, mode === 'light' ? 0.16 : 0.2);

  return [
    'none',
    // Shadow 1 - Muito sutil
    `0px 1px 2px ${shadowColor1}`,
    // Shadow 2 - Sutil
    `0px 1px 3px ${shadowColor1}, 0px 1px 2px ${shadowColor2}`,
    // Shadow 3 - Pequena
    `0px 4px 8px -2px ${shadowColor2}, 0px 2px 4px -2px ${shadowColor1}`,
    // Shadow 4 - Pequena+
    `0px 6px 16px -6px ${shadowColor3}, 0px 0px 1px ${shadowColor1}`,
    // Shadow 5 - Média baixa
    `0px 8px 20px -4px ${shadowColor3}, 0px 3px 8px -1px ${shadowColor2}`,
    // Shadow 6 - Média
    `0px 12px 32px -4px ${shadowColor3}, 0px 4px 12px -1px ${shadowColor2}`,
    // Shadow 7 - Média alta
    `0px 16px 40px -4px ${shadowColor4}, 0px 8px 16px -4px ${shadowColor2}`,
    // Shadow 8 - Alta
    `0px 20px 48px -4px ${shadowColor4}, 0px 12px 20px -4px ${shadowColor3}`,
    // Shadow 9 - Alta+
    `0px 24px 56px -4px ${shadowColor4}, 0px 16px 24px -4px ${shadowColor3}`,
    // Shadow 10 - Muito alta
    `0px 32px 64px -8px ${shadowColor5}, 0px 20px 32px -8px ${shadowColor4}`,
    // Shadow 11
    `0px 40px 80px -8px ${shadowColor5}, 0px 24px 40px -8px ${shadowColor4}`,
    // Shadow 12
    `0px 48px 96px -8px ${shadowColor5}, 0px 32px 48px -8px ${shadowColor4}`,
    // Shadow 13
    `0px 56px 112px -8px ${shadowColor5}, 0px 40px 56px -8px ${shadowColor4}`,
    // Shadow 14
    `0px 64px 128px -12px ${shadowColor5}, 0px 48px 64px -12px ${shadowColor4}`,
    // Shadow 15
    `0px 72px 144px -12px ${shadowColor5}, 0px 56px 72px -12px ${shadowColor4}`,
    // Shadow 16
    `0px 80px 160px -12px ${shadowColor5}, 0px 64px 80px -12px ${shadowColor4}`,
    // Shadow 17
    `0px 88px 176px -12px ${shadowColor5}, 0px 72px 88px -12px ${shadowColor4}`,
    // Shadow 18
    `0px 96px 192px -16px ${shadowColor5}, 0px 80px 96px -16px ${shadowColor4}`,
    // Shadow 19
    `0px 104px 208px -16px ${shadowColor5}, 0px 88px 104px -16px ${shadowColor4}`,
    // Shadow 20
    `0px 112px 224px -16px ${shadowColor5}, 0px 96px 112px -16px ${shadowColor4}`,
    // Shadow 21
    `0px 120px 240px -16px ${shadowColor5}, 0px 104px 120px -16px ${shadowColor4}`,
    // Shadow 22
    `0px 128px 256px -20px ${shadowColor5}, 0px 112px 128px -20px ${shadowColor4}`,
    // Shadow 23
    `0px 136px 272px -20px ${shadowColor5}, 0px 120px 136px -20px ${shadowColor4}`,
    // Shadow 24 - Máxima
    `0px 144px 288px -20px ${shadowColor5}, 0px 128px 144px -20px ${shadowColor4}`,
  ] as Shadows;
};

// Shadows especiais para componentes específicos do Uko
export const customShadows = {
  // Card shadows
  cardSoft: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  cardMedium: '0px 8px 30px rgba(0, 0, 0, 0.08)',
  cardHard: '0px 16px 40px rgba(0, 0, 0, 0.12)',

  // Button shadows
  buttonPrimary: '0px 4px 12px rgba(105, 80, 232, 0.3)',
  buttonSecondary: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  buttonHover: '0px 6px 20px rgba(105, 80, 232, 0.4)',

  // Modal shadows
  modal: '0px 20px 60px rgba(0, 0, 0, 0.15)',
  dropdown: '0px 8px 24px rgba(0, 0, 0, 0.12)',

  // Navigation shadows
  sidebar: '0px 8px 45px rgba(3, 0, 71, 0.09)',
  topbar: '0px 2px 8px rgba(0, 0, 0, 0.06)',

  // Input shadows
  inputFocus: '0px 0px 0px 3px rgba(105, 80, 232, 0.1)',
  inputError: '0px 0px 0px 3px rgba(239, 71, 112, 0.1)',

  // Dark mode variants
  dark: {
    cardSoft: '0px 4px 20px rgba(0, 0, 0, 0.3)',
    cardMedium: '0px 8px 30px rgba(0, 0, 0, 0.4)',
    cardHard: '0px 16px 40px rgba(0, 0, 0, 0.5)',
    sidebar: '0px 8px 45px rgba(0, 0, 0, 0.4)',
    modal: '0px 20px 60px rgba(0, 0, 0, 0.6)',
  },
};

export default { createShadows, customShadows };
