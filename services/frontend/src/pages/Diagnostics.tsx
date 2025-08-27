import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  useTheme,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Divider,
  Stack,
  Tooltip,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  BugReport,
  NetworkCheck,
  Speed,
  Wifi,
  Router,
  Devices,
  PlayArrow,
  Stop,
  Refresh,
  Download,
  Visibility,
  Edit,
  Delete,
  Add,
  Timeline,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  SignalWifi4Bar,
  Storage,
  Memory,
  Thermostat,
} from '@mui/icons-material';

// Mock diagnostics data
const diagnosticTests = [
  {
    id: 'test-001',
    name: 'Teste de Conectividade',
    type: 'ping',
    description: 'Verifica conectividade básica com o dispositivo',
    duration: '30s',
    lastRun: '2024-01-15T10:30:00Z',
    status: 'completed',
    result: 'success',
  },
  {
    id: 'test-002',
    name: 'Teste de Velocidade',
    type: 'speedtest',
    description: 'Mede velocidade de download e upload',
    duration: '2min',
    lastRun: '2024-01-15T10:25:00Z',
    status: 'completed',
    result: 'success',
  },
  {
    id: 'test-003',
    name: 'Traceroute',
    type: 'traceroute',
    description: 'Rastreia rota de pacotes até o destino',
    duration: '45s',
    lastRun: '2024-01-15T10:20:00Z',
    status: 'completed',
    result: 'warning',
  },
  {
    id: 'test-004',
    name: 'Diagnóstico Wi-Fi',
    type: 'wifi',
    description: 'Analisa qualidade e configuração Wi-Fi',
    duration: '1min',
    lastRun: '2024-01-15T10:15:00Z',
    status: 'failed',
    result: 'error',
  },
];

const deviceDiagnostics = [
  {
    id: 'cpe-001',
    name: 'CPE Cliente 001',
    customer: 'João Silva',
    status: 'online',
    lastDiagnostic: '2024-01-15T10:30:00Z',
    ping: { latency: 12, packetLoss: 0, status: 'success' },
    speedtest: { download: 95.2, upload: 48.7, status: 'success' },
    wifi: { signal: -42, clients: 8, status: 'success' },
    system: { cpu: 25, memory: 45, temperature: 42, status: 'success' },
  },
  {
    id: 'cpe-002',
    name: 'CPE Cliente 002',
    customer: 'Maria Santos',
    status: 'online',
    lastDiagnostic: '2024-01-15T10:25:00Z',
    ping: { latency: 15, packetLoss: 0, status: 'success' },
    speedtest: { download: 187.5, upload: 95.3, status: 'success' },
    wifi: { signal: -38, clients: 12, status: 'success' },
    system: { cpu: 18, memory: 38, temperature: 39, status: 'success' },
  },
  {
    id: 'cpe-003',
    name: 'CPE Cliente 003',
    customer: 'Pedro Costa',
    status: 'warning',
    lastDiagnostic: '2024-01-15T10:20:00Z',
    ping: { latency: 45, packetLoss: 2, status: 'warning' },
    speedtest: { download: 78.3, upload: 35.2, status: 'warning' },
    wifi: { signal: -52, clients: 6, status: 'warning' },
    system: { cpu: 78, memory: 85, temperature: 58, status: 'warning' },
  },
];

const diagnosticHistory = [
  {
    id: 'diag-001',
    device: 'CPE-001',
    test: 'Teste Completo',
    timestamp: '2024-01-15T10:30:00Z',
    duration: '3min 45s',
    status: 'completed',
    result: 'success',
    issues: 0,
  },
  {
    id: 'diag-002',
    device: 'CPE-002',
    test: 'Teste de Velocidade',
    timestamp: '2024-01-15T10:25:00Z',
    duration: '2min 15s',
    status: 'completed',
    result: 'success',
    issues: 0,
  },
  {
    id: 'diag-003',
    device: 'CPE-003',
    test: 'Diagnóstico Wi-Fi',
    timestamp: '2024-01-15T10:20:00Z',
    duration: '1min 30s',
    status: 'completed',
    result: 'warning',
    issues: 2,
  },
];

const diagnosticStats = {
  totalTests: diagnosticTests.length,
  successfulTests: diagnosticTests.filter(t => t.result === 'success').length,
  warningTests: diagnosticTests.filter(t => t.result === 'warning').length,
  failedTests: diagnosticTests.filter(t => t.result === 'error').length,
  devicesOnline: deviceDiagnostics.filter(d => d.status === 'online').length,
  avgLatency: deviceDiagnostics.reduce((sum, d) => sum + d.ping.latency, 0) / deviceDiagnostics.length,
};

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon: React.ElementType;
}

function MetricCard({ title, value, subtitle, color, icon: Icon }: MetricCardProps) {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}05 100%)`,
        border: `1px solid ${theme.palette[color].main}20`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            <Icon />
          </Avatar>
        </Box>
        
        <Typography variant="h3" fontWeight={700} color={`${color}.main`} gutterBottom>
          {value}
        </Typography>
        
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getStatusChip(status: string) {
  const statusConfig = {
    success: { label: 'Sucesso', color: 'success' as const },
    warning: { label: 'Atenção', color: 'warning' as const },
    error: { label: 'Erro', color: 'error' as const },
    running: { label: 'Executando', color: 'primary' as const },
    completed: { label: 'Concluído', color: 'success' as const },
    failed: { label: 'Falhou', color: 'error' as const },
    online: { label: 'Online', color: 'success' as const },
    offline: { label: 'Offline', color: 'error' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}

function getTestIcon(type: string) {
  switch (type) {
    case 'ping': return <NetworkCheck />;
    case 'speedtest': return <Speed />;
    case 'traceroute': return <Timeline />;
    case 'wifi': return <Wifi />;
    default: return <BugReport />;
  }
}

export default function Diagnostics() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showRunTest, setShowRunTest] = useState(false);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRunTest = (testId: string) => {
    setRunningTest(testId);
    setTestProgress(0);
    
    // Simulate test execution
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunningTest(null);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🔧 Diagnósticos Remotos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Testes automatizados e diagnósticos de rede
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
          
          <Button variant="contained" startIcon={<PlayArrow />} onClick={() => setShowRunTest(true)}>
            Executar Teste
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Testes Executados"
            value={diagnosticStats.totalTests}
            subtitle="Diagnósticos disponíveis"
            color="primary"
            icon={BugReport}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Sucesso"
            value={`${Math.round((diagnosticStats.successfulTests/diagnosticStats.totalTests)*100)}%`}
            subtitle="Testes bem-sucedidos"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Dispositivos Online"
            value={diagnosticStats.devicesOnline}
            subtitle="Disponíveis para teste"
            color="secondary"
            icon={Devices}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Latência Média"
            value={`${diagnosticStats.avgLatency.toFixed(1)}ms`}
            subtitle="Performance da rede"
            color="warning"
            icon={Speed}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="🧪 Testes Disponíveis" />
            <Tab label="🔌 Dispositivos" />
            <Tab label="📊 Resultados" />
            <Tab label="📈 Histórico" />
          </Tabs>
        </Box>

        {/* Available Tests Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Testes de Diagnóstico Disponíveis
              </Typography>
              <Chip label={`${diagnosticTests.length} testes`} color="primary" variant="outlined" />
            </Box>
            
            <Grid container spacing={3}>
              {diagnosticTests.map((test) => (
                <Grid item xs={12} md={6} lg={4} key={test.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getTestIcon(test.type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {test.name}
                          </Typography>
                          {getStatusChip(test.result)}
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {test.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Duração: {test.duration}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Último: {new Date(test.lastRun).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {runningTest === test.id && (
                        <Box sx={{ mb: 2 }}>
                          <LinearProgress variant="determinate" value={testProgress} />
                          <Typography variant="caption" color="text.secondary">
                            Executando... {testProgress}%
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => handleRunTest(test.id)}
                          disabled={runningTest === test.id}
                          fullWidth
                        >
                          {runningTest === test.id ? 'Executando...' : 'Executar'}
                        </Button>
                        <IconButton size="small" color="primary">
                          <Visibility />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Devices Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Status dos Dispositivos
              </Typography>
              <Chip label={`${deviceDiagnostics.length} dispositivos`} color="primary" variant="outlined" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Ping</strong></TableCell>
                    <TableCell><strong>Velocidade</strong></TableCell>
                    <TableCell><strong>Wi-Fi</strong></TableCell>
                    <TableCell><strong>Sistema</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceDiagnostics.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {device.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.customer}</TableCell>
                      <TableCell>{getStatusChip(device.status)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color={device.ping.status === 'success' ? 'success.main' : 'warning.main'}>
                            {device.ping.latency}ms
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {device.ping.packetLoss}% perda
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color={device.speedtest.status === 'success' ? 'success.main' : 'warning.main'}>
                            ↓{device.speedtest.download}Mbps
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            ↑{device.speedtest.upload}Mbps
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color={device.wifi.status === 'success' ? 'success.main' : 'warning.main'}>
                            {device.wifi.signal}dBm
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {device.wifi.clients} clientes
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color={device.system.status === 'success' ? 'success.main' : 'warning.main'}>
                            CPU: {device.system.cpu}%
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {device.system.temperature}°C
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <PlayArrow fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Visibility fontSize="small" />
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

        {/* Results Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Resultados dos Diagnósticos
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Performance Geral
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise consolidada de todos os testes executados
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Problemas Detectados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dispositivos que requerem atenção
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* History Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Histórico de Diagnósticos
              </Typography>
              <Chip label={`${diagnosticHistory.length} execuções`} color="primary" variant="outlined" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Teste</strong></TableCell>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Duração</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Resultado</strong></TableCell>
                    <TableCell><strong>Problemas</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {diagnosticHistory.map((history) => (
                    <TableRow key={history.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {history.device}
                        </Typography>
                      </TableCell>
                      <TableCell>{history.test}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(history.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>{history.duration}</TableCell>
                      <TableCell>{getStatusChip(history.status)}</TableCell>
                      <TableCell>{getStatusChip(history.result)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={history.issues > 0 ? 'warning.main' : 'success.main'}>
                          {history.issues}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Download fontSize="small" />
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
      </Card>

      {/* Run Test Dialog */}
      <Dialog open={showRunTest} onClose={() => setShowRunTest(false)} maxWidth="md" fullWidth>
        <DialogTitle>Executar Diagnóstico</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Dispositivo</InputLabel>
                <Select defaultValue="" label="Dispositivo">
                  {deviceDiagnostics.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name} - {device.customer}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Teste</InputLabel>
                <Select defaultValue="" label="Tipo de Teste">
                  {diagnosticTests.map((test) => (
                    <MenuItem key={test.id} value={test.id}>
                      {test.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações (opcional)"
                multiline
                rows={3}
                placeholder="Adicione observações sobre este diagnóstico..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRunTest(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<PlayArrow />}>Executar Diagnóstico</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
