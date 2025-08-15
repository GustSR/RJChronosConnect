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
  Assessment,
  TrendingUp,
  TrendingDown,
  Analytics,
  People,
  Wifi,
  SignalWifi4Bar,
  Schedule,
  Description,
  PieChart,
  Timeline,
  FilterList,
  Refresh,
  Add,
  Download,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  CalendarToday,
  Email,
  Settings,
  BarChart,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// Report interface
interface ReportType {
  id: string;
  name: string;
  description: string;
  type: 'sla' | 'performance' | 'inventory' | 'alerts' | 'custom';
  category: 'operational' | 'executive' | 'technical';
  schedule?: 'daily' | 'weekly' | 'monthly';
  lastGenerated?: string;
  recipients: string[];
  status: 'completed' | 'pending' | 'failed';
}

// Mock reports data
const mockReports: ReportType[] = [
  {
    id: 'report-001',
    name: 'Relatório SLA Mensal',
    description: 'Análise de SLA e disponibilidade dos serviços',
    type: 'sla' as const,
    category: 'operational' as const,
    schedule: 'monthly' as const,
    lastGenerated: '2024-01-15T08:00:00Z',
    recipients: ['admin@empresa.com', 'tecnico@empresa.com'],
    status: 'completed' as const,
  },
  {
    id: 'report-002',
    name: 'Performance de Rede',
    description: 'Métricas de performance e latência da rede',
    type: 'performance' as const,
    category: 'technical' as const,
    schedule: 'weekly' as const,
    lastGenerated: '2024-01-14T06:00:00Z',
    recipients: ['rede@empresa.com'],
    status: 'completed' as const,
  },
  {
    id: 'report-003',
    name: 'Inventário de Dispositivos',
    description: 'Status e localização de todos os dispositivos',
    type: 'inventory' as const,
    category: 'operational' as const,
    schedule: 'daily' as const,
    lastGenerated: '2024-01-15T02:00:00Z',
    recipients: ['inventario@empresa.com'],
    status: 'completed' as const,
  },
  {
    id: 'report-004',
    name: 'Relatório de Alertas',
    description: 'Resumo de alertas críticos e resoluções',
    type: 'alerts' as const,
    category: 'executive' as const,
    schedule: 'weekly' as const,
    lastGenerated: '2024-01-13T09:00:00Z',
    recipients: ['diretoria@empresa.com'],
    status: 'pending' as const,
  },
];

// Mock chart data
const slaData = [
  { month: 'Jan', sla: 99.8, target: 99.5 },
  { month: 'Fev', sla: 99.2, target: 99.5 },
  { month: 'Mar', sla: 99.9, target: 99.5 },
  { month: 'Abr', sla: 99.6, target: 99.5 },
  { month: 'Mai', sla: 99.7, target: 99.5 },
  { month: 'Jun', sla: 99.4, target: 99.5 },
];

const performanceData = [
  { time: '00:00', latency: 12, throughput: 95 },
  { time: '04:00', latency: 8, throughput: 98 },
  { time: '08:00', latency: 15, throughput: 92 },
  { time: '12:00', latency: 18, throughput: 88 },
  { time: '16:00', latency: 22, throughput: 85 },
  { time: '20:00', latency: 16, throughput: 90 },
];

const deviceStatusData = [
  { name: 'Online', value: 85, color: '#4caf50' },
  { name: 'Offline', value: 8, color: '#f44336' },
  { name: 'Manutenção', value: 7, color: '#ff9800' },
];

interface ReportType {
  id: string;
  name: string;
  description: string;
  type: 'sla' | 'performance' | 'inventory' | 'alerts' | 'custom';
  category: 'operational' | 'executive' | 'technical';
  schedule?: 'daily' | 'weekly' | 'monthly';
  lastGenerated?: string;
  recipients: string[];
  status: 'completed' | 'pending' | 'failed';
}

const reportStats = {
  total: mockReports.length,
  completed: mockReports.filter(r => r.status === 'completed').length,
  pending: mockReports.filter(r => r.status === 'pending').length,
  scheduled: mockReports.filter(r => r.schedule).length,
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
    completed: { label: 'Concluído', color: 'success' as const },
    pending: { label: 'Pendente', color: 'warning' as const },
    failed: { label: 'Falhou', color: 'error' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
}

function getTypeChip(type: string) {
  const typeConfig = {
    sla: { label: 'SLA', color: 'primary' as const },
    performance: { label: 'Performance', color: 'secondary' as const },
    inventory: { label: 'Inventário', color: 'info' as const },
    alerts: { label: 'Alertas', color: 'warning' as const },
    custom: { label: 'Personalizado', color: 'default' as const },
  };
  
  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.custom;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}

function getReportIcon(type: string) {
  switch (type) {
    case 'sla': return <TrendingUp />;
    case 'performance': return <Analytics />;
    case 'inventory': return <Wifi />;
    case 'alerts': return <Assessment />;
    case 'custom': return <Description />;
    default: return <Assessment />;
  }
}

export default function Reports() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReportForMenu, setSelectedReportForMenu] = useState<ReportType | null>(null);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, report: ReportType) => {
    setAnchorEl(event.currentTarget);
    setSelectedReportForMenu(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReportForMenu(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            📊 Relatórios e Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Relatórios automatizados e análises de performance
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar
          </Button>
          
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateReport(true)}>
            Novo Relatório
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Relatórios"
            value={reportStats.total}
            subtitle="Relatórios configurados"
            color="primary"
            icon={Assessment}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Concluídos"
            value={reportStats.completed}
            subtitle="Gerados com sucesso"
            color="success"
            icon={TrendingUp}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pendentes"
            value={reportStats.pending}
            subtitle="Aguardando geração"
            color="warning"
            icon={Schedule}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendados"
            value={reportStats.scheduled}
            subtitle="Com agendamento ativo"
            color="secondary"
            icon={CalendarToday}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="📋 Relatórios" />
            <Tab label="📈 SLA Dashboard" />
            <Tab label="⚡ Performance" />
            <Tab label="📊 Analytics" />
          </Tabs>
        </Box>

        {/* Reports List Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Relatórios Configurados
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateReport(true)}>
                Novo Relatório
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Categoria</strong></TableCell>
                    <TableCell><strong>Agendamento</strong></TableCell>
                    <TableCell><strong>Última Geração</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getReportIcon(report.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {report.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getTypeChip(report.type)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {report.category}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {report.schedule ? (
                          <Chip 
                            label={report.schedule} 
                            size="small" 
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Manual
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {report.lastGenerated ? new Date(report.lastGenerated).toLocaleString() : 'Nunca'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(report.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Download fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary" onClick={() => setSelectedReport(report)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="default"
                            onClick={(e) => handleMenuClick(e, report)}
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
          </CardContent>
        )}

        {/* SLA Dashboard Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Dashboard de SLA
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    SLA Mensal - Últimos 6 Meses
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={slaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[98, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="sla" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={3}
                        name="SLA Atual"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke={theme.palette.secondary.main} 
                        strokeDasharray="5 5"
                        name="Meta SLA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Status dos Dispositivos
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Tooltip />
                      <Pie
                        data={deviceStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`}
                      >
                        {deviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Performance Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Análise de Performance
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Latência e Throughput - Últimas 24h
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="latency" 
                        stackId="1"
                        stroke={theme.palette.warning.main} 
                        fill={theme.palette.warning.light}
                        name="Latência (ms)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="throughput" 
                        stackId="2"
                        stroke={theme.palette.success.main} 
                        fill={theme.palette.success.light}
                        name="Throughput (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Analytics Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Analytics Avançado
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Análise Preditiva
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IA para previsão de problemas e otimizações
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Timeline sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Tendências
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise de tendências históricas e projeções
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
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Download sx={{ mr: 1 }} fontSize="small" />
          Baixar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Email sx={{ mr: 1 }} fontSize="small" />
          Enviar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Excluir
        </MenuItem>
      </Menu>

      {/* Report Details Dialog */}
      <Dialog open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Relatório
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedReport.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedReport.description}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {getTypeChip(selectedReport.type)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Categoria:</strong> {selectedReport.category}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Agendamento:</strong> {selectedReport.schedule || 'Manual'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Status:</strong> {getStatusChip(selectedReport.status)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Destinatários:</strong>
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {selectedReport.recipients.map((email, index) => (
                    <Chip key={index} label={email} size="small" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReport(null)}>Fechar</Button>
          <Button variant="contained" startIcon={<Download />}>
            Baixar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Report Dialog */}
      <Dialog open={showCreateReport} onClose={() => setShowCreateReport(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Relatório</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome do Relatório" />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Descrição" 
                multiline 
                rows={2}
                placeholder="Descreva o conteúdo do relatório..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select defaultValue="" label="Tipo">
                  <MenuItem value="sla">SLA</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="inventory">Inventário</MenuItem>
                  <MenuItem value="alerts">Alertas</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select defaultValue="" label="Categoria">
                  <MenuItem value="operational">Operacional</MenuItem>
                  <MenuItem value="executive">Executivo</MenuItem>
                  <MenuItem value="technical">Técnico</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Agendamento</InputLabel>
                <Select defaultValue="" label="Agendamento">
                  <MenuItem value="">Manual</MenuItem>
                  <MenuItem value="daily">Diário</MenuItem>
                  <MenuItem value="weekly">Semanal</MenuItem>
                  <MenuItem value="monthly">Mensal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Destinatários" placeholder="email1@empresa.com, email2@empresa.com" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateReport(false)}>Cancelar</Button>
          <Button variant="contained">Criar Relatório</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
