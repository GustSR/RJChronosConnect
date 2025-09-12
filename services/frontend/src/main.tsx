import {
  AuthProvider,
  SettingsProvider,
  TitleContextProvider,
} from '@shared/lib/contexts';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'nprogress/nprogress.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'simplebar/dist/simplebar.min.css';
import App from './App';
import './__fakeData__';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <TitleContextProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TitleContextProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>
);
