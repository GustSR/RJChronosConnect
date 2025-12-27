import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OLTManagementPage } from '@features/olt';
import { useTitle } from '@shared/lib/hooks';

const OLTManagement: React.FC = () => {
  const navigate = useNavigate();

  useTitle('Gerenciamento das OLTs');

  return (
    <OLTManagementPage
      onAdd={() => navigate('/olts/add')}
      onViewDetails={(oltId) => navigate(`/olts/${oltId}`)}
    />
  );
};

export default OLTManagement;
