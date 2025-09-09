import { Box, Typography, Skeleton, Alert } from '@mui/material';
import { H5 } from 'components/Typography';
import { FC, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import AnimatedCard from 'components/common/AnimatedCard';
import { genieacsApi } from '../../api/genieacsApi';
import { OLTPerformanceStats } from '../../api/types';

const OLTPerformanceChart: FC = () => {
  const [performanceStats, setPerformanceStats] =
    useState<OLTPerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await genieacsApi.getOLTPerformanceStats();
      setPerformanceStats(stats);
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={500}>
        <Box sx={{ mb: 3 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
        </Box>

        <Skeleton width="100%" height={350} />
      </AnimatedCard>
    );
  }

  // Error state
  if (error || !performanceStats) {
    return (
      <AnimatedCard sx={{ padding: '2rem' }} delay={500}>
        <H5>Performance dos OLTs</H5>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error} - Dados em cache não disponíveis
        </Alert>
      </AnimatedCard>
    );
  }

  // Preparar dados para o gráfico
  const oltNames = performanceStats.performance_data.map((olt) => olt.olt_name);
  const cpuData = performanceStats.performance_data.map((olt) => olt.cpu_usage);
  const memoryData = performanceStats.performance_data.map(
    (olt) => olt.memory_usage
  );
  const temperatureData = performanceStats.performance_data.map(
    (olt) => olt.temperature
  );

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 1000,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '65%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '10px',
        fontWeight: 600,
        colors: ['#64748b'],
      },
      formatter: (val: number) => `${val}%`,
    },
    stroke: {
      show: true,
      width: 0,
      colors: ['transparent'],
    },
    xaxis: {
      categories: oltNames,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
        },
        rotate: -45,
        rotateAlways: true,
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
        formatter: (val: number) => `${val}%`,
      },
      max: 100,
    },
    grid: {
      show: true,
      borderColor: '#e2e8f0',
      strokeDashArray: 0,
      position: 'back',
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
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
        formatter: (val: number, opts) => {
          const seriesName =
            opts.seriesIndex === 2 ? 'Temperatura' : 'CPU/Memória';
          const unit = opts.seriesIndex === 2 ? '°C' : '%';
          return `${seriesName}: ${val}${unit}`;
        },
      },
    },
  };

  const series = [
    {
      name: 'CPU (%)',
      data: cpuData,
    },
    {
      name: 'Memória (%)',
      data: memoryData,
    },
    {
      name: 'Temperatura (°C)',
      data: temperatureData,
    },
  ];

  return (
    <AnimatedCard sx={{ padding: '2rem' }} delay={500}>
      <Box sx={{ mb: 3 }}>
        <H5>Performance dos OLTs</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Monitoramento de CPU, memória e temperatura em tempo real
        </Typography>
      </Box>

      {/* Estatísticas resumidas */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            CPU Média
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {(
              cpuData.reduce((sum, val) => sum + val, 0) / cpuData.length
            ).toFixed(1)}
            %
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Memória Média
          </Typography>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {(
              memoryData.reduce((sum, val) => sum + val, 0) / memoryData.length
            ).toFixed(1)}
            %
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Temp. Média
          </Typography>
          <Typography variant="h6" fontWeight={700} color="warning.main">
            {(
              temperatureData.reduce((sum, val) => sum + val, 0) /
              temperatureData.length
            ).toFixed(1)}
            °C
          </Typography>
        </Box>
      </Box>

      {/* Gráfico */}
      <Chart options={chartOptions} series={series} type="bar" height={350} />
    </AnimatedCard>
  );
};

export default OLTPerformanceChart;
