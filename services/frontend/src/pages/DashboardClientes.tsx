import { DashboardClientesPage } from '@features/monitoring';
import { useTitle } from '@shared/lib/hooks';
import type { FC } from 'react';

const DashboardClientes: FC = () => {
  useTitle('Dashboard de Clientes - RJ Chronos');
  return <DashboardClientesPage />;
};

export default DashboardClientes;

