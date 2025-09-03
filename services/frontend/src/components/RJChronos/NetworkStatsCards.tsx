import { Box, Typography, Grid, Skeleton, Alert } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DeviceHub,
  CloudDownload,
  Router,
  Warning,
  SignalWifi4Bar,
} from '@mui/icons-material';
import AnimatedCard from 'components/common/AnimatedCard';
import { genieacsApi } from '../../services/genieacsApi';
import { DashboardMetrics } from '../../services/types';

interface StatCardData {
  id: number;
  title: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  icon: React.ReactElement;
  iconColor: string;
}

const NetworkStatsCards: FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await genieacsApi.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
        setError('Não foi possível carregar as métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcular taxa de crescimento ou mostrar valores padrão durante loading/erro
  const calculateTrend = (
    current: number,
    total: number
  ): { trend: 'up' | 'down'; value: string } => {
    if (!metrics) return { trend: 'up', value: '+0%' };

    const percentage = total > 0 ? (current / total) * 100 : 0;
    return {
      trend: percentage >= 80 ? 'up' : 'down',
      value: `${percentage.toFixed(1)}%`,
    };
  };

  const getStatsData = (): StatCardData[] => {
    if (!metrics) {
      // Dados padrão durante loading
      return [
        {
          id: 1,
          title: 'ONUs Ativas',
          value: '---',
          trend: 'up',
          trendValue: '---%',
          icon: <DeviceHub sx={{ fontSize: 24 }} />,
          iconColor: '#3b82f6',
        },
        {
          id: 2,
          title: 'Tráfego Total',
          value: '---',
          trend: 'up',
          trendValue: '---%',
          icon: <CloudDownload sx={{ fontSize: 24 }} />,
          iconColor: '#10b981',
        },
        {
          id: 3,
          title: 'OLTs Online',
          value: '---',
          trend: 'up',
          trendValue: '---%',
          icon: <Router sx={{ fontSize: 24 }} />,
          iconColor: '#f59e0b',
        },
        {
          id: 4,
          title: 'WiFi Habilitado',
          value: '---',
          trend: 'up',
          trendValue: '---%',
          icon: <SignalWifi4Bar sx={{ fontSize: 24 }} />,
          iconColor: '#8b5cf6',
        },
      ];
    }

    const oltTrend = calculateTrend(
      metrics.olt_stats?.online_olts || 0,
      metrics.olt_stats?.total_olts || 0
    );
    const onuTrend = calculateTrend(
      metrics.olt_stats?.online_onus || 0,
      metrics.olt_stats?.total_onus || 0
    );
    const wifiTrend = calculateTrend(
      metrics.wifi_stats?.total_wifi_enabled || 0,
      metrics.olt_stats?.total_onus || 0
    );

    return [
      {
        id: 1,
        title: 'ONUs Ativas',
        value: `${(metrics.olt_stats?.online_onus || 0).toLocaleString()}`,
        trend: onuTrend.trend,
        trendValue: onuTrend.value,
        icon: <DeviceHub sx={{ fontSize: 24 }} />,
        iconColor: '#3b82f6',
      },
      {
        id: 2,
        title: 'Tráfego Total',
        value: `${(
          (metrics.traffic_stats?.total_bandwidth || 0) / 1024
        ).toFixed(1)} TB`,
        trend: 'up',
        trendValue: `↑${(metrics.traffic_stats?.upload || 0).toFixed(1)} ↓${(
          metrics.traffic_stats?.download || 0
        ).toFixed(1)}`,
        icon: <CloudDownload sx={{ fontSize: 24 }} />,
        iconColor: '#10b981',
      },
      {
        id: 3,
        title: 'OLTs Online',
        value: `${metrics.olt_stats?.online_olts || 0}/${
          metrics.olt_stats?.total_olts || 0
        }`,
        trend: oltTrend.trend,
        trendValue: oltTrend.value,
        icon: <Router sx={{ fontSize: 24 }} />,
        iconColor: '#f59e0b',
      },
      {
        id: 4,
        title: 'WiFi Habilitado',
        value: `${(
          metrics.wifi_stats?.total_wifi_enabled || 0
        ).toLocaleString()}`,
        trend: wifiTrend.trend,
        trendValue: wifiTrend.value,
        icon: <SignalWifi4Bar sx={{ fontSize: 24 }} />,
        iconColor: '#8b5cf6',
      },
    ];
  };

  if (error) {
    return (
      <AnimatedCard>
        <Alert severity="warning" icon={<Warning />} sx={{ borderRadius: 2 }}>
          {error} - Usando dados em cache
        </Alert>
      </AnimatedCard>
    );
  }

  const statsData = getStatsData();

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? (
      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
    );
  };

  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'success.main' : 'error.main';
  };

  return (
    <Grid container spacing={3}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} lg={3} key={stat.id}>
          <AnimatedCard
            delay={index * 100}
            sx={{
              padding: '24px',
              height: '100%',
              minHeight: '140px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: `${stat.iconColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.iconColor,
                }}
              >
                {loading ? (
                  <Skeleton variant="rectangular" width={24} height={24} />
                ) : (
                  stat.icon
                )}
              </Box>
              {loading ? (
                <Skeleton width={60} height={20} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon(stat.trend)}
                  <Typography
                    variant="caption"
                    fontWeight="600"
                    sx={{ color: getTrendColor(stat.trend) }}
                  >
                    {stat.trendValue}
                  </Typography>
                </Box>
              )}
            </Box>

            {loading ? (
              <>
                <Skeleton width="80%" height={32} sx={{ mb: 1 }} />
                <Skeleton width="60%" height={20} />
              </>
            ) : (
              <>
                <Typography
                  variant="h3"
                  fontWeight="700"
                  sx={{
                    mb: 0.5,
                    fontSize: '28px',
                    color: 'text.primary',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {stat.title}
                </Typography>
              </>
            )}
          </AnimatedCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default NetworkStatsCards;
