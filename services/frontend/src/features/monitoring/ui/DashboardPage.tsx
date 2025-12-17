import { Box, Grid } from '@mui/material';
import type { FC } from 'react';
import BandwidthAreaChart from './BandwidthAreaChart';
import NetworkStatsCards from './NetworkStatsCards';
import OLTMonitoring from './OLTMonitoring';
import OLTPerformanceChart from './OLTPerformanceChart';
import TopTrafficSources from './TopTrafficSources';
import UserActivity from './UserActivity';

const DashboardPage: FC = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <NetworkStatsCards />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <BandwidthAreaChart />
            </Grid>

            <Grid item xs={12}>
              <OLTPerformanceChart />
            </Grid>

            <Grid item xs={12}>
              <TopTrafficSources />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OLTMonitoring />
            </Grid>

            <Grid item xs={12}>
              <UserActivity />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

