import { Box, Grid, useTheme } from '@mui/material';
// import Analytics from 'components/Dashboards/saas/Analytics';
import SaaSCard from 'components/Dashboards/saas/Card';
import Footer from 'components/Dashboards/saas/Footer';
import RecentOrders from 'components/Dashboards/saas/RecentOrders';
import TopSelling from 'components/Dashboards/saas/TopSelling';
import TotalSpent from 'components/Dashboards/saas/TotalSpent';
import RatingComponent from 'components/Dashboards/saas/RatingComponent';
import GoalProgress from 'components/Dashboards/saas/GoalProgress';
import useTitle from 'hooks/useTitle';
import BucketIcon from 'icons/BucketIcon';
import EarningIcon from 'icons/EarningIcon';
import PeopleIcon from 'icons/PeopleIcon';
import WindowsLogoIcon from 'icons/WindowsLogoIcon';
import { FC } from 'react';

const SaaS: FC = () => {
  // change navbar title
  useTitle('Saas');

  const theme = useTheme();

  const cardList = [
    {
      price: 1352,
      Icon: PeopleIcon,
      title: 'Daily Visitors',
      color: theme.palette.primary.main,
    },
    {
      price: 51352,
      title: 'Average Daily Sales',
      Icon: EarningIcon,
      color: theme.palette.success.main,
    },
    {
      price: 1352,
      Icon: BucketIcon,
      title: 'Order This Month',
      color: theme.palette.error.main,
    },
    {
      price: 20360,
      Icon: WindowsLogoIcon,
      title: 'Monthly Earnings',
      color: theme.palette.primary.main,
    },
  ];

  const goalData = [
    {
      title: '1,500 to Goal',
      current: 1500,
      target: 2000,
      color: theme.palette.success.main,
    },
    {
      title: '$25,000 to Goal',
      current: 25000,
      target: 32000,
      color: theme.palette.primary.main,
      prefix: '$',
    },
  ];

  return (
    <Box pt={2} pb={4}>
      {/* Top Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardList.map((card, index) => (
          <Grid item lg={3} md={6} xs={12} key={index}>
            <SaaSCard card={card} />
          </Grid>
        ))}
      </Grid>

      {/* Goal Progress Bars */}
      <Box sx={{ mb: 4 }}>
        <GoalProgress goals={goalData} />
      </Box>

      {/* Charts and Analytics */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item lg={8} md={7} xs={12}>
          <TotalSpent />
        </Grid>
        <Grid item lg={4} md={5} xs={12}>
          <RatingComponent />
        </Grid>
      </Grid>

      {/* Tables and Lists */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item lg={8} md={7} xs={12}>
          <RecentOrders />
        </Grid>
        <Grid item lg={4} md={5} xs={12}>
          <TopSelling />
        </Grid>
      </Grid>

      {/* Footer */}
      <Grid container>
        <Grid item xs={12}>
          <Footer imageLink="/static/illustration/sass-dashboard.svg" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SaaS;
