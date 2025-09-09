import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  LinearProgress,
  Avatar,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material';
import { H5 } from 'components/Typography';
import { FC, useEffect, useState } from 'react';
import AnimatedCard from 'components/common/AnimatedCard';
import {
  Router as RouterIcon,
  TrendingUp,
  TrendingDown,
  Remove,
  Settings,
  Hub,
} from '@mui/icons-material';
import { genieacsApi } from '../../api/genieacsApi';
import { TrafficSourcesStats } from '../../api/types';

const TopTrafficSources: FC = () => {
  const [trafficStats, setTrafficStats] = useState<TrafficSourcesStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafficSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await genieacsApi.getTrafficSources();
      setTrafficStats(stats);
    } catch (error) {
      console.error('Erro ao carregar fontes de tráfego:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficSources();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={400}>
        <Box sx={{ mb: 3 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  'Dispositivo',
                  'Região',
                  'Tráfego',
                  'Participação',
                  'Tendência',
                ].map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton width="80%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton width="120px" height={20} />
                        <Skeleton width="80px" height={16} sx={{ mt: 1 }} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80px" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="60px" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="100px" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="60px" height={20} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AnimatedCard>
    );
  }

  // Error state
  if (error || !trafficStats) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={400}>
        <H5>Top Fontes de Tráfego</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />;
      case 'stable':
        return <Remove sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const getDeviceIcon = (deviceType: 'OLT' | 'Router' | 'Switch') => {
    switch (deviceType) {
      case 'OLT':
        return <Hub sx={{ fontSize: 20 }} />;
      case 'Router':
        return <RouterIcon sx={{ fontSize: 20 }} />;
      case 'Switch':
        return <Settings sx={{ fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: 'online' | 'offline' | 'warning') => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'offline':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <AnimatedCard sx={{ padding: '2rem' }} delay={400}>
      <Box sx={{ mb: 3 }}>
        <H5>Top Fontes de Tráfego</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Principais geradores de tráfego nas últimas 24h
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Dispositivo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Região</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tráfego</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Participação</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tendência</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trafficStats.sources.map((source) => (
              <TableRow key={source.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: getStatusColor(source.status),
                        color: 'white',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getDeviceIcon(source.device_type)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {source.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {source.device_type}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{source.region}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {source.traffic_mbps.toFixed(0)} Mbps
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 120 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {source.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={source.percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getStatusColor(source.status),
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={source.status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(source.status),
                      color: 'white',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getTrendIcon(source.trend)}
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        source.trend === 'up'
                          ? 'success.main'
                          : source.trend === 'down'
                          ? 'error.main'
                          : 'text.secondary'
                      }
                    >
                      {source.trend_value > 0 ? '+' : ''}
                      {source.trend_value.toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resumo do tráfego total */}
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Tráfego Total:</strong>{' '}
          {trafficStats.total_traffic.toFixed(0)} Mbps
          {' • '}
          <strong>Período:</strong> {trafficStats.period}
        </Typography>
      </Box>
    </AnimatedCard>
  );
};

export default TopTrafficSources;
