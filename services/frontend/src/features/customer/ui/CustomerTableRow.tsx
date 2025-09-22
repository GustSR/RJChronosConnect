import React from 'react';
import {
  TableRow,
  TableCell,
  Stack,
  Avatar,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  SignalCellular4Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellularOff,
  Circle,
} from '@mui/icons-material';
import { Customer } from '@entities/customer/model/customerTypes';

interface CustomerTableRowProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: () => void;
  onView?: (customerId: string) => void;
}

export const CustomerTableRow: React.FC<CustomerTableRowProps> = ({
  customer,
  isSelected,
  onSelect,
  onView,
}) => {
  const getStatusChip = (status: string) => {
    const statusConfig = {
      online: {
        label: 'Online',
        color: 'success' as const,
        icon: <Circle fontSize="small" />,
      },
      offline: {
        label: 'Offline',
        color: 'error' as const,
        icon: <Circle fontSize="small" />,
      },
      powered_off: {
        label: 'Desligado',
        color: 'warning' as const,
        icon: <Circle fontSize="small" />,
      },
      admin_disabled: {
        label: 'Desabilitado',
        color: 'default' as const,
        icon: <Circle fontSize="small" />,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="filled"
      />
    );
  };

  const getSinalIcon = (sinal: number) => {
    if (sinal >= -15) return <SignalCellular4Bar color="success" />;
    if (sinal >= -20) return <SignalCellular2Bar color="success" />;
    if (sinal >= -25) return <SignalCellular1Bar color="warning" />;
    return <SignalCellularOff color="error" />;
  };

  const getSinalColor = (sinal: number) => {
    if (sinal >= -15) return 'success.main';
    if (sinal >= -20) return 'success.main';
    if (sinal >= -25) return 'warning.main';
    return 'error.main';
  };

  return (
    <TableRow
      selected={isSelected}
      onClick={onSelect}
      sx={{
        cursor: 'pointer',
        '&.Mui-selected': {
          backgroundColor: 'primary.lighter',
        },
      }}
    >
      {/* Nome com Avatar */}
      <TableCell sx={{ paddingY: 1, width: '40%' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            src={customer.avatar}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'transparent',
              fontSize: '14px',
            }}
          />
          <Typography variant="body2" fontSize={13} color="text.primary" noWrap>
            {customer.name}
          </Typography>
        </Stack>
      </TableCell>

      {/* Email */}
      <TableCell sx={{ paddingY: 1, width: '30%' }}>
        <Typography variant="body2" fontSize={13} noWrap>
          {customer.email}
        </Typography>
      </TableCell>

      {/* Telefone */}
      <TableCell sx={{ paddingY: 1, width: '20%' }}>
        <Typography variant="body2" fontSize={13} noWrap>
          {customer.phone}
        </Typography>
      </TableCell>

      {/* Ações */}
      <TableCell sx={{ paddingY: 1, width: '10%' }} align="center">
        <Tooltip title="Visualizar Detalhes">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onView?.(customer.id);
            }}
            color="primary"
            size="small"
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
