import {
  Box,
  Chip,
  LinearProgress,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import { H5, Small } from '@shared/ui/components/Typography';
import { FC, useEffect, useState } from 'react';
import { AnimatedCard } from '@shared/ui/components';
import { Thermostat, AccessTime, LocationOn } from '@mui/icons-material';
import { genieacsApi } from '@shared/api/genieacsApi';
import { OLT } from '@shared/api/types';

const OLTMonitoring: FC = () => {
  const [olts, setOLTs] = useState<OLT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOLTData = async () => {
    try {
      setLoading(true);
      setError(null);

      const oltList = await genieacsApi.getOLTs();
      setOLTs(oltList);
    } catch (error) {
      console.error('Erro ao carregar dados dos OLTs:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOLTData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={600}>
        <Box sx={{ mb: 3 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
        </Box>

        {[1, 2, 3].map((index) => (
          <Box
            key={index}
            sx={{
              mb: 3,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box>
                <Skeleton width="150px" height={24} />
                <Skeleton width="120px" height={20} sx={{ mt: 1 }} />
              </Box>
              <Skeleton width="80px" height={32} />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Skeleton width="100px" height={20} />
              <Skeleton width="80px" height={20} />
            </Box>

            <Skeleton width="100%" height={8} />
          </Box>
        ))}
      </AnimatedCard>
    );
  }

  // Error state
  if (error || olts.length === 0) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={600}>
        <H5>Monitoramento de OLTs</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Nenhuma OLT encontrada'} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'online':
        return 'success';
      case 'warning':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTemperatureProgress = (temp?: number) => {
    if (!temp) return { value: 0, color: 'default' as const };

    if (temp > 50) return { value: 90, color: 'error' as const };
    if (temp > 45) return { value: 75, color: 'warning' as const };
    if (temp > 35) return { value: 50, color: 'info' as const };
    return { value: 25, color: 'success' as const };
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';

    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <AnimatedCard
      sx={{
        padding: '2rem',
        '&:hover': {
          transform: 'none',
          boxShadow:
            '0px 2px 1px -1px rgba(107, 114, 128, 0.03), 0px 1px 1px 0px rgba(107, 114, 128, 0.04), 0px 1px 3px 0px rgba(107, 114, 128, 0.08)',
        },
      }}
      delay={600}
    >
      <Box sx={{ mb: 3 }}>
        <H5>Monitoramento de OLTs</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Status em tempo real das OLTs da rede
        </Typography>
      </Box>

      {olts.slice(0, 5).map((olt) => {
        const tempProgress = getTemperatureProgress(olt.temperature);

        return (
          <Box
            key={olt.id}
            sx={{
              mb: 3,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 1,
              },
            }}
          >
            {/* Header com nome e status */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  OLT-{olt.id}
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Small color="text.secondary">
                    {olt.location || 'Localização não informada'}
                  </Small>
                </Box>
              </Box>

              <Chip
                label={olt.status === 'online' ? 'Normal' : olt.status}
                color={getStatusColor(olt.status)}
                size="small"
                sx={{
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              />
            </Box>

            {/* Métricas */}
            <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Thermostat
                  sx={{
                    fontSize: 18,
                    color:
                      tempProgress.color === 'error'
                        ? 'error.main'
                        : 'text.secondary',
                  }}
                />
                <Small>
                  <strong>Temp:</strong> {olt.temperature?.toFixed(1) || 'N/A'}
                  °C
                </Small>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Small>
                  <strong>Uptime:</strong> {formatUptime(olt.uptime)}
                </Small>
              </Box>

              <Box>
                <Small>
                  <strong>ONUs:</strong> {olt.active_onus}/{olt.pon_ports * 32}
                </Small>
              </Box>

              {olt.cpu_usage && (
                <Box>
                  <Small>
                    <strong>CPU:</strong> {olt.cpu_usage.toFixed(1)}%
                  </Small>
                </Box>
              )}
            </Box>

            {/* Barra de temperatura */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Small fontWeight={500}>Status Térmico</Small>
                <Small
                  color={
                    tempProgress.color === 'error'
                      ? 'error'
                      : tempProgress.color === 'warning'
                      ? 'warning'
                      : 'text.secondary'
                  }
                >
                  {olt.temperature && olt.temperature > 50
                    ? 'Crítico'
                    : olt.temperature && olt.temperature > 45
                    ? 'Alto'
                    : olt.temperature && olt.temperature > 35
                    ? 'Normal'
                    : 'Baixo'}
                </Small>
              </Box>

              <LinearProgress
                variant="determinate"
                value={tempProgress.value}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor:
                      tempProgress.color === 'error'
                        ? '#ef4444'
                        : tempProgress.color === 'warning'
                        ? '#f59e0b'
                        : tempProgress.color === 'info'
                        ? '#3b82f6'
                        : '#10b981',
                  },
                }}
              />
            </Box>
          </Box>
        );
      })}
    </AnimatedCard>
  );
};

export default OLTMonitoring;
