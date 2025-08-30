import { Box, Typography } from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import AnimatedCard from "components/common/AnimatedCard";

const OLTPerformanceChart: FC = () => {
  const chartOptions: ApexOptions = {
    chart: {
      type: "bar" as const,
      toolbar: {
        show: false,
      },
      background: "transparent",
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 0,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "OLT-Central-01",
        "OLT-Norte-03",
        "OLT-Sul-02",
        "OLT-Oeste-01",
        "OLT-Leste-04",
      ],
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
        rotate: -45,
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
        formatter: (value: number) => `${value}%`,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number, opts: any) => {
          const series = ["CPU", "Memória", "Temperatura"];
          const unit = opts.seriesIndex === 2 ? "°C" : "%";
          return `${series[opts.seriesIndex]}: ${val}${unit}`;
        },
      },
    },
    legend: {
      show: true,
      position: "top" as const,
      horizontalAlign: "right" as const,
      fontSize: "12px",
      fontWeight: 500,
    },
    grid: {
      show: true,
      borderColor: "#e2e8f0",
      strokeDashArray: 0,
      position: "back" as const,
    },
  };

  const series = [
    {
      name: "CPU (%)",
      data: [45, 52, 38, 41, 33],
    },
    {
      name: "Memória (%)",
      data: [67, 71, 58, 63, 55],
    },
    {
      name: "Temperatura (°C)",
      data: [42, 47, 39, 44, 38],
    },
  ];

  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={400}>
      <Box sx={{ mb: 3 }}>
        <H5>Performance das OLTs</H5>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Monitoramento de recursos e temperatura em tempo real
        </Typography>
      </Box>

      {/* Resumo das métricas */}
      <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            41.8%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CPU Média
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="success.main">
            62.8%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Memória Média
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="warning.main">
            42°C
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Temp. Média
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="success.main">
            98.5%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uptime Médio
          </Typography>
        </Box>
      </Box>

      {/* Gráfico */}
      <Chart
        options={chartOptions}
        series={series}
        type="bar"
        height={350}
      />
    </AnimatedCard>
  );
};

export default OLTPerformanceChart;
