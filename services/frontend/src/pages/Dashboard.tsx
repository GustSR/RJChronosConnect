import { Box, Grid } from '@mui/material';
import useTitle from 'hooks/useTitle';
import { FC } from 'react';

// Componentes RJ Chronos
import OLTGrid from '../components/RJChronos/OLTGrid';
import OLTMonitoring from '../components/RJChronos/OLTMonitoring';
import UserActivity from '../components/RJChronos/UserActivity';
import ONTStatusChart from '../components/RJChronos/ONTStatusChart';
import BandwidthAreaChart from '../components/RJChronos/BandwidthAreaChart';
import TopTrafficSources from '../components/RJChronos/TopTrafficSources';
import OLTPerformanceChart from '../components/RJChronos/OLTPerformanceChart';
import NetworkStatsCards from '../components/RJChronos/NetworkStatsCards';

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

            {/* Grid de OLTs - Largura Total */}
            <Grid item xs={12}>
              <OLTGrid />
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

            {/* Top Traffic Sources */}
            <Grid item xs={12}>
              <TopTrafficSources />
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
    </Box>
  );
};

export default Dashboard;
