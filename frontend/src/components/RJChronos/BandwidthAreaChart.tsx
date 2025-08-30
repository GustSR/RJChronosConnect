import { Box, Typography } from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import AnimatedCard from "components/common/AnimatedCard";

const BandwidthAreaChart: FC = () => {
  const chartOptions: ApexOptions = {
    chart: {
      type: "area" as const,
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
          delay: 300
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500
        }
      },
      dropShadow: {
        enabled: true,
        color: '#000',
        top: 1,
        left: 1,
        blur: 3,
        opacity: 0.1
      },
    },
    colors: ["#3b82f6", "#10b981"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
      lineCap: 'round' as const,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 50, 100],
        colorStops: [
          {
            offset: 0,
            color: "#3b82f6",
            opacity: 0.7
          },
          {
            offset: 50,
            color: "#3b82f6",
            opacity: 0.3
          },
          {
            offset: 100,
            color: "#3b82f6",
            opacity: 0.1
          }
        ]
      },
    },
    grid: {
      show: true,
      borderColor: "#e2e8f0",
      strokeDashArray: 0,
      position: "back" as const,
    },
    xaxis: {
      categories: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
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
          colors: "#64748b",
          fontSize: "12px",
        },
        formatter: (value: number) => `${value} Mbps`,
      },
    },
    legend: {
      show: true,
      position: "top" as const,
      horizontalAlign: "right" as const,
      fontSize: "12px",
      fontWeight: 500,
    },
    markers: {
      size: 0,
      colors: ["#3b82f6", "#10b981"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 8,
        sizeOffset: 3
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      followCursor: true,
      y: {
        formatter: (value: number) => `${value} Mbps`,
      },
    },
  };

  const series = [
    {
      name: "Download",
      data: [850, 920, 1100, 1350, 1200, 980],
    },
    {
      name: "Upload",
      data: [320, 380, 420, 580, 520, 440],
    },
  ];

  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={200}>
      <Box sx={{ mb: 3 }}>
        <H5>Tráfego de Banda - Últimas 24h</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Monitoramento em tempo real do tráfego da rede
        </Typography>
      </Box>

      {/* Estatísticas principais */}
      <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Pico de Download
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            1.35 Gbps
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Pico de Upload
          </Typography>
          <Typography variant="h6" fontWeight={700} color="success.main">
            580 Mbps
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Média Atual
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            980 / 440 Mbps
          </Typography>
        </Box>
      </Box>

      {/* Gráfico */}
      <Chart
        options={chartOptions}
        series={series}
        type="area"
        height={300}
      />
    </AnimatedCard>
  );
};

export default BandwidthAreaChart;
