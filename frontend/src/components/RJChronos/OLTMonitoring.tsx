import { Box, Chip, LinearProgress } from "@mui/material";
import { H5, Small } from "components/Typography";
import { FC } from "react";
import AnimatedCard from "components/common/AnimatedCard";
import { Thermostat, AccessTime } from "@mui/icons-material";

// Dados mockados para informações das OLTs
const oltInfo = [
  {
    id: 1,
    name: "OLT-CENTRO-01",
    temperature: 42,
    uptime: "15d 8h 23m",
    status: "normal",
    location: "Centro - Rack A3"
  },
  {
    id: 2,
    name: "OLT-BAIRRO-02", 
    temperature: 38,
    uptime: "2d 14h 45m",
    status: "warning",
    location: "Bairro Sul - Rack B1"
  },
  {
    id: 3,
    name: "OLT-INDUSTRIAL-03",
    temperature: 35,
    uptime: "45d 2h 12m",
    status: "normal",
    location: "Zona Industrial - Rack C2"
  },
];

const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "normal":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "error";
    default:
      return "default";
  }
};

const getTemperatureProgress = (temp: number) => {
  if (temp > 40) return { value: 85, color: "error" as const };
  if (temp > 35) return { value: 60, color: "warning" as const };
  return { value: 30, color: "success" as const };
};

const OLTMonitoring: FC = () => {
  return (
    <AnimatedCard sx={{ padding: "2rem" }} delay={500}>
      <H5>Monitoramento OLTs</H5>
      
      {oltInfo.map((olt) => {
        const tempProgress = getTemperatureProgress(olt.temperature);
        
        return (
          <Box key={olt.id} sx={{ mb: 3, "&:last-child": { mb: 0 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Small fontWeight={600} color="text.primary">
                {olt.name}
              </Small>
              <Chip
                label={olt.status.toUpperCase()}
                color={getStatusColor(olt.status)}
                size="small"
                sx={{ fontSize: 10 }}
              />
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Thermostat sx={{ mr: 1, color: "warning.main", fontSize: 18 }} />
              <Small color="text.secondary">
                Temperatura: {olt.temperature}°C
              </Small>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} />
              <Small color="text.secondary">
                Uptime: {olt.uptime}
              </Small>
            </Box>
            
            <Small color="text.disabled" sx={{ fontSize: 11, display: "block", mb: 1 }}>
              {olt.location}
            </Small>
            
            <LinearProgress
              variant="determinate"
              value={tempProgress.value}
              color={tempProgress.color}
              sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: "action.hover"
              }}
            />
          </Box>
        );
      })}
    </AnimatedCard>
  );
};

export default OLTMonitoring;
