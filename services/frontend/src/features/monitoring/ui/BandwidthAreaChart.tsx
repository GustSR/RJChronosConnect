import { Box, Typography, Skeleton, Alert } from '@mui/material';
import { H5 } from '@shared/ui/components/Typography';
import { FC, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { AnimatedCard } from '@shared/ui/components';
import { genieacsApi } from '@shared/api/genieacsApi';
import { BandwidthStats } from '@shared/api/types';

const BandwidthAreaChart: FC = () => {
  const [bandwidthStats, setBandwidthStats] = useState<BandwidthStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBandwidthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await genieacsApi.getBandwidthStats('24h');
      setBandwidthStats(stats);
    } catch (error) {
      console.error('Erro ao carregar dados de bandwidth:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandwidthData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={300}>
        <Box sx={{ mb: 3 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {[1, 2, 3].map((index) => (
            <Box key={index}>
              <Skeleton width="80px" height={20} />
              <Skeleton width="60px" height={28} sx={{ mt: 1 }} />
            </Box>
          ))}
        </Box>

        <Skeleton width="100%" height={300} />
      </AnimatedCard>
    );
  }

  // Error state
  if (error || !bandwidthStats) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={300}>
        <H5>Tráfego de Banda</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  // Preparar dados para o gráfico
  const categories = bandwidthStats.data_points.map((point) => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  const series = [
    {
      name: 'Baixar',
      data: bandwidthStats.data_points.map((point) => point.download_mbps),
    },
    {
      name: 'Enviar',
      data: bandwidthStats.data_points.map((point) => point.upload_mbps),
    },
  ];

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      sparkline: {
        enabled: false,
      },
      animations: {
        enabled: true,
        speed: 1500,
        animateGradually: {
          enabled: true,
          delay: 300,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500,
        },
      },
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 50, 100],
      },
    },
    grid: {
      show: true,
      borderColor: '#e2e8f0',
      strokeDashArray: 0,
      position: 'back',
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
        },
        formatter: (val: number) => `${val} Mbps`,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'inherit',
      fontWeight: 500,
      fontSize: '13px',
      markers: {
        size: 8,
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 16,
        vertical: 0,
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
      },
      y: {
        formatter: (val: number) => `${val} Mbps`,
      },
    },
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
      delay={300}
    >
      {/* Título e descrição */}
      <Box sx={{ mb: 3 }}>
        <H5>Tráfego de Banda</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Monitoramento em tempo real do tráfego da rede
        </Typography>
      </Box>

      {/* Estatísticas principais */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Pico de Baixar
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {bandwidthStats.peak_download.toFixed(0)} Mbps
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Pico de Enviar
          </Typography>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {bandwidthStats.peak_upload.toFixed(0)} Mbps
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Média Atual
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {bandwidthStats.current_download.toFixed(0)} /{' '}
            {bandwidthStats.current_upload.toFixed(0)} Mbps
          </Typography>
        </Box>
      </Box>

      {/* Gráfico */}
      <Chart options={chartOptions} series={series} type="area" height={300} />
    </AnimatedCard>
  );
};

export default BandwidthAreaChart;
