import { createTheme, Theme, ThemeOptions } from "@mui/material";
import {
  error,
  info,
  primary,
  secondary,
  success,
  warning,
} from "./themeColors";

const fontSize = 14;

const baseOptions: ThemeOptions = {
  direction: "ltr",
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    primary,
    secondary,
    error,
    warning,
    success,
    info,
    divider: secondary[300],
    background: { default: "#f4f4f4", paper: "#ffffff" },
    text: {
      primary: secondary[500],
      secondary: secondary[400],
      disabled: secondary[300],
    },
    mode: "light",
  },
  components: {
    MuiAvatar: {
      styleOverrides: {
        fallback: {
          height: "75%",
          width: "75%",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          color: "inherit",
          boxShadow: "none",
          padding: "8px 16px",
          fontWeight: 500,
          fontSize: "14px",
        },
        outlinedPrimary: {
          borderColor: primary.main,
          color: primary.main,
        },
        containedPrimary: {
          color: "white",
          background: `linear-gradient(135deg, ${primary.main}, ${primary.dark})`,
          "&:hover": {
            background: `linear-gradient(135deg, ${primary.dark}, ${primary.main})`,
            boxShadow: `0 4px 12px ${primary.main}40`,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          MozOsxFontSmoothing: "grayscale",
          WebkitFontSmoothing: "antialiased",
          height: "100%",
          width: "100%",
        },
        body: {
          height: "100%",
        },
        a: {
          textDecoration: "none",
          color: "inherit",
        },
        "#root": {
          height: "100%",
        },
        "#nprogress .bar": {
          zIndex: "9999 !important",
          backgroundColor: "#61A9FF !important",
          width: "100%",
          position: "fixed",
        },
        "input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button":
          {
            WebkitAppearance: "none",
            margin: 0,
          },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          color: "#FFD600",
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root:last-of-type": {
            "& .MuiTableCell-root": { borderBottom: 0 },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#94A4C4",
          textTransform: "none",
          fontSize: 12,
          fontWeight: 600,
          padding: 0,
          minWidth: "auto",
          marginLeft: "1rem",
          marginRight: "1rem",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          "& .MuiButtonBase-root:first-of-type": {
            marginLeft: 0,
          },
          "& .MuiButtonBase-root:last-of-type": {
            marginRight: 0,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "transparent" },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        root: {
          "& .MuiPopover-paper": {
            boxShadow: "none",
            borderRadius: "8px",
            border: "2px solid #E5EAF2",
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          fontFamily: "'Montserrat', sans-serif",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& input::placeholder": {
            color: secondary[400],
            opacity: 1,
          },
          "& label": {
            color: secondary[400],
            opacity: 1,
            fontWeight: 500,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
          border: `1px solid ${secondary[300]}`,
          borderRadius: 12,
          background: "#ffffff",
        },
      },
    },
  },
  typography: {
    button: {
      fontWeight: 600,
    },
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "3rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    overline: {
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
    body1: { fontSize: 14, lineHeight: 1.5 },
    body2: { fontSize: 13, lineHeight: 1.5 },
    caption: {
      fontSize: 12,
      lineHeight: 1.4,
      color: secondary[400],
    },
  },
};

export type themeSettingsProps = {
  theme: string;
  direction: string;
  responsiveFontSizes: boolean;
};

export const ukoTheme = () => {
  let theme: Theme = createTheme(baseOptions);

  // theme shadows
  theme.shadows[1] = "0px 4px 23px rgba(0, 0, 0, 0.12)";
  theme.shadows[2] = "0px 0px 21px 1px rgba(0, 0, 0, 0.07)";
  theme.shadows[3] = "0px 10px 30px rgba(0, 0, 0, 0.1)";
  theme.shadows[4] = "0px 7px 30px 3px rgba(0, 0, 0, 0.05)";

  // console.log(theme);

  return theme;
};
