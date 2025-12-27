import { DashboardOLTsPage } from '@features/monitoring';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const DashboardOLTs: FC = () => {
  useTitle('Dashboard de OLTs');
  return <DashboardOLTsPage />;
};

export default DashboardOLTs;

