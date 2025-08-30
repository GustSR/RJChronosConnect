import { Box, Typography } from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import Chart from "react-apexcharts";
import AnimatedCard from "components/common/AnimatedCard";

const ONTStatusChart: FC = () => {
  const chartOptions = {
    chart: {
      type: "donut" as const,
      toolbar: {
        show: false,
      },
    },
    colors: ["#10b981", "#ef4444", "#f59e0b"],
    labels: ["ONTs Online", "ONTs Offline", "Provisionar"],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 600,
              color: "#1e293b",
              formatter: () => "94.2%",
            },
            total: {
              show: true,
              label: "Online",
              fontSize: "14px",
              fontWeight: 500,
              color: "#64748b",
            },
          },
        },
      },
    },
    stroke: {
      show: false,
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

  const series = [1247, 83, 27]; // ONTs Online, Offline, Provisionar

  return (
    <AnimatedCard sx={{ padding: "1.5rem" }} delay={100}>
      <H5 mb={2}>Status das ONTs</H5>
      
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Lista de Status - Lado Esquerdo */}
        <Box sx={{ minWidth: 180, flex: "0 0 auto" }}>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                ONTs Online
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight={700}>
                94.2%
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                +2.5%
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                ONTs Offline
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight={700}>
                5.8%
              </Typography>
              <Typography variant="body2" color="error.main" fontWeight={600}>
                -1.2%
              </Typography>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  mr: 1,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                Provisionar
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" fontWeight={700}>
                2.0%
              </Typography>
              <Typography variant="body2" color="warning.main" fontWeight={600}>
                +15.3%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Gráfico de Rosca - Lado Direito */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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
