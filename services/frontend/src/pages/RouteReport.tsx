import React from 'react';
import { RouteReportPage } from '@features/reports';
import { useTitle } from '@shared/lib/hooks';

const RouteReport: React.FC = () => {
  useTitle('Relatorio de Rota');

  return <RouteReportPage />;
};

export default RouteReport;
