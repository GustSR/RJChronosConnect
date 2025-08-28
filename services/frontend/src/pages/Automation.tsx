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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  AutoFixHigh,
  Psychology,
  SmartToy,
  TrendingUp,
  Lightbulb,
  Rule,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  Add,
  Refresh,
  Visibility,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Timeline,
  Analytics,
  PrecisionManufacturing,
  AutoAwesome,
  Speed,
  Security,
  Notifications,
} from '@mui/icons-material';

// Mock automation data
const automationRules = [
  {
    id: 'rule-001',
    name: 'Auto-restart CPE com alta latência',
    description: 'Reinicia automaticamente CPEs com latência > 100ms por mais de 5 minutos',
    trigger: 'latency > 100ms for 5min',
    action: 'restart_device',
    status: 'active',
    lastTriggered: '2024-01-15T09:30:00Z',
    executions: 12,
    successRate: 95,
  },
  {
    id: 'rule-002',
    name: 'Alerta de sinal baixo',
    description: 'Envia alerta quando sinal óptico < -25dBm',
    trigger: 'optical_signal < -25dBm',
    action: 'send_alert',
    status: 'active',
    lastTriggered: '2024-01-15T08:45:00Z',
    executions: 8,
    successRate: 100,
  },
  {
    id: 'rule-003',
    name: 'Backup automático de configurações',
    description: 'Faz backup das configurações diariamente às 02:00',
    trigger: 'schedule: daily 02:00',
    action: 'backup_config',
    status: 'active',
    lastTriggered: '2024-01-15T02:00:00Z',
    executions: 30,
    successRate: 98,
  },
  {
    id: 'rule-004',
    name: 'Otimização de canal Wi-Fi',
    description: 'Otimiza canal Wi-Fi quando interferência > 70%',
    trigger: 'wifi_interference > 70%',
    action: 'optimize_wifi_channel',
    status: 'inactive',
    lastTriggered: '2024-01-14T16:20:00Z',
    executions: 5,
    successRate: 80,
  },
];

const aiInsights = [
  {
    id: 'insight-001',
    title: 'Padrão de falhas detectado',
    description: 'CPEs da região Norte apresentam 40% mais falhas entre 14h-16h',
    confidence: 92,
    category: 'performance',
    recommendation: 'Considere redistribuir carga ou verificar infraestrutura local',
    impact: 'high',
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: 'insight-002',
    title: 'Oportunidade de otimização',
    description: 'Canais Wi-Fi 6 e 11 estão subutilizados na região Sul',
    confidence: 87,
    category: 'optimization',
    recommendation: 'Migrar dispositivos para canais menos congestionados',
    impact: 'medium',
    timestamp: '2024-01-15T09:15:00Z',
  },
  {
    id: 'insight-003',
    title: 'Previsão de manutenção',
    description: 'OLT-003 pode apresentar problemas nos próximos 7 dias',
    confidence: 78,
    category: 'predictive',
    recommendation: 'Agendar manutenção preventiva para OLT-003',
    impact: 'high',
    timestamp: '2024-01-15T08:00:00Z',
  },
];

const automationHistory = [
  {
    id: 'exec-001',
    rule: 'Auto-restart CPE com alta latência',
    device: 'CPE-001',
    timestamp: '2024-01-15T09:30:00Z',
    action: 'restart_device',
    status: 'success',
    duration: '45s',
    result: 'Latência normalizada para 15ms',
  },
  {
    id: 'exec-002',
    rule: 'Alerta de sinal baixo',
    device: 'ONU-005',
    timestamp: '2024-01-15T08:45:00Z',
    action: 'send_alert',
    status: 'success',
    duration: '2s',
    result: 'Alerta enviado para equipe técnica',
  },
  {
    id: 'exec-003',
    rule: 'Backup automático de configurações',
    device: 'Sistema',
    timestamp: '2024-01-15T02:00:00Z',
    action: 'backup_config',
    status: 'success',
    duration: '3min 20s',
    result: 'Backup de 2.3GB criado com sucesso',
  },
];

const automationStats = {
  totalRules: automationRules.length,
  activeRules: automationRules.filter(r => r.status === 'active').length,
  totalExecutions: automationRules.reduce((sum, r) => sum + r.executions, 0),
  avgSuccessRate: automationRules.reduce((sum, r) => sum + r.successRate, 0) / automationRules.length,
  aiInsights: aiInsights.length,
  highImpactInsights: aiInsights.filter(i => i.impact === 'high').length,
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
    success: { label: 'Sucesso', color: 'success' as const },
    failed: { label: 'Falhou', color: 'error' as const },
    running: { label: 'Executando', color: 'primary' as const },
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

function getImpactChip(impact: string) {
  const impactConfig = {
    high: { label: 'Alto', color: 'error' as const },
    medium: { label: 'Médio', color: 'warning' as const },
    low: { label: 'Baixo', color: 'success' as const },
  };
  
  const config = impactConfig[impact as keyof typeof impactConfig] || impactConfig.low;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'performance': return <Speed />;
    case 'optimization': return <TrendingUp />;
    case 'predictive': return <Psychology />;
    case 'security': return <Security />;
    default: return <Lightbulb />;
  }
}

export default function Automation() {
  const [tabValue, setTabValue] = useState(0);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🤖 IA & Automação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Inteligência artificial e automação inteligente da rede
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Atualizar IA
          </Button>
          
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateRule(true)}>
            Nova Regra
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Regras Ativas"
            value={`${automationStats.activeRules}/${automationStats.totalRules}`}
            subtitle="Automações funcionando"
            color="primary"
            icon={Rule}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Sucesso"
            value={`${automationStats.avgSuccessRate.toFixed(1)}%`}
            subtitle="Execuções bem-sucedidas"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Insights IA"
            value={automationStats.aiInsights}
            subtitle="Análises disponíveis"
            color="secondary"
            icon={Psychology}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Execuções"
            value={automationStats.totalExecutions}
            subtitle="Total de automações"
            color="warning"
            icon={AutoFixHigh}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="🤖 Insights IA" />
            <Tab label="⚙️ Regras de Automação" />
            <Tab label="📊 Execuções" />
            <Tab label="🔧 Configurações" />
          </Tabs>
        </Box>

        {/* AI Insights Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Insights de Inteligência Artificial
              </Typography>
              <Chip label={`${aiInsights.length} insights`} color="primary" variant="outlined" />
            </Box>
            
            <Grid container spacing={3}>
              {aiInsights.map((insight) => (
                <Grid item xs={12} lg={6} key={insight.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {getCategoryIcon(insight.category)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {insight.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {getImpactChip(insight.impact)}
                            <Chip
                              label={`${insight.confidence}% confiança`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {insight.description}
                      </Typography>
                      
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Recomendação:</strong> {insight.recommendation}
                        </Typography>
                      </Alert>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(insight.timestamp).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined">
                            Aplicar
                          </Button>
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Automation Rules Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Regras de Automação
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateRule(true)}>
                Nova Regra
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>Trigger</strong></TableCell>
                    <TableCell><strong>Ação</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Execuções</strong></TableCell>
                    <TableCell><strong>Taxa Sucesso</strong></TableCell>
                    <TableCell><strong>Último Trigger</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {automationRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {rule.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rule.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {rule.trigger}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.action} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{getStatusChip(rule.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {rule.executions}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={rule.successRate > 90 ? 'success.main' : 'warning.main'}
                          fontWeight={600}
                        >
                          {rule.successRate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(rule.lastTriggered).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <PlayArrow fontSize="small" />
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

        {/* Executions Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Histórico de Execuções
              </Typography>
              <Chip label={`${automationHistory.length} execuções`} color="primary" variant="outlined" />
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Regra</strong></TableCell>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Ação</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Duração</strong></TableCell>
                    <TableCell><strong>Resultado</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {automationHistory.map((execution) => (
                    <TableRow key={execution.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {execution.rule}
                        </Typography>
                      </TableCell>
                      <TableCell>{execution.device}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(execution.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={execution.action} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{getStatusChip(execution.status)}</TableCell>
                      <TableCell>{execution.duration}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {execution.result}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Settings Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configurações de IA e Automação
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Configure os parâmetros de funcionamento da inteligência artificial e automação
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Configurações de IA
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Análise preditiva habilitada"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Detecção de anomalias"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Aprendizado contínuo"
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Nível de confiança mínimo</InputLabel>
                      <Select defaultValue={70} label="Nível de confiança mínimo">
                        <MenuItem value={50}>50%</MenuItem>
                        <MenuItem value={70}>70%</MenuItem>
                        <MenuItem value={80}>80%</MenuItem>
                        <MenuItem value={90}>90%</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Configurações de Automação
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Automação habilitada"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Execução automática de regras"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Modo de segurança (aprovação manual)"
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Intervalo de verificação</InputLabel>
                      <Select defaultValue={60} label="Intervalo de verificação">
                        <MenuItem value={30}>30 segundos</MenuItem>
                        <MenuItem value={60}>1 minuto</MenuItem>
                        <MenuItem value={300}>5 minutos</MenuItem>
                        <MenuItem value={600}>10 minutos</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateRule} onClose={() => setShowCreateRule(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Nova Regra de Automação</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome da Regra" />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Descrição" 
                multiline 
                rows={2}
                placeholder="Descreva o que esta regra faz..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Trigger</InputLabel>
                <Select defaultValue="" label="Tipo de Trigger">
                  <MenuItem value="metric">Métrica</MenuItem>
                  <MenuItem value="schedule">Agendamento</MenuItem>
                  <MenuItem value="event">Evento</MenuItem>
                  <MenuItem value="threshold">Limite</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ação</InputLabel>
                <Select defaultValue="" label="Ação">
                  <MenuItem value="restart_device">Reiniciar Dispositivo</MenuItem>
                  <MenuItem value="send_alert">Enviar Alerta</MenuItem>
                  <MenuItem value="backup_config">Backup Configuração</MenuItem>
                  <MenuItem value="optimize_wifi">Otimizar Wi-Fi</MenuItem>
                  <MenuItem value="custom">Ação Customizada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Condição do Trigger" 
                placeholder="Ex: latency > 100ms for 5min"
                helperText="Use sintaxe: métrica operador valor [for duração]"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Regra ativa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateRule(false)}>Cancelar</Button>
          <Button variant="contained">Criar Regra</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}