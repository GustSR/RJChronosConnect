import { useTitle } from '@shared/lib/hooks';
import { DashboardPage } from '@features/monitoring';
import type { FC } from 'react';

const Dashboard: FC = () => {
  useTitle('Dashboard - RJ Chronos');
  return <DashboardPage />;
};

export default Dashboard;
