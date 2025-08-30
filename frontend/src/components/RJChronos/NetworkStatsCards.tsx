import { Box, Typography, Grid } from "@mui/material";
import { FC } from "react";
import {
  TrendingUp,
  TrendingDown,
  DeviceHub,
  CloudDownload,
  Router,
  CheckCircle,
} from "@mui/icons-material";
import AnimatedCard from "components/common/AnimatedCard";

interface StatCardData {
  id: number;
  title: string;
  value: string;
  trend: "up" | "down";
  trendValue: string;
  icon: React.ReactElement;
  iconColor: string;
}

const NetworkStatsCards: FC = () => {
  const statsData: StatCardData[] = [
    {
      id: 1,
      title: "ONTs Ativas",
      value: "1,247",
      trend: "up",
      trendValue: "+2.5%",
      icon: <DeviceHub sx={{ fontSize: 24 }} />,
      iconColor: "#3b82f6",
    },
    {
      id: 2,
      title: "Tráfego Total",
      value: "8.7 TB",
      trend: "up",
      trendValue: "+15.2%",
      icon: <CloudDownload sx={{ fontSize: 24 }} />,
      iconColor: "#10b981",
    },
    {
      id: 3,
      title: "OLTs Online",
      value: "98",
      trend: "up",
      trendValue: "+1.8%",
      icon: <Router sx={{ fontSize: 24 }} />,
      iconColor: "#f59e0b",
    },
    {
      id: 4,
      title: "Disponibilidade",
      value: "99.2%",
      trend: "up",
      trendValue: "+0.3%",
      icon: <CheckCircle sx={{ fontSize: 24 }} />,
      iconColor: "#8b5cf6",
    },
  ];

  const getTrendIcon = (trend: "up" | "down") => {
    return trend === "up" ? (
      <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
    ) : (
      <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
    );
  };

  const getTrendColor = (trend: "up" | "down") => {
    return trend === "up" ? "success.main" : "error.main";
  };

  return (
    <Grid container spacing={3}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} lg={3} key={stat.id}>
          <AnimatedCard 
            delay={index * 100}
            sx={{
              padding: "24px",
              height: "100%",
              minHeight: "140px",
            }}
          >
            {/* Header com Ícone */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box sx={{ 
                backgroundColor: `${stat.iconColor}15`, 
                borderRadius: 2, 
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Box sx={{ color: stat.iconColor }}>
                  {stat.icon}
                </Box>
              </Box>
              
              {/* Trend no canto superior direito */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {getTrendIcon(stat.trend)}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={getTrendColor(stat.trend)}
                  sx={{ fontSize: "13px" }}
                >
                  {stat.trendValue}
                </Typography>
              </Box>
            </Box>

            {/* Valor Principal */}
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ 
                color: "#1e293b", 
                mb: 0.5,
                fontSize: "28px",
                lineHeight: 1.2
              }}
            >
              {stat.value}
            </Typography>


            {/* Título */}
            <Typography
              variant="body2"
              color="#6b7280"
              fontWeight={500}
              sx={{ 
                fontSize: "14px",
                lineHeight: 1.4
              }}
            >
              {stat.title}
            </Typography>

            {/* Progress Bar para OLTs Online e Disponibilidade */}
            {(stat.id === 3 || stat.id === 4) && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" color="#6b7280">
                    {stat.id === 3 ? "100 OLTs Meta" : "99.5% Meta"}
                  </Typography>
                  <Typography variant="caption" color="#6b7280">
                    {stat.id === 3 ? "98%" : "99.2%"}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    width: "100%", 
                    height: 6, 
                    backgroundColor: "#e5e7eb", 
                    borderRadius: 3 
                  }}
                >
                  <Box 
                    sx={{ 
                      width: stat.id === 3 ? "98%" : "99.2%", 
                      height: "100%", 
                      backgroundColor: stat.id === 3 ? "#10b981" : "#6950e8",
                      borderRadius: 3 
                    }}
                  />
                </Box>
              </Box>
            )}
          </AnimatedCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default NetworkStatsCards;