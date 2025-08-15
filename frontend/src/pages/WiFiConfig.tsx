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
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Wifi,
  Router,
  Security,
  Speed,
  Settings,
  Visibility,
  Edit,
  Delete,
  Add,
  Refresh,
  Download,
  Upload,
  Lock,
  LockOpen,
  SignalWifi4Bar,
  WifiPassword,
  NetworkWifi,
  DeviceHub,
  Schedule,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

// Mock WiFi profiles data
const wifiProfiles = [
  {
    id: 'profile-001',
    name: 'Perfil Residencial Básico',
    ssid: 'RJChronos_Casa',
    security: 'WPA2',
    band: '2.4GHz',
    channel: 'Auto',
    power: 100,
    hidden: false,
    guestNetwork: true,
    status: 'active',
    appliedDevices: 45,
  },
  {
    id: 'profile-002',
    name: 'Perfil Empresarial',
    ssid: 'RJChronos_Corp',
    security: 'WPA3',
    band: '5GHz',
    channel: 36,
    power: 80,
    hidden: true,
    guestNetwork: false,
    status: 'active',
    appliedDevices: 12,
  },
  {
    id: 'profile-003',
    name: 'Perfil Guest',
    ssid: 'RJChronos_Guest',
    security: 'WPA2',
    band: 'Dual',
    channel: 'Auto',
    power: 60,
    hidden: false,
    guestNetwork: true,
    status: 'inactive',
    appliedDevices: 0,
  },
];

const connectedDevices = [
  {
    id: 'cpe-001',
    name: 'CPE Cliente 001',
    customer: 'João Silva',
    currentProfile: 'Perfil Residencial Básico',
    ssid: 'RJChronos_Casa',
    connectedDevices: 8,
    signalStrength: -42,
    status: 'online',
    lastUpdate: '2024-01-15T10:30:00Z',
  },
  {
    id: 'cpe-002',
    name: 'CPE Cliente 002',
    customer: 'Maria Santos',
    currentProfile: 'Perfil Residencial Básico',
    ssid: 'RJChronos_Casa',
    connectedDevices: 12,
    signalStrength: -38,
    status: 'online',
    lastUpdate: '2024-01-15T10:25:00Z',
  },
  {
    id: 'cpe-003',
    name: 'CPE Cliente 003',
    customer: 'Pedro Costa',
    currentProfile: 'Perfil Empresarial',
    ssid: 'RJChronos_Corp',
    connectedDevices: 25,
    signalStrength: -45,
    status: 'warning',
    lastUpdate: '2024-01-15T10:20:00Z',
  },
];

const wifiStats = {
  totalProfiles: wifiProfiles.length,
  activeProfiles: wifiProfiles.filter(p => p.status === 'active').length,
  totalDevices: connectedDevices.length,
  onlineDevices: connectedDevices.filter(d => d.status === 'online').length,
  avgSignal: connectedDevices.reduce((sum, d) => sum + d.signalStrength, 0) / connectedDevices.length,
  totalConnections: connectedDevices.reduce((sum, d) => sum + d.connectedDevices, 0),
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
    active: { label: 'Ativo', color: 'success' as const },
    inactive: { label: 'Inativo', color: 'error' as const },
    online: { label: 'Online', color: 'success' as const },
    offline: { label: 'Offline', color: 'error' as const },
    warning: { label: 'Atenção', color: 'warning' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}

function getSecurityIcon(security: string) {
  switch (security) {
    case 'WPA3': return <Lock color="success" />;
    case 'WPA2': return <Lock color="primary" />;
    case 'WEP': return <LockOpen color="warning" />;
    case 'Open': return <LockOpen color="error" />;
    default: return <Lock />;
  }
}

export default function WiFiConfig() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showApplyProfile, setShowApplyProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    ssid: '',
    security: 'WPA2',
    password: '',
    band: '2.4GHz',
    channel: 'Auto',
    power: 100,
    hidden: false,
    guestNetwork: false,
  });
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateProfile = () => {
    // Implement profile creation logic
    console.log('Creating profile:', newProfile);
    setShowCreateProfile(false);
    setNewProfile({
      name: '',
      ssid: '',
      security: 'WPA2',
      password: '',
      band: '2.4GHz',
      channel: 'Auto',
      power: 100,
      hidden: false,
      guestNetwork: false,
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            📶 Configuração Wi-Fi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerenciamento remoto de perfis e configurações Wi-Fi
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Sincronizar
          </Button>
          
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateProfile(true)}>
            Novo Perfil
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Perfis Ativos"
            value={`${wifiStats.activeProfiles}/${wifiStats.totalProfiles}`}
            subtitle="Configurações em uso"
            color="primary"
            icon={NetworkWifi}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPEs Online"
            value={wifiStats.onlineDevices}
            subtitle="Dispositivos conectados"
            color="success"
            icon={Router}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sinal Médio"
            value={`${wifiStats.avgSignal.toFixed(1)}dBm`}
            subtitle="Qualidade do sinal"
            color="warning"
            icon={SignalWifi4Bar}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conexões Ativas"
            value={wifiStats.totalConnections}
            subtitle="Dispositivos conectados"
            color="secondary"
            icon={DeviceHub}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="📋 Perfis Wi-Fi" />
            <Tab label="🔌 Dispositivos" />
            <Tab label="📊 Monitoramento" />
            <Tab label="⚙️ Configurações" />
          </Tabs>
        </Box>

        {/* WiFi Profiles Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Perfis de Configuração Wi-Fi
              </Typography>
              <Chip label={`${wifiProfiles.length} perfis`} color="primary" variant="outlined" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome do Perfil</strong></TableCell>
                    <TableCell><strong>SSID</strong></TableCell>
                    <TableCell><strong>Segurança</strong></TableCell>
                    <TableCell><strong>Banda</strong></TableCell>
                    <TableCell><strong>Canal</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Dispositivos</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wifiProfiles.map((profile) => (
                    <TableRow key={profile.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {profile.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Wifi fontSize="small" />
                          {profile.ssid}
                          {profile.hidden && <Tooltip title="Rede oculta"><Visibility fontSize="small" /></Tooltip>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSecurityIcon(profile.security)}
                          {profile.security}
                        </Box>
                      </TableCell>
                      <TableCell>{profile.band}</TableCell>
                      <TableCell>{profile.channel}</TableCell>
                      <TableCell>{getStatusChip(profile.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {profile.appliedDevices}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary" onClick={() => setShowApplyProfile(true)}>
                            <Upload fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
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

        {/* Devices Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                CPEs com Wi-Fi Configurado
              </Typography>
              <Chip label={`${connectedDevices.length} dispositivos`} color="primary" variant="outlined" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Perfil Atual</strong></TableCell>
                    <TableCell><strong>SSID</strong></TableCell>
                    <TableCell><strong>Conexões</strong></TableCell>
                    <TableCell><strong>Sinal</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connectedDevices.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {device.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.customer}</TableCell>
                      <TableCell>{device.currentProfile}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Wifi fontSize="small" />
                          {device.ssid}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {device.connectedDevices}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={device.signalStrength > -50 ? 'success.main' : 'warning.main'}
                          fontWeight={600}
                        >
                          {device.signalStrength}dBm
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(device.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Settings fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Refresh fontSize="small" />
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

        {/* Monitoring Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Monitoramento Wi-Fi em Tempo Real
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Estatísticas de uso e performance das redes Wi-Fi
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <SignalWifi4Bar sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Qualidade do Sinal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitoramento em tempo real da qualidade do sinal Wi-Fi
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Speed sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Throughput
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise de velocidade e throughput das conexões Wi-Fi
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
              Configurações Globais Wi-Fi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configurações gerais para todos os perfis Wi-Fi
            </Typography>
            
            <Stack spacing={3}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Aplicar configurações automaticamente"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Backup automático de configurações"
              />
              <FormControlLabel
                control={<Switch />}
                label="Notificações de mudanças"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Monitoramento contínuo"
              />
            </Stack>
          </CardContent>
        )}
      </Card>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateProfile} onClose={() => setShowCreateProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Perfil Wi-Fi</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Perfil"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SSID"
                value={newProfile.ssid}
                onChange={(e) => setNewProfile({ ...newProfile, ssid: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Segurança</InputLabel>
                <Select
                  value={newProfile.security}
                  label="Segurança"
                  onChange={(e) => setNewProfile({ ...newProfile, security: e.target.value })}
                >
                  <MenuItem value="WPA3">WPA3</MenuItem>
                  <MenuItem value="WPA2">WPA2</MenuItem>
                  <MenuItem value="WEP">WEP</MenuItem>
                  <MenuItem value="Open">Aberta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={newProfile.password}
                onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Banda</InputLabel>
                <Select
                  value={newProfile.band}
                  label="Banda"
                  onChange={(e) => setNewProfile({ ...newProfile, band: e.target.value })}
                >
                  <MenuItem value="2.4GHz">2.4GHz</MenuItem>
                  <MenuItem value="5GHz">5GHz</MenuItem>
                  <MenuItem value="Dual">Dual Band</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Canal"
                value={newProfile.channel}
                onChange={(e) => setNewProfile({ ...newProfile, channel: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Potência (%)"
                type="number"
                value={newProfile.power}
                onChange={(e) => setNewProfile({ ...newProfile, power: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newProfile.hidden}
                    onChange={(e) => setNewProfile({ ...newProfile, hidden: e.target.checked })}
                  />
                }
                label="Rede oculta"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newProfile.guestNetwork}
                    onChange={(e) => setNewProfile({ ...newProfile, guestNetwork: e.target.checked })}
                  />
                }
                label="Rede para convidados"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateProfile(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateProfile}>Criar Perfil</Button>
        </DialogActions>
      </Dialog>

      {/* Apply Profile Dialog */}
      <Dialog open={showApplyProfile} onClose={() => setShowApplyProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aplicar Perfil Wi-Fi</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione os dispositivos onde deseja aplicar este perfil:
          </Typography>
          {/* Device selection would go here */}
          <Typography variant="body2">
            Esta funcionalidade será implementada para seleção de dispositivos específicos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApplyProfile(false)}>Cancelar</Button>
          <Button variant="contained">Aplicar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
