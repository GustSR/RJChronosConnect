import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import berryTheme from './theme';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Monitoring from './pages/Monitoring';
import Alerts from './pages/Alerts';
import Provisioning from './pages/Provisioning';
import Diagnostics from './pages/Diagnostics';
import Automation from './pages/Automation';
import Reports from './pages/Reports';
import Topology from './pages/Topology';
import Geolocation from './pages/Geolocation';
import WiFiConfig from './pages/WiFiConfig';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={berryTheme}>
        <CssBaseline />
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/provisioning" element={<Provisioning />} />
              <Route path="/diagnostics" element={<Diagnostics />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/topology" element={<Topology />} />
              <Route path="/geolocation" element={<Geolocation />} />
              <Route path="/wifi-config" element={<WiFiConfig />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
