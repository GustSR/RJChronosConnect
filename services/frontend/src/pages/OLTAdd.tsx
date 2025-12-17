import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OLTAddPage } from '@features/olt';
import { useTitle } from '@shared/lib/hooks';

const OLTAdd: React.FC = () => {
  const navigate = useNavigate();

  useTitle('Adicionar OLT - RJ Chronos');

  return (
    <OLTAddPage
      onCancel={() => navigate('/olts')}
      onSuccessNavigate={() => navigate('/olts')}
    />
  );
};

export default OLTAdd;
