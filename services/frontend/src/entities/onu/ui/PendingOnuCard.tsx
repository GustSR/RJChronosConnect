import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  // Router,
  SignalWifi4Bar,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  DeviceHub,
  Thermostat,
} from '@mui/icons-material';
import { PendingONU } from '@features/onu-provisioning/provisioning';
import { getSignalStatus } from '@features/onu-provisioning/provisioning';

interface PendingOnuCardProps {
  onu: PendingONU;
  onProvision: (onuId: string) => void;
  onReject?: (onuId: string) => void;
}

const PendingOnuCard: React.FC<PendingOnuCardProps> = ({
  onu,
  onProvision,
  onReject,
}) => {
  const signalStatus = onu.rxPower ? getSignalStatus(onu.rxPower) : 'warning';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (signalStatus) {
      case 'good':
        return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'warning':
        return <Warning sx={{ color: '#f59e0b' }} />;
      case 'critical':
        return <Error sx={{ color: '#ef4444' }} />;
      default:
        return <SignalWifi4Bar sx={{ color: '#6b7280' }} />;
    }
  };

  const getOnuIcon = (onuType: string) => {
    const type = onuType.toLowerCase();
    if (type.includes('zte')) return '🔷';
    if (type.includes('huawei')) return '🔴';
    if (type.includes('fiberhome')) return '🟢';
    return '📡';
  };

  const formatDiscoveredTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)}d atrás`;
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 'none',
        border: '1px solid #f0f0f0',
        '&:hover': {
          transform: 'none',
          boxShadow: 'none',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header com ONU Type e Status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                fontSize: '18px',
              }}
            >
              {getOnuIcon(onu.onuType)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600" fontSize="16px">
                {onu.onuType}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="12px"
              >
                S/N: {onu.serialNumber}
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<Schedule fontSize="small" />}
            label={formatDiscoveredTime(onu.discoveredAt)}
            size="small"
            sx={{
              bgcolor: '#f1f5f9',
              color: '#64748b',
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Informações da OLT e Localização */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Tooltip title="OLT">
              <Chip
                icon={<DeviceHub fontSize="small" />}
                label={onu.oltName}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Tooltip>
            <Tooltip title={`Board ${onu.board}, Port ${onu.port}`}>
              <Chip
                label={`${onu.board}/${onu.port}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Tooltip>
          </Stack>

          <Typography variant="body2" color="text.secondary" fontSize="13px">
            Distância: {onu.distance}km
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Métricas de Sinal e Temperatura */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ mb: 2, color: '#1a1a1a' }}
          >
            Status do Sinal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getStatusIcon()}
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontSize="12px">
                  RX Power
                </Typography>
                <Typography variant="body2" fontWeight="600" fontSize="12px">
                  {onu.rxPower}dBm
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.max(
                  0,
                  Math.min(100, ((onu.rxPower || -30) + 30) * 3.33)
                )}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(signalStatus),
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Box>

          {onu.temperature && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Thermostat fontSize="small" sx={{ color: '#6b7280' }} />
              <Typography
                variant="body2"
                fontSize="13px"
                color="text.secondary"
              >
                Temperatura: {onu.temperature}°C
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Botões de Ação */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => onProvision(onu.id)}
            sx={{
              flexGrow: 1,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.2,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              },
            }}
          >
            Provisionar
          </Button>

          {onReject && (
            <Button
              variant="outlined"
              onClick={() => onReject(onu.id)}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                py: 1.2,
                px: 3,
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#d1d5db',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Rejeitar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PendingOnuCard;
