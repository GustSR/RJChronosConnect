import { CssBaseline, ThemeProvider } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { FC } from 'react';
import { useRoutes } from 'react-router-dom';
import routes from './routes';
import { ukoTheme } from './theme';
import { ProvisioningProvider } from '@features/onu-provisioning';

const App: FC = () => {
  const allPages = useRoutes(routes);

  // App theme
  const appTheme = ukoTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <ProvisioningProvider>
          {allPages}
        </ProvisioningProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
