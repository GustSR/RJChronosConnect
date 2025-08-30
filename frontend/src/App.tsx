import { CssBaseline, ThemeProvider } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import { FC } from "react";
import { Toaster } from "react-hot-toast";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import { ukoTheme } from "./theme";
import { ProvisioningProvider } from "./contexts/ProvisioningContext";

const App: FC = () => {
  const allPages = useRoutes(routes);

  // App theme
  const appTheme = ukoTheme();

  // toaster options
  const toasterOptions = {
    style: {
      fontWeight: 500,
      fontFamily: "'Montserrat', sans-serif",
    },
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <ProvisioningProvider>
          <Toaster toastOptions={toasterOptions} />
          {allPages}
        </ProvisioningProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
