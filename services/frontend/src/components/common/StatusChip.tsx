import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: 'online' | 'offline' | 'warning' | 'maintenance' | 'error' | 'success';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
  const getStatusConfig = () => {
    const configs = {
      online: { label: 'Online', color: 'success' as const },
      offline: { label: 'Offline', color: 'error' as const },
      warning: { label: 'Atenção', color: 'warning' as const },
      maintenance: { label: 'Manutenção', color: 'info' as const },
      error: { label: 'Erro', color: 'error' as const },
      success: { label: 'Sucesso', color: 'success' as const },
    };
    
    return configs[status] || configs.offline;
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
      {...props}
    />
  );
};

export default StatusChip;