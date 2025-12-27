import { DashboardClientesPage } from '@features/monitoring';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const DashboardClientes: FC = () => {
  useTitle('Dashboard de Clientes');
  return <DashboardClientesPage />;
};

export default DashboardClientes;

