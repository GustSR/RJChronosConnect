import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Settings,
  SignalWifi4Bar,
  SignalWifiOff,
  Router,
  Speed
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { formatLatency, formatBandwidth, getStatusColor } from '@/utils';

interface RealTimeMonitorProps {
  deviceIds?: string[];
  refreshInterval?: number;
  showControls?: boolean;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  deviceIds = [],
  refreshInterval = 5000,
  showControls = true
}) => {
  const [isActive, setIsActive] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState({
    latency: true,
    throughput: true,
    signalStrength: true,
    packetLoss: false
  });

  const { isConnected, metrics, systemStatus, connect, disconnect } = useRealTimeData({
    autoConnect: true
  });

  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (metrics.length > 0) {
      const latestMetrics = metrics.slice(-1)[0];
      const timestamp = new Date();
      
      setHistoricalData(prev => {
        const newData = [...prev, {
          timestamp: timestamp.getTime(),
          latency: latestMetrics.metrics.networkLatency || 0,
          throughput: latestMetrics.metrics.throughput?.download || 0,
          signalStrength: latestMetrics.metrics.signalStrength || 0,
          packetLoss: latestMetrics.metrics.packetLoss || 0
        }];
        
        // Keep only last 50 data points
        return newData.slice(-50);
      });
    }
  }, [metrics]);

  const toggleMonitoring = () => {
    if (isActive) {
      disconnect();
    } else {
      connect();
    }
    setIsActive(!isActive);
  };

  const getConnectionStatus = () => {
    if (!isConnected) {
      return { label: 'Desconectado', color: '#f44336', icon: <SignalWifiOff /> };
    }
    return { label: 'Conectado', color: '#4caf50', icon: <SignalWifi4Bar /> };
  };

  const connectionStatus = getConnectionStatus();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1 }}>
          <Typography variant="caption">
            {new Date(label).toLocaleTimeString()}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  backgroundColor: entry.color,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="caption">
                {entry.name}: {entry.value.toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Monitor em Tempo Real</Typography>
          
          {showControls && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={connectionStatus.icon}
                label={connectionStatus.label}
                size="small"
                sx={{ backgroundColor: connectionStatus.color, color: 'white' }}
              />
              
              <Tooltip title={isActive ? 'Pausar' : 'Iniciar'}>
                <IconButton onClick={toggleMonitoring} size="small">
                  {isActive ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Configurações">
                <IconButton size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" color="primary">
                {systemStatus?.metrics.devicesOnline || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Dispositivos Online
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" color="warning.main">
                {systemStatus?.metrics.activeAlerts || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alertas Ativos
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" color="success.main">
                {systemStatus?.metrics.systemLoad ? `${systemStatus.metrics.systemLoad.toFixed(1)}%` : '0%'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Carga do Sistema
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" color="info.main">
                {systemStatus?.metrics.memoryUsage ? `${systemStatus.metrics.memoryUsage.toFixed(1)}%` : '0%'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Uso de Memória
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Métricas Exibidas
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={selectedMetrics.latency}
                  onChange={(e) => setSelectedMetrics(prev => ({ ...prev, latency: e.target.checked }))}
                />
              }
              label="Latência"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={selectedMetrics.throughput}
                  onChange={(e) => setSelectedMetrics(prev => ({ ...prev, throughput: e.target.checked }))}
                />
              }
              label="Throughput"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={selectedMetrics.signalStrength}
                  onChange={(e) => setSelectedMetrics(prev => ({ ...prev, signalStrength: e.target.checked }))}
                />
              }
              label="Sinal"
            />
          </Box>
        </Box>

        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {selectedMetrics.latency && (
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={false}
                  name="Latência (ms)"
                />
              )}
              
              {selectedMetrics.throughput && (
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="#4caf50"
                  strokeWidth={2}
                  dot={false}
                  name="Throughput (Mbps)"
                />
              )}
              
              {selectedMetrics.signalStrength && (
                <Line
                  type="monotone"
                  dataKey="signalStrength"
                  stroke="#ff9800"
                  strokeWidth={2}
                  dot={false}
                  name="Sinal (dBm)"
                />
              )}
              
              {selectedMetrics.packetLoss && (
                <Line
                  type="monotone"
                  dataKey="packetLoss"
                  stroke="#f44336"
                  strokeWidth={2}
                  dot={false}
                  name="Perda de Pacotes (%)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {metrics.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Última Atualização: {new Date(metrics[metrics.length - 1].timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
