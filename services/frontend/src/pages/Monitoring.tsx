import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Stack,
  LinearProgress,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BerryCard from '../components/common/BerryCard';
import MetricCard from '../components/common/MetricCard';
import StatusChip from '../components/common/StatusChip';
import {
  TrendingUp,
  TrendingDown,
  NetworkCheck,
  Speed,
  Router,
  Settings,
  Refresh,
  Timeline,
  DeviceHub,
  SignalCellularAlt,
  Wifi,
  Memory,
  Analytics,
  Visibility,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock monitoring data
const realtimeMetrics = {
  bandwidth: { current: 847.2, max: 1000, unit: 'Mbps' },
  latency: { current: 12.4, threshold: 50, unit: 'ms' },
  packetLoss: { current: 0.02, threshold: 1, unit: '%' },
  jitter: { current: 2.1, threshold: 10, unit: 'ms' },
  connections: { current: 1247, max: 2000, unit: 'conn' },
  cpuUsage: { current: 34.7, threshold: 80, unit: '%' },
};

const deviceStatus = [
  {
    id: 'cpe-001',
    name: 'CPE Cliente 001',
    type: 'CPE',
    status: 'online',
    uptime: '15d 8h 23m',
    lastSeen: '2024-01-15T10:30:00Z',
    metrics: {
      signal: -18.5,
      snr: 28.2,
      temperature: 42,
      cpu: 25,
      memory: 67,
    },
  },
  {
    id: 'olt-001',
    name: 'OLT Central',
    type: 'OLT',
    status: 'online',
    uptime: '45d 12h 15m',
    lastSeen: '2024-01-15T10:29:00Z',
    metrics: {
      signal: -12.3,
      snr: 32.1,
      temperature: 38,
      cpu: 18,
      memory: 45,
    },
  },
  {
    id: 'cpe-002',
    name: 'CPE Cliente 002',
    type: 'CPE',
    status: 'warning',
    uptime: '2d 4h 12m',
    lastSeen: '2024-01-15T10:25:00Z',
    metrics: {
      signal: -24.8,
      snr: 22.5,
      temperature: 58,
      cpu: 78,
      memory: 89,
    },
  },
  {
    id: 'onu-001',
    name: 'ONU Residencial 001',
    type: 'ONU',
    status: 'offline',
    uptime: '0m',
    lastSeen: '2024-01-15T09:45:00Z',
    metrics: {
      signal: -35.2,
      snr: 8.1,
      temperature: 0,
      cpu: 0,
      memory: 0,
    },
  },
];

// Mock chart data
const bandwidthData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  download: Math.floor(Math.random() * 200) + 700,
  upload: Math.floor(Math.random() * 100) + 300,
}));

const latencyData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  latency: Math.floor(Math.random() * 20) + 10,
  jitter: Math.floor(Math.random() * 5) + 1,
}));

const signalData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  signal: -(Math.floor(Math.random() * 10) + 15),
  snr: Math.floor(Math.random() * 10) + 25,
}));

// Tipos para monitoramento
type MonitoringStatus = 'online' | 'offline' | 'warning' | 'maintenance';

function getDeviceIcon(type: string) {
  switch (type) {
    case 'CPE': return <Router />;
    case 'OLT': return <DeviceHub />;
    case 'ONU': return <SignalCellularAlt />;
    default: return <Router />;
  }
}

const Monitoring: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);
  const [timeRange, setTimeRange] = React.useState('24h');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const monitoringStats = {
    totalDevices: deviceStatus.length,
    onlineDevices: deviceStatus.filter(d => d.status === 'online').length,
    warningDevices: deviceStatus.filter(d => d.status === 'warning').length,
    offlineDevices: deviceStatus.filter(d => d.status === 'offline').length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            📊 Monitoramento em Tempo Real
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitoramento contínuo da rede e dispositivos
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              label="Período"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">1 Hora</MenuItem>
              <MenuItem value="6h">6 Horas</MenuItem>
              <MenuItem value="24h">24 Horas</MenuItem>
              <MenuItem value="7d">7 Dias</MenuItem>
            </Select>
          </FormControl>
          
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Real-time Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Largura de Banda"
            value={`${realtimeMetrics.bandwidth.current} ${realtimeMetrics.bandwidth.unit}`}
            subtitle={`de ${realtimeMetrics.bandwidth.max} ${realtimeMetrics.bandwidth.unit}`}
            color="primary"
            icon={Speed}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Latência"
            value={`${realtimeMetrics.latency.current} ${realtimeMetrics.latency.unit}`}
            subtitle={`limite ${realtimeMetrics.latency.threshold}${realtimeMetrics.latency.unit}`}
            color={realtimeMetrics.latency.current > realtimeMetrics.latency.threshold ? 'error' : 'success'}
            icon={NetworkCheck}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Perda de Pacotes"
            value={`${realtimeMetrics.packetLoss.current}${realtimeMetrics.packetLoss.unit}`}
            subtitle={`limite ${realtimeMetrics.packetLoss.threshold}${realtimeMetrics.packetLoss.unit}`}
            color={realtimeMetrics.packetLoss.current > realtimeMetrics.packetLoss.threshold ? 'error' : 'success'}
            icon={TrendingDown}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Jitter"
            value={`${realtimeMetrics.jitter.current} ${realtimeMetrics.jitter.unit}`}
            subtitle={`limite ${realtimeMetrics.jitter.threshold}${realtimeMetrics.jitter.unit}`}
            color={realtimeMetrics.jitter.current > realtimeMetrics.jitter.threshold ? 'warning' : 'success'}
            icon={Timeline}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Conexões"
            value={`${realtimeMetrics.connections.current} ${realtimeMetrics.connections.unit}`}
            subtitle={`de ${realtimeMetrics.connections.max} ${realtimeMetrics.connections.unit}`}
            color="secondary"
            icon={Wifi}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="CPU Sistema"
            value={`${realtimeMetrics.cpuUsage.current}${realtimeMetrics.cpuUsage.unit}`}
            subtitle={`limite ${realtimeMetrics.cpuUsage.threshold}${realtimeMetrics.cpuUsage.unit}`}
            color={realtimeMetrics.cpuUsage.current > realtimeMetrics.cpuUsage.threshold ? 'warning' : 'success'}
            icon={Memory}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <BerryCard gradient={false}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="📈 Gráficos em Tempo Real" />
            <Tab label="🔌 Status dos Dispositivos" />
            <Tab label="📊 Métricas Históricas" />
            <Tab label="⚙️ Configurações" />
          </Tabs>
        </Box>

        {/* Real-time Charts Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Largura de Banda - Últimas 24h
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={bandwidthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="download" 
                        stackId="1"
                        stroke={theme.palette.primary.main} 
                        fill={theme.palette.primary.light}
                        name="Download (Mbps)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="upload" 
                        stackId="1"
                        stroke={theme.palette.secondary.main} 
                        fill={theme.palette.secondary.light}
                        name="Upload (Mbps)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Latência e Jitter - Últimas 24h
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={latencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        stroke={theme.palette.warning.main} 
                        strokeWidth={2}
                        name="Latência (ms)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="jitter" 
                        stroke={theme.palette.error.main} 
                        strokeWidth={2}
                        name="Jitter (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Qualidade do Sinal - Últimas 24h
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={signalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line 
                        type="monotone" 
                        dataKey="signal" 
                        stroke={theme.palette.success.main} 
                        strokeWidth={2}
                        name="Sinal (dBm)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="snr" 
                        stroke={theme.palette.info.main} 
                        strokeWidth={2}
                        name="SNR (dB)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Device Status Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Status dos Dispositivos
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip label={`${monitoringStats.onlineDevices} Online`} color="success" variant="outlined" />
                <Chip label={`${monitoringStats.warningDevices} Atenção`} color="warning" variant="outlined" />
                <Chip label={`${monitoringStats.offlineDevices} Offline`} color="error" variant="outlined" />
              </Stack>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Uptime</strong></TableCell>
                    <TableCell><strong>Sinal</strong></TableCell>
                    <TableCell><strong>SNR</strong></TableCell>
                    <TableCell><strong>Temperatura</strong></TableCell>
                    <TableCell><strong>CPU</strong></TableCell>
                    <TableCell><strong>Memória</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceStatus.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getDeviceIcon(device.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {device.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {device.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={device.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{<StatusChip status={device.status as MonitoringStatus} />}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {device.uptime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={device.metrics.signal > -25 ? 'success.main' : device.metrics.signal > -30 ? 'warning.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {device.metrics.signal}dBm
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={device.metrics.snr > 20 ? 'success.main' : device.metrics.snr > 15 ? 'warning.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {device.metrics.snr}dB
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={device.metrics.temperature < 50 ? 'success.main' : device.metrics.temperature < 60 ? 'warning.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {device.metrics.temperature}°C
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {device.metrics.cpu}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={device.metrics.cpu} 
                            color={device.metrics.cpu < 70 ? 'success' : device.metrics.cpu < 85 ? 'warning' : 'error'}
                            sx={{ width: 40, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {device.metrics.memory}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={device.metrics.memory} 
                            color={device.metrics.memory < 70 ? 'success' : device.metrics.memory < 85 ? 'warning' : 'error'}
                            sx={{ width: 40, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Settings fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Historical Metrics Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Métricas Históricas
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Análise de Tendências
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise histórica de performance e tendências
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Relatórios Customizados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gere relatórios personalizados de monitoramento
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Settings Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações de Monitoramento
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Configure os parâmetros de monitoramento e alertas automáticos
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Intervalos de Coleta
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Métricas em Tempo Real</InputLabel>
                      <Select defaultValue={30} label="Métricas em Tempo Real">
                        <MenuItem value={10}>10 segundos</MenuItem>
                        <MenuItem value={30}>30 segundos</MenuItem>
                        <MenuItem value={60}>1 minuto</MenuItem>
                        <MenuItem value={300}>5 minutos</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth size="small">
                      <InputLabel>Dados Históricos</InputLabel>
                      <Select defaultValue={300} label="Dados Históricos">
                        <MenuItem value={300}>5 minutos</MenuItem>
                        <MenuItem value={900}>15 minutos</MenuItem>
                        <MenuItem value={1800}>30 minutos</MenuItem>
                        <MenuItem value={3600}>1 hora</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Limites de Alerta
                  </Typography>
                  <Stack spacing={2}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Latência Máxima (ms)" 
                      defaultValue="50"
                      type="number"
                    />
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Perda de Pacotes (%)" 
                      defaultValue="1"
                      type="number"
                    />
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="CPU Máximo (%)" 
                      defaultValue="80"
                      type="number"
                    />
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Temperatura Máxima (°C)" 
                      defaultValue="60"
                      type="number"
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </BerryCard>
    </Box>
  );
};

export default Monitoring;