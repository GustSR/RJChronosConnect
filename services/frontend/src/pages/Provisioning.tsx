import { ProvisioningPage, useProvisioning } from '@features/onu-provisioning';
import { useTitle } from '@shared/lib/hooks';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { genieacsApi } from '@shared/api/genieacsApi';
import type { Subscriber } from '@shared/api/types';

const Provisioning: React.FC = () => {
  useTitle('Provisionamento');

  const navigate = useNavigate();
  const { pendingONUs, provisionedONUs, loading, error, provisionONU, rejectONU, refreshPendingONUs } = useProvisioning();
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);

  React.useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const data = await genieacsApi.getSubscribers();
        setSubscribers(data);
      } catch (error) {
        console.error('Erro ao carregar clientes para provisionamento:', error);
      }
    };
    fetchSubscribers();
  }, []);

  return (
    <ProvisioningPage
      pendingONUs={pendingONUs}
      provisionedONUs={provisionedONUs}
      customers={subscribers}
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
