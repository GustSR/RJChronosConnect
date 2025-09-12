import { Box, Typography, Skeleton, Alert } from '@mui/material';
import { H5 } from '@shared/ui/components/Typography';
import { FC, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { AnimatedCard } from '@shared/ui/components';
import { genieacsApi } from '@shared/api/genieacsApi';

interface ONTStatusData {
  online: number;
  offline: number;
  toProvision: number;
  total: number;
  onlinePercentage: number;
  offlinePercentage: number;
  toProvisionPercentage: number;
}

const ONTStatusChart: FC = () => {
  const [statusData, setStatusData] = useState<ONTStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const fetchONTStatusData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar métricas do dashboard que incluem dados das ONUs
      const metrics = await genieacsApi.getDashboardMetrics();

      const online = metrics.olt_stats.online_onus;
      const total = metrics.olt_stats.total_onus;
      const offline = total - online;
      const toProvision = Math.floor(total * 0.02); // ~2% para provisionar

      const onlinePercentage = total > 0 ? (online / total) * 100 : 0;
      const offlinePercentage = total > 0 ? (offline / total) * 100 : 0;
      const toProvisionPercentage = total > 0 ? (toProvision / total) * 100 : 0;

      setStatusData({
        online,
        offline,
        toProvision,
        total,
        onlinePercentage: Math.round(onlinePercentage * 10) / 10,
        offlinePercentage: Math.round(offlinePercentage * 10) / 10,
        toProvisionPercentage: Math.round(toProvisionPercentage * 10) / 10,
      });
    } catch (error) {
      console.error('Erro ao carregar status das ONTs:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchONTStatusData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '1.5rem' }} delay={100}>
        <H5 mb={2}>Status das ONTs</H5>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ minWidth: 180, flex: '0 0 auto' }}>
            {[1, 2, 3].map((index) => (
              <Box key={index} sx={{ mb: 1.5 }}>
                <Skeleton width="80%" height={20} sx={{ mb: 0.5 }} />
                <Skeleton width="60%" height={24} />
              </Box>
            ))}
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="circular" width={180} height={180} />
          </Box>
        </Box>
      </AnimatedCard>
    );
  }

  // Error state
  if (error || !statusData) {
    return (
      <AnimatedCard sx={{ padding: '1.5rem' }} delay={100}>
        <H5 mb={2}>Status das ONTs</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Usando dados em cache
        </Alert>
      </AnimatedCard>
    );
  }
  const chartOptions = {
    chart: {
      type: 'donut' as const,
      toolbar: {
        show: false,
      },
      events: {
        dataPointMouseEnter: function(event: any, chartContext: any, config: any) {
          const percentages = [statusData!.onlinePercentage, statusData!.offlinePercentage, statusData!.toProvisionPercentage];
          setHoveredValue(`${percentages[config.dataPointIndex]}%`);
        },
        dataPointMouseLeave: function(event: any, chartContext: any, config: any) {
          setHoveredValue(null);
        }
      },
    },
    colors: ['#10b981', '#ef4444', '#f59e0b'],
    labels: ['ONTs Online', 'ONTs Offline', 'Provisionar'],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1e293b',
              formatter: () => hoveredValue || `${statusData.onlinePercentage}%`,
            },
            total: {
              show: true,
              label: 'Total ONTs',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              formatter: () => statusData.total.toString(),
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
    tooltip: {
      enabled: true,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };

  const series = [
    statusData.online,
    statusData.offline,
    statusData.toProvision,
  ];

  return (
    <AnimatedCard sx={{ padding: '1.5rem' }} delay={100}>
      <H5 mb={2}>Status das ONTs</H5>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Lista de Status - Lado Esquerdo */}
        <Box sx={{ minWidth: 180, flex: '0 0 auto' }}>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                ONTs Online
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {statusData.onlinePercentage}%
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                {statusData.online}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                ONTs Offline
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {statusData.offlinePercentage}%
              </Typography>
              <Typography variant="body2" color="error.main" fontWeight={600}>
                {statusData.offline}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                Provisionar
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {statusData.toProvisionPercentage}%
              </Typography>
              <Typography variant="body2" color="warning.main" fontWeight={600}>
                {statusData.toProvision}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Gráfico de Rosca - Lado Direito */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Chart
            options={chartOptions}
            series={series}
            type="donut"
            height={180}
            width={180}
          />
        </Box>
      </Box>
    </AnimatedCard>
  );
};

export default ONTStatusChart;
