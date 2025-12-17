import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '@shared/lib/hooks';
import { useProvisioning } from '@features/onu-provisioning';
import { ProvisioningPage } from '@features/onu-provisioning';

const Provisioning: React.FC = () => {
  useTitle('Provisionamento - RJ Chronos');

  const navigate = useNavigate();
  const { pendingONUs, loading, error, provisionONU, rejectONU, refreshPendingONUs } = useProvisioning();

  return (
    <ProvisioningPage
      pendingONUs={pendingONUs}
      loading={loading}
      error={error}
      onRefresh={refreshPendingONUs}
      onProvision={provisionONU}
      onReject={rejectONU}
      onNavigateToConfig={(onuId) => navigate(`/clientes/${onuId}/configurar`)}
    />
  );
};

export default Provisioning;
