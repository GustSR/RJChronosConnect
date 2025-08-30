declare module "@mui/material/styles" {
  interface PaletteColor {
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    red: string;
    purple: string;
    yellow: string;
  }
}

export const primary = {
  100: "#E0E7FF",
  200: "#C7D2FE",
  300: "#A5B4FC",
  400: "#818CF8",
  500: "#6366F1",
  main: "#6366F1",
  light: "#E0E7FF",
  dark: "#4F46E5",
  red: "#EF4444",
  purple: "#8B5CF6",
  yellow: "#F59E0B",
};

export const secondary = {
  100: "#F8FAFC",
  200: "#F1F5F9",
  300: "#E2E8F0", // outline or border
  400: "#94A3B8", // text muted
  500: "#0F172A", // main text
  main: "#0F172A", // main text
  light: "#F8FAFC",
  red: "#EF4444",
  purple: "#8B5CF6",
  yellow: "#F59E0B",
};

export const error = {
  main: "#EF4444",
};

export const success = {
  main: "#10B981",
};

export const warning = {
  main: "#F59E0B",
  dark: "#D97706",
};

export const info = {
  main: "#6366F1",
};

export const text = {
  primary: secondary[500],
  secondary: secondary[400],
  disabled: secondary[300],
};
