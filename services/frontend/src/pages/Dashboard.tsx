import { Box, Grid } from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { FC } from 'react';

// Componentes RJ Chronos
import {
  OLTGrid,
  OLTMonitoring,
  UserActivity,
  ONTStatusChart,
  BandwidthAreaChart,
  TopTrafficSources,
  OLTPerformanceChart,
} from '@features/monitoring/ui';
import { NetworkStatsCards } from '@features/monitoring/ui';

const Dashboard: FC = () => {
  // change navbar title
  useTitle('Dashboard - RJ Chronos');

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Cards de Estatísticas Principais - Layout em 4 colunas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <NetworkStatsCards />
        </Grid>
      </Grid>

      {/* Layout Principal - 2 Colunas */}
      <Grid container spacing={3}>
        {/* Coluna Esquerda - 70% */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Gráfico de Tráfego de Banda - Largura Total */}
            <Grid item xs={12}>
              <BandwidthAreaChart />
            </Grid>

            {/* Performance das OLTs - Largura Total */}
            <Grid item xs={12}>
              <OLTPerformanceChart />
            </Grid>

            {/* Top Traffic Sources - Movido da sidebar para ter mais espaço */}
            <Grid item xs={12}>
              <TopTrafficSources />
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna Direita - 30% */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Status das ONTs */}
            <Grid item xs={12}>
              <ONTStatusChart />
            </Grid>

            {/* OLT Monitoring */}
            <Grid item xs={12}>
              <OLTMonitoring />
            </Grid>

            {/* User Activity - Movido para sidebar */}
            <Grid item xs={12}>
              <UserActivity />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Status das OLTs - Largura Total na parte inferior */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <OLTGrid />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
