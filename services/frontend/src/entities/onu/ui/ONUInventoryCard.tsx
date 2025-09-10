import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Tooltip,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import {
  SignalCellular4Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellularOff,
  Router,
  Settings,
  LocationOn,
  Schedule,
  Comment,
  Circle,
  WifiTethering,
  MoreVert,
} from '@mui/icons-material';

interface ONUInventoryCardProps {
  onu: {
    id: string;
    serialNumber: string;
    modelo: string;
    oltName: string;
    board: string;
    port: string;
    endereco: string;
    comentario?: string;
    vlan: string;
    status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
    sinal: number;
    dataAutorizacao: string;
  };
  onConfigure: () => void;
}

const ONUInventoryCard: React.FC<ONUInventoryCardProps> = ({
  onu,
  onConfigure,
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

  const getSinalLabel = (sinal: number) => {
    if (sinal >= -15) return 'Excelente';
    if (sinal >= -20) return 'Bom';
    if (sinal >= -25) return 'Regular';
    return 'Fraco';
  };

  const getOnuIcon = (modelo: string) => {
    const type = modelo.toLowerCase();
    if (type.includes('zte')) return '🔷';
    if (type.includes('huawei')) return '🔴';
    if (type.includes('fiberhome')) return '🟢';
    if (type.includes('nokia')) return '🔵';
    return '📡';
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f0f0f0',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header com modelo e status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                fontSize: '24px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.light',
                borderRadius: 2,
              }}
            >
              {getOnuIcon(onu.modelo)}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600" fontSize="16px">
                {onu.modelo}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="12px"
                fontFamily="monospace"
              >
                S/N: {onu.serialNumber}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusChip(onu.status)}
            <IconButton size="small">
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Informações da OLT e localização */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Tooltip title="OLT">
                <Chip
                  icon={<Router fontSize="small" />}
                  label={onu.oltName}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Tooltip>
              <Tooltip title={`Board ${onu.board}, Port ${onu.port}`}>
                <Chip
                  icon={<WifiTethering fontSize="small" />}
                  label={`${onu.board}/${onu.port}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Tooltip>
              <Tooltip title="VLAN">
                <Chip
                  label={`VLAN ${onu.vlan}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Tooltip>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn
                sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="12px"
              >
                {onu.endereco}
              </Typography>
            </Box>

            {onu.comentario && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Comment
                  sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="12px"
                >
                  {onu.comentario}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="12px"
              >
                Autorizada em{' '}
                {new Date(onu.dataAutorizacao).toLocaleString('pt-BR')}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Status do Sinal */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ mb: 2, color: '#1a1a1a' }}
          >
            Qualidade do Sinal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={getSinalLabel(onu.sinal)}>
              {getSinalIcon(onu.sinal)}
            </Tooltip>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontSize="12px">
                  Potência RX
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    fontSize="12px"
                    sx={{ color: getSinalColor(onu.sinal) }}
                  >
                    {onu.sinal} dBm
                  </Typography>
                  <Chip
                    label={getSinalLabel(onu.sinal)}
                    size="small"
                    sx={{
                      fontSize: '10px',
                      height: 20,
                      bgcolor: getSinalColor(onu.sinal),
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Botão de Configuração */}
        <Button
          variant="contained"
          startIcon={<Settings />}
          onClick={onConfigure}
          fullWidth
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            background: 'linear-gradient(135deg, #6366f1, #5855eb)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            },
          }}
        >
          Configurar Equipamento
        </Button>
      </CardContent>
    </Card>
  );
};

export default ONUInventoryCard;
