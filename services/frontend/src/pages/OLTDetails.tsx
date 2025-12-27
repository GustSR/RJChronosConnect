import React from 'react';
import { OLTDetailsPage } from '@features/olt';
import { useTitle } from '@shared/lib/hooks';
import { useNavigate, useParams } from 'react-router-dom';

const OLTDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useTitle('Detalhes da OLT');

  return (
    <OLTDetailsPage
      oltId={id}
      onBack={() => navigate('/olts')}
      onEdit={id ? () => navigate(`/olts/${id}/edit`) : undefined}
    />
  );
};

export default OLTDetails;
