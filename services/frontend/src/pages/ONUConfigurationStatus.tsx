import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ONUConfigurationStatusPage } from '@features/onu-configuration';
import { useTitle } from '@shared/lib/hooks';

const ONUConfigurationStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useTitle('Status da Configuração - RJ Chronos');

  return (
    <ONUConfigurationStatusPage
      onuId={id}
      onBack={() => navigate('/provisionar')}
      onReconfigure={(onuId) => navigate(`/provisionar/${onuId}`)}
      onBackToList={() => navigate('/provisionar')}
    />
  );
};

export default ONUConfigurationStatus;
