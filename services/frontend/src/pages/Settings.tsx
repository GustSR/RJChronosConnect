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
  Paper,
  Divider,
  Stack,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Settings,
  Person,
  Security,
  Notifications,
  Storage,
  Backup,
  Update,
  Visibility,
  Edit,
  Delete,
  Add,
  Save,
  Refresh,
  Download,
  Upload,
  Lock,
  Key,
  Shield,
  Email,
  Sms,
  Webhook,
  Api,
  Database,
  Cloud,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';

// Mock settings data
const systemSettings = {
  general: {
    systemName: 'RJChronos Network Management',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    theme: 'dark',
    autoBackup: true,
    maintenanceMode: false,
  },
  security: {
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordPolicy: 'strong',
    apiRateLimit: 1000,
    encryptionEnabled: true,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    webhookEnabled: true,
    alertThreshold: 'medium',
    dailyReports: true,
  },
  integrations: {
    genieACS: { enabled: true, url: 'http://localhost:7547', status: 'connected' },
    prometheus: { enabled: true, url: 'http://localhost:9090', status: 'connected' },
    grafana: { enabled: false, url: '', status: 'disconnected' },
    slack: { enabled: true, webhook: 'https://hooks.slack.com/...', status: 'connected' },
  },
};

const userAccounts = [
  {
    id: 'user-001',
    name: 'Admin User',
    email: 'admin@rjchronos.com',
    role: 'administrator',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    twoFA: true,
  },
  {
    id: 'user-002',
    name: 'Operador 1',
    email: 'op1@rjchronos.com',
    role: 'operator',
    status: 'active',
    lastLogin: '2024-01-15T09:15:00Z',
    twoFA: false,
  },
  {
    id: 'user-003',
    name: 'Técnico 1',
    email: 'tech1@rjchronos.com',
    role: 'technician',
    status: 'inactive',
    lastLogin: '2024-01-14T16:45:00Z',
    twoFA: true,
  },
];

const backupHistory = [
  {
    id: 'backup-001',
    type: 'automatic',
    timestamp: '2024-01-15T02:00:00Z',
    size: '2.3 GB',
    status: 'completed',
    duration: '15 min',
  },
  {
    id: 'backup-002',
    type: 'manual',
    timestamp: '2024-01-14T14:30:00Z',
    size: '2.1 GB',
    status: 'completed',
    duration: '12 min',
  },
  {
    id: 'backup-003',
    type: 'automatic',
    timestamp: '2024-01-14T02:00:00Z',
    size: '2.2 GB',
    status: 'failed',
    duration: '8 min',
  },
];

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
    connected: { label: 'Conectado', color: 'success' as const },
    disconnected: { label: 'Desconectado', color: 'error' as const },
    completed: { label: 'Concluído', color: 'success' as const },
    failed: { label: 'Falhou', color: 'error' as const },
    pending: { label: 'Pendente', color: 'warning' as const },
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

function getRoleChip(role: string) {
  const roleConfig = {
    administrator: { label: 'Administrador', color: 'error' as const },
    operator: { label: 'Operador', color: 'primary' as const },
    technician: { label: 'Técnico', color: 'secondary' as const },
    viewer: { label: 'Visualizador', color: 'default' as const },
  };
  
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [settings, setSettings] = useState(systemSettings);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            ⚙️ Configurações do Sistema
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerenciamento de configurações, usuários e integrações
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Backup />} onClick={() => setShowBackupDialog(true)}>
            Backup
          </Button>
          
          <Button variant="contained" startIcon={<Save />}>
            Salvar Alterações
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Usuários Ativos"
            value={userAccounts.filter(u => u.status === 'active').length}
            subtitle="Contas habilitadas"
            color="primary"
            icon={Person}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Integrações"
            value={Object.values(systemSettings.integrations).filter(i => i.enabled).length}
            subtitle="Serviços conectados"
            color="success"
            icon={Api}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Último Backup"
            value="2h atrás"
            subtitle="Backup automático"
            color="warning"
            icon={Backup}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Segurança"
            value="Alta"
            subtitle="2FA habilitado"
            color="error"
            icon={Security}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="🔧 Geral" />
            <Tab label="🔒 Segurança" />
            <Tab label="👥 Usuários" />
            <Tab label="🔔 Notificações" />
            <Tab label="🔗 Integrações" />
            <Tab label="💾 Backup" />
          </Tabs>
        </Box>

        {/* General Settings Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações Gerais
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Sistema"
                  value={settings.general.systemName}
                  onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Fuso Horário</InputLabel>
                  <Select
                    value={settings.general.timezone}
                    label="Fuso Horário"
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <MenuItem value="America/Sao_Paulo">São Paulo (UTC-3)</MenuItem>
                    <MenuItem value="America/New_York">New York (UTC-5)</MenuItem>
                    <MenuItem value="Europe/London">London (UTC+0)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Idioma</InputLabel>
                  <Select
                    value={settings.general.language}
                    label="Idioma"
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  >
                    <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                    <MenuItem value="en-US">English (US)</MenuItem>
                    <MenuItem value="es-ES">Español</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tema</InputLabel>
                  <Select
                    value={settings.general.theme}
                    label="Tema"
                    onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                  >
                    <MenuItem value="dark">Escuro</MenuItem>
                    <MenuItem value="light">Claro</MenuItem>
                    <MenuItem value="auto">Automático</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.autoBackup}
                        onChange={(e) => handleSettingChange('general', 'autoBackup', e.target.checked)}
                      />
                    }
                    label="Backup automático diário"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                      />
                    }
                    label="Modo de manutenção"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Security Settings Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações de Segurança
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Configurações de segurança afetam todos os usuários do sistema
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timeout de Sessão (minutos)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Limite de Rate API (req/min)"
                  type="number"
                  value={settings.security.apiRateLimit}
                  onChange={(e) => handleSettingChange('security', 'apiRateLimit', parseInt(e.target.value))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Política de Senha</InputLabel>
                  <Select
                    value={settings.security.passwordPolicy}
                    label="Política de Senha"
                    onChange={(e) => handleSettingChange('security', 'passwordPolicy', e.target.value)}
                  >
                    <MenuItem value="weak">Fraca</MenuItem>
                    <MenuItem value="medium">Média</MenuItem>
                    <MenuItem value="strong">Forte</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      />
                    }
                    label="Autenticação de dois fatores obrigatória"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.encryptionEnabled}
                        onChange={(e) => handleSettingChange('security', 'encryptionEnabled', e.target.checked)}
                      />
                    }
                    label="Criptografia de dados habilitada"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Users Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Gerenciamento de Usuários
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateUser(true)}>
                Novo Usuário
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Função</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>2FA</strong></TableCell>
                    <TableCell><strong>Último Login</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userAccounts.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        {user.twoFA ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Error color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(user.lastLogin).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Edit fontSize="small" />
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

        {/* Notifications Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações de Notificações
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Canais de Notificação
                    </Typography>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.emailEnabled}
                            onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                          />
                        }
                        label="Notificações por Email"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.smsEnabled}
                            onChange={(e) => handleSettingChange('notifications', 'smsEnabled', e.target.checked)}
                          />
                        }
                        label="Notificações por SMS"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.webhookEnabled}
                            onChange={(e) => handleSettingChange('notifications', 'webhookEnabled', e.target.checked)}
                          />
                        }
                        label="Webhooks"
                      />
                    </Stack>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Configurações de Alerta
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Nível de Alerta</InputLabel>
                          <Select
                            value={settings.notifications.alertThreshold}
                            label="Nível de Alerta"
                            onChange={(e) => handleSettingChange('notifications', 'alertThreshold', e.target.value)}
                          >
                            <MenuItem value="low">Baixo</MenuItem>
                            <MenuItem value="medium">Médio</MenuItem>
                            <MenuItem value="high">Alto</MenuItem>
                            <MenuItem value="critical">Crítico</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.dailyReports}
                          onChange={(e) => handleSettingChange('notifications', 'dailyReports', e.target.checked)}
                        />
                      }
                      label="Relatórios diários automáticos"
                    />
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Integrations Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Integrações de Sistema
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {Object.entries(settings.integrations).map(([key, integration]) => (
                <Grid item xs={12} md={6} key={key}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        {getStatusChip(integration.status)}
                      </Box>
                      
                      <TextField
                        fullWidth
                        label="URL"
                        value={integration.url}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <FormControlLabel
                        control={<Switch checked={integration.enabled} />}
                        label="Habilitado"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Backup Tab */}
        {tabValue === 5 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Backup e Restauração
              </Typography>
              <Button variant="contained" startIcon={<Backup />} onClick={() => setShowBackupDialog(true)}>
                Criar Backup
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Tamanho</strong></TableCell>
                    <TableCell><strong>Duração</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id} hover>
                      <TableCell>
                        <Chip
                          label={backup.type}
                          color={backup.type === 'automatic' ? 'primary' : 'secondary'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(backup.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{backup.duration}</TableCell>
                      <TableCell>{getStatusChip(backup.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Download fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
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
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onClose={() => setShowCreateUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome Completo" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select defaultValue="viewer" label="Função">
                  <MenuItem value="administrator">Administrador</MenuItem>
                  <MenuItem value="operator">Operador</MenuItem>
                  <MenuItem value="technician">Técnico</MenuItem>
                  <MenuItem value="viewer">Visualizador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Senha Temporária" type="password" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateUser(false)}>Cancelar</Button>
          <Button variant="contained">Criar Usuário</Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Backup Manual</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione os dados que deseja incluir no backup:
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel control={<Switch defaultChecked />} label="Configurações do sistema" />
            <FormControlLabel control={<Switch defaultChecked />} label="Dados de usuários" />
            <FormControlLabel control={<Switch defaultChecked />} label="Histórico de alertas" />
            <FormControlLabel control={<Switch defaultChecked />} label="Configurações de dispositivos" />
            <FormControlLabel control={<Switch />} label="Logs do sistema" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBackupDialog(false)}>Cancelar</Button>
          <Button variant="contained">Iniciar Backup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
