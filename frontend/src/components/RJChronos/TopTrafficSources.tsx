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
} from "@mui/material";
import { H5 } from "components/Typography";
import { FC } from "react";
import AnimatedCard from "components/common/AnimatedCard";
import {
  Router as RouterIcon,
  TrendingUp,
  TrendingDown,
  Remove,
} from "@mui/icons-material";

interface TrafficSourceData {
  id: number;
  name: string;
  region: string;
  icon: string;
  traffic: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  trendValue: string;
  color: string;
}

const TopTrafficSources: FC = () => {
  const trafficSources: TrafficSourceData[] = [
    {
      id: 1,
      name: "OLT-Central-01",
      region: "Centro",
      icon: "R",
      traffic: 2847,
      percentage: 32.5,
      trend: "up",
      trendValue: "+12.3%",
      color: "#3b82f6",
    },
    {
      id: 2,
      name: "OLT-Norte-03",
      region: "Zona Norte",
      icon: "N",
      traffic: 2156,
      percentage: 24.6,
      trend: "up",
      trendValue: "+8.7%",
      color: "#10b981",
    },
    {
      id: 3,
      name: "OLT-Sul-02",
      region: "Zona Sul",
      icon: "S",
      traffic: 1892,
      percentage: 21.6,
      trend: "down",
      trendValue: "-2.1%",
      color: "#f59e0b",
    },
    {
      id: 4,
      name: "OLT-Oeste-01",
      region: "Zona Oeste",
      icon: "O",
      traffic: 1523,
      percentage: 17.4,
      trend: "stable",
      trendValue: "0.0%",
      color: "#8b5cf6",
    },
    {
      id: 5,
      name: "OLT-Leste-04",
      region: "Zona Leste",
      icon: "L",
      traffic: 985,
      percentage: 11.2,
      trend: "up",
      trendValue: "+5.2%",
      color: "#ef4444",
    },
  ];

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />;
      case "down":
        return <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />;
      case "stable":
        return <Remove sx={{ fontSize: 16, color: "text.secondary" }} />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "success.main";
      case "down":
        return "error.main";
      case "stable":
        return "text.secondary";
    }
  };

  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={600}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <RouterIcon sx={{ color: "primary.main" }} />
        <H5>Top Fontes de Tráfego</H5>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                Fonte
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                Tráfego
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                Progresso
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                Tendência
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trafficSources.map((source) => (
              <TableRow key={source.id}>
                {/* Fonte */}
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: source.color,
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {source.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {source.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {source.region}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Tráfego */}
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {source.traffic.toLocaleString()} GB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {source.percentage}% do total
                  </Typography>
                </TableCell>

                {/* Progresso */}
                <TableCell sx={{ width: 120 }}>
                  <Box sx={{ width: "100%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={source.percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "grey.200",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: source.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {source.percentage}%
                    </Typography>
                  </Box>
                </TableCell>

                {/* Tendência */}
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getTrendIcon(source.trend)}
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={getTrendColor(source.trend)}
                    >
                      {source.trendValue}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AnimatedCard>
  );
};

export default TopTrafficSources;
