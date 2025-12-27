import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomerDetailsPage } from '@features/customer';
import { useProvisioning } from '@features/onu-provisioning';
import { useTitle } from '@shared/lib/hooks';

const ClienteDetalhes: React.FC = () => {
  useTitle('Detalhes do Cliente');

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provisionedONUs, pendingONUs } = useProvisioning();

  return (
    <CustomerDetailsPage
      customerId={id}
      provisionedONUs={provisionedONUs}
      pendingONUs={pendingONUs}
      onBack={() => navigate('/clientes')}
      onConfigureOnu={(onuId) => navigate(`/clientes/${onuId}/configurar`)}
    />
  );
};

export default ClienteDetalhes;
