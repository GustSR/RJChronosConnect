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
  Alert,
  Badge,
  Menu,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Visibility,
  Edit,
  Delete,
  Add,
  NotificationsActive,
  FilterList,
  Refresh,
  MarkEmailRead,
  Schedule,
  TrendingUp,
  Search,
  MoreVert,
  Close,
  Person,
  AccessTime,
  Notifications,
  Settings,
} from '@mui/icons-material';

// Mock alerts data
const mockAlerts = [
  {
    id: 'alert-001',
    type: 'critical' as const,
    title: 'CPE Offline - Cliente Premium',
    description: 'CPE-001 não responde há 15 minutos. Cliente premium afetado.',
    device: 'CPE-001',
    timestamp: '2024-01-15T10:30:00Z',
    acknowledged: false,
    severity: 'high' as const,
    category: 'device' as const,
  },
  {
    id: 'alert-002',
    type: 'warning' as const,
    title: 'Sinal Óptico Baixo',
    description: 'ONU-005 apresenta sinal óptico de -28dBm, abaixo do recomendado.',
    device: 'ONU-005',
    timestamp: '2024-01-15T10:25:00Z',
    acknowledged: true,
    acknowledgedBy: 'João Silva',
    acknowledgedAt: '2024-01-15T10:27:00Z',
    severity: 'medium' as const,
    category: 'network' as const,
  },
  {
    id: 'alert-003',
    type: 'info' as const,
    title: 'Backup Concluído',
    description: 'Backup automático das configurações foi concluído com sucesso.',
    device: 'Sistema',
    timestamp: '2024-01-15T02:00:00Z',
    acknowledged: true,
    acknowledgedBy: 'Sistema',
    acknowledgedAt: '2024-01-15T02:01:00Z',
    severity: 'low' as const,
    category: 'performance' as const,
  },
  {
    id: 'alert-004',
    type: 'critical' as const,
    title: 'Tentativa de Acesso Não Autorizado',
    description: 'Múltiplas tentativas de login falharam para o usuário admin.',
    device: 'Sistema',
    timestamp: '2024-01-15T09:45:00Z',
    acknowledged: false,
    severity: 'high' as const,
    category: 'security' as const,
  },
];

interface AlertType {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  device: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  severity: 'high' | 'medium' | 'low';
  category: 'network' | 'device' | 'security' | 'performance';
}

const alertStats = {
  total: mockAlerts.length,
  critical: mockAlerts.filter(a => a.type === 'critical').length,
  warning: mockAlerts.filter(a => a.type === 'warning').length,
  unacknowledged: mockAlerts.filter(a => !a.acknowledged).length,
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

function getStatusChip(type: string) {
  const statusConfig = {
    critical: { label: 'Crítico', color: 'error' as const },
    warning: { label: 'Atenção', color: 'warning' as const },
    info: { label: 'Info', color: 'info' as const },
    success: { label: 'Sucesso', color: 'success' as const },
  };
  
  const config = statusConfig[type as keyof typeof statusConfig] || statusConfig.info;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}

function getSeverityChip(severity: string) {
  const severityConfig = {
    high: { label: 'Alta', color: 'error' as const },
    medium: { label: 'Média', color: 'warning' as const },
    low: { label: 'Baixa', color: 'success' as const },
  };
  
  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'critical': return <Error />;
    case 'warning': return <Warning />;
    case 'info': return <Info />;
    case 'success': return <CheckCircle />;
    default: return <Info />;
  }
}

export default function Alerts() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAlertForMenu, setSelectedAlertForMenu] = useState<AlertType | null>(null);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, alert: AlertType) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlertForMenu(alert);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlertForMenu(null);
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedBy: 'Usuário Atual', acknowledgedAt: new Date().toISOString() }
        : alert
    ));
    handleMenuClose();
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    handleMenuClose();
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.device.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'acknowledged' && alert.acknowledged) ||
                         (statusFilter === 'unacknowledged' && !alert.acknowledged);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🚨 Alertas do Sistema
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitoramento e gerenciamento de alertas da rede
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
          
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateAlert(true)}>
            Novo Alerta
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Alertas"
            value={alertStats.total}
            subtitle="Alertas no sistema"
            color="primary"
            icon={NotificationsActive}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Críticos"
            value={alertStats.critical}
            subtitle="Requerem ação imediata"
            color="error"
            icon={Error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avisos"
            value={alertStats.warning}
            subtitle="Atenção necessária"
            color="warning"
            icon={Warning}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Não Reconhecidos"
            value={alertStats.unacknowledged}
            subtitle="Aguardando reconhecimento"
            color="secondary"
            icon={Schedule}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="🔔 Alertas Ativos" />
            <Tab label="📊 Estatísticas" />
            <Tab label="⚙️ Configurações" />
          </Tabs>
        </Box>

        {/* Active Alerts Tab */}
        {tabValue === 0 && (
          <CardContent>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 250 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Tipo"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="critical">Crítico</MenuItem>
                  <MenuItem value="warning">Atenção</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Sucesso</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="acknowledged">Reconhecidos</MenuItem>
                  <MenuItem value="unacknowledged">Não Reconhecidos</MenuItem>
                </Select>
              </FormControl>
              
              <Button variant="outlined" startIcon={<FilterList />}>
                Filtros Avançados
              </Button>
            </Box>

            {/* Alerts Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Título</strong></TableCell>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Severidade</strong></TableCell>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: `${alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}.main` }}>
                            {getAlertIcon(alert.type)}
                          </Avatar>
                          {getStatusChip(alert.type)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {alert.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {alert.device}
                        </Typography>
                      </TableCell>
                      <TableCell>{getSeverityChip(alert.severity)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {alert.acknowledged ? (
                          <Box>
                            <Chip label="Reconhecido" color="success" size="small" />
                            <Typography variant="caption" display="block" color="text.secondary">
                              por {alert.acknowledgedBy}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip label="Pendente" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary" onClick={() => setSelectedAlert(alert)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={(e) => handleMenuClick(e, alert)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredAlerts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum alerta encontrado com os filtros aplicados.
                </Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* Statistics Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Estatísticas de Alertas
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Tendências
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise de tendências dos alertas
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Histórico
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Histórico detalhado de alertas
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Settings Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações de Alertas
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Configure as regras e notificações para os alertas do sistema
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Notificações
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure como e quando receber notificações
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Regras de Alerta
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Defina regras personalizadas para geração de alertas
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedAlertForMenu && handleAcknowledge(selectedAlertForMenu.id)}>
          <CheckCircle sx={{ mr: 1 }} fontSize="small" />
          Reconhecer
        </MenuItem>
        <MenuItem onClick={() => selectedAlertForMenu && setSelectedAlert(selectedAlertForMenu)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          Ver Detalhes
        </MenuItem>
        <MenuItem onClick={() => selectedAlertForMenu && handleDeleteAlert(selectedAlertForMenu.id)}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Excluir
        </MenuItem>
      </Menu>

      {/* Alert Details Dialog */}
      <Dialog open={Boolean(selectedAlert)} onClose={() => setSelectedAlert(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Detalhes do Alerta
            <IconButton onClick={() => setSelectedAlert(null)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${selectedAlert.type === 'critical' ? 'error' : selectedAlert.type === 'warning' ? 'warning' : 'info'}.main` }}>
                    {getAlertIcon(selectedAlert.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedAlert.title}
                    </Typography>
                    {getStatusChip(selectedAlert.type)}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Descrição:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedAlert.description}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Dispositivo:</strong> {selectedAlert.device}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Categoria:</strong> {selectedAlert.category}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Severidade:</strong> {getSeverityChip(selectedAlert.severity)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Data/Hora:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>
              </Grid>
              
              {selectedAlert.acknowledged && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Reconhecido por:</strong> {selectedAlert.acknowledgedBy}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Reconhecido em:</strong> {selectedAlert.acknowledgedAt && new Date(selectedAlert.acknowledgedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAlert && !selectedAlert.acknowledged && (
            <Button 
              variant="contained" 
              startIcon={<CheckCircle />}
              onClick={() => {
                handleAcknowledge(selectedAlert.id);
                setSelectedAlert(null);
              }}
            >
              Reconhecer
            </Button>
          )}
          <Button onClick={() => setSelectedAlert(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateAlert} onClose={() => setShowCreateAlert(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Alerta</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Título" />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Descrição" 
                multiline 
                rows={3}
                placeholder="Descreva o alerta..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select defaultValue="" label="Tipo">
                  <MenuItem value="critical">Crítico</MenuItem>
                  <MenuItem value="warning">Atenção</MenuItem>
                  <MenuItem value="info">Informação</MenuItem>
                  <MenuItem value="success">Sucesso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severidade</InputLabel>
                <Select defaultValue="" label="Severidade">
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="low">Baixa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Dispositivo" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select defaultValue="" label="Categoria">
                  <MenuItem value="network">Rede</MenuItem>
                  <MenuItem value="device">Dispositivo</MenuItem>
                  <MenuItem value="security">Segurança</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateAlert(false)}>Cancelar</Button>
          <Button variant="contained">Criar Alerta</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
