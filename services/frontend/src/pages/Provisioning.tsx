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
  LinearProgress,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Download,
  Upload,
  Settings,
  Router,
  Devices,
  Storage,
  CloudDownload,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  History,
  Code,
  Security,
  Wifi,
  NetworkCheck,
  Speed,
  Memory,
  Refresh,
} from '@mui/icons-material';

// Mock provisioning data
const provisioningTemplates = [
  {
    id: 'template-001',
    name: 'CPE Residencial Básico',
    description: 'Template padrão para CPEs residenciais',
    type: 'CPE',
    version: '1.2.0',
    parameters: 15,
    lastModified: '2024-01-15T10:30:00Z',
    status: 'active',
    usageCount: 245,
  },
  {
    id: 'template-002',
    name: 'ONU Empresarial',
    description: 'Template para ONUs empresariais com QoS',
    type: 'ONU',
    version: '2.1.3',
    parameters: 28,
    lastModified: '2024-01-14T15:20:00Z',
    status: 'active',
    usageCount: 89,
  },
  {
    id: 'template-003',
    name: 'OLT Central',
    description: 'Template para configuração de OLT central',
    type: 'OLT',
    version: '3.0.1',
    parameters: 42,
    lastModified: '2024-01-13T09:15:00Z',
    status: 'draft',
    usageCount: 12,
  },
];

const provisioningJobs = [
  {
    id: 'job-001',
    deviceId: 'CPE-001',
    deviceName: 'CPE Cliente 001',
    template: 'CPE Residencial Básico',
    status: 'completed',
    progress: 100,
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T10:05:00Z',
    duration: '5m 23s',
    steps: ['Download Config', 'Apply Settings', 'Reboot', 'Validate'],
    currentStep: 4,
  },
  {
    id: 'job-002',
    deviceId: 'ONU-002',
    deviceName: 'ONU Empresarial 002',
    template: 'ONU Empresarial',
    status: 'running',
    progress: 65,
    startTime: '2024-01-15T10:25:00Z',
    endTime: null,
    duration: '2m 15s',
    steps: ['Download Config', 'Apply Settings', 'Reboot', 'Validate'],
    currentStep: 2,
  },
  {
    id: 'job-003',
    deviceId: 'CPE-003',
    deviceName: 'CPE Cliente 003',
    template: 'CPE Residencial Básico',
    status: 'failed',
    progress: 45,
    startTime: '2024-01-15T09:45:00Z',
    endTime: '2024-01-15T09:52:00Z',
    duration: '7m 12s',
    steps: ['Download Config', 'Apply Settings', 'Reboot', 'Validate'],
    currentStep: 2,
    error: 'Falha na comunicação com o dispositivo',
  },
];

const firmwareVersions = [
  {
    id: 'fw-001',
    name: 'CPE_FW_v2.1.5',
    version: '2.1.5',
    type: 'CPE',
    size: '12.5 MB',
    releaseDate: '2024-01-10',
    description: 'Correções de segurança e melhorias de performance',
    status: 'stable',
    downloadCount: 1250,
  },
  {
    id: 'fw-002',
    name: 'ONU_FW_v3.2.1',
    version: '3.2.1',
    type: 'ONU',
    size: '18.7 MB',
    releaseDate: '2024-01-12',
    description: 'Nova funcionalidade de QoS dinâmico',
    status: 'beta',
    downloadCount: 89,
  },
  {
    id: 'fw-003',
    name: 'OLT_FW_v4.0.2',
    version: '4.0.2',
    type: 'OLT',
    size: '45.2 MB',
    releaseDate: '2024-01-08',
    description: 'Suporte para novos protocolos e otimizações',
    status: 'stable',
    downloadCount: 67,
  },
];

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon: React.ElementType;
  unit?: string;
}

function MetricCard({ title, value, subtitle, color, icon: Icon, unit }: MetricCardProps) {
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
          {value}{unit && <Typography component="span" variant="h5" color="text.secondary">{unit}</Typography>}
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
    completed: { label: 'Concluído', color: 'success' as const, icon: CheckCircle },
    running: { label: 'Executando', color: 'primary' as const, icon: PlayArrow },
    failed: { label: 'Falhou', color: 'error' as const, icon: Error },
    pending: { label: 'Pendente', color: 'warning' as const, icon: Schedule },
    active: { label: 'Ativo', color: 'success' as const, icon: CheckCircle },
    draft: { label: 'Rascunho', color: 'warning' as const, icon: Edit },
    stable: { label: 'Estável', color: 'success' as const, icon: CheckCircle },
    beta: { label: 'Beta', color: 'warning' as const, icon: Warning },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
      icon={<config.icon fontSize="small" />}
    />
  );
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'CPE': return <Router />;
    case 'OLT': return <Storage />;
    case 'ONU': return <Devices />;
    default: return <Router />;
  }
}

export default function Provisioning() {
  const [tabValue, setTabValue] = useState(0);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [jobDialog, setJobDialog] = useState(false);
  const [firmwareDialog, setFirmwareDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const provisioningStats = {
    totalTemplates: provisioningTemplates.length,
    activeTemplates: provisioningTemplates.filter(t => t.status === 'active').length,
    runningJobs: provisioningJobs.filter(j => j.status === 'running').length,
    completedJobs: provisioningJobs.filter(j => j.status === 'completed').length,
    failedJobs: provisioningJobs.filter(j => j.status === 'failed').length,
    firmwareVersions: firmwareVersions.length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            🚀 Provisionamento Zero-Touch
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configuração automática e gerenciamento de dispositivos
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Upload />}>
            Importar Template
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setTemplateDialog(true)}>
            Novo Template
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Templates Ativos"
            value={provisioningStats.activeTemplates}
            subtitle={`de ${provisioningStats.totalTemplates} templates`}
            color="primary"
            icon={Code}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Jobs Executando"
            value={provisioningStats.runningJobs}
            subtitle="em andamento"
            color="secondary"
            icon={PlayArrow}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Concluídos"
            value={provisioningStats.completedJobs}
            subtitle="hoje"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Falhas"
            value={provisioningStats.failedJobs}
            subtitle="requer atenção"
            color="error"
            icon={Error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Firmwares"
            value={provisioningStats.firmwareVersions}
            subtitle="versões disponíveis"
            color="warning"
            icon={CloudDownload}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <MetricCard
            title="Taxa de Sucesso"
            value="94.2"
            subtitle="últimos 30 dias"
            color="success"
            icon={Speed}
            unit="%"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="📋 Templates de Configuração" />
            <Tab label="⚙️ Jobs de Provisionamento" />
            <Tab label="💾 Gerenciamento de Firmware" />
            <Tab label="📊 Relatórios e Histórico" />
          </Tabs>
        </Box>

        {/* Templates Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Templates de Configuração
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setTemplateDialog(true)}>
                Novo Template
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Template</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Versão</strong></TableCell>
                    <TableCell><strong>Parâmetros</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Uso</strong></TableCell>
                    <TableCell><strong>Última Modificação</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {provisioningTemplates.map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getDeviceIcon(template.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {template.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {template.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={template.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          v{template.version}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${template.parameters} params`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{getStatusChip(template.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {template.usageCount} dispositivos
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(template.lastModified).toLocaleDateString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary" onClick={() => setSelectedTemplate(template)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="secondary">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="success">
                            <Download fontSize="small" />
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

        {/* Jobs Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Jobs de Provisionamento
              </Typography>
              <Button variant="contained" startIcon={<PlayArrow />} onClick={() => setJobDialog(true)}>
                Executar Job
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dispositivo</strong></TableCell>
                    <TableCell><strong>Template</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Progresso</strong></TableCell>
                    <TableCell><strong>Duração</strong></TableCell>
                    <TableCell><strong>Início</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {provisioningJobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {job.deviceName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {job.deviceId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.template}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(job.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={job.progress} 
                            color={job.status === 'failed' ? 'error' : job.status === 'completed' ? 'success' : 'primary'}
                            sx={{ width: 100, height: 6 }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {job.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(job.startTime).toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary" onClick={() => setSelectedJob(job)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          {job.status === 'running' && (
                            <IconButton size="small" color="warning">
                              <Pause fontSize="small" />
                            </IconButton>
                          )}
                          {job.status === 'failed' && (
                            <IconButton size="small" color="success">
                              <Refresh fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Firmware Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Gerenciamento de Firmware
              </Typography>
              <Button variant="contained" startIcon={<Upload />} onClick={() => setFirmwareDialog(true)}>
                Upload Firmware
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Firmware</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Versão</strong></TableCell>
                    <TableCell><strong>Tamanho</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Downloads</strong></TableCell>
                    <TableCell><strong>Data de Release</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {firmwareVersions.map((firmware) => (
                    <TableRow key={firmware.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {firmware.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {firmware.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={firmware.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          v{firmware.version}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {firmware.size}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(firmware.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {firmware.downloadCount} downloads
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(firmware.releaseDate).toLocaleDateString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <Download fontSize="small" />
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

        {/* Reports Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Relatórios e Histórico
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <History sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Histórico de Provisionamento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualize o histórico completo de jobs executados
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Speed sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Métricas de Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análise de performance e taxa de sucesso
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Job de Provisionamento
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Dispositivo:</strong> {selectedJob.deviceName}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Template:</strong> {selectedJob.template}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Status:</strong> {getStatusChip(selectedJob.status)}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Progresso:</strong> {selectedJob.progress}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Início:</strong> {new Date(selectedJob.startTime).toLocaleString('pt-BR')}
                  </Typography>
                  {selectedJob.endTime && (
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>Fim:</strong> {new Date(selectedJob.endTime).toLocaleString('pt-BR')}
                    </Typography>
                  )}
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Duração:</strong> {selectedJob.duration}
                  </Typography>
                  {selectedJob.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <strong>Erro:</strong> {selectedJob.error}
                    </Alert>
                  )}
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Etapas do Provisionamento
              </Typography>
              
              <Stepper activeStep={selectedJob.currentStep - 1} orientation="vertical">
                {selectedJob.steps.map((step, index) => (
                  <Step key={step}>
                    <StepLabel
                      error={selectedJob.status === 'failed' && index === selectedJob.currentStep - 1}
                    >
                      {step}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {index < selectedJob.currentStep - 1 ? 'Concluído' : 
                         index === selectedJob.currentStep - 1 ? 
                         (selectedJob.status === 'failed' ? 'Falhou' : 
                          selectedJob.status === 'running' ? 'Em execução' : 'Concluído') : 
                         'Pendente'}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedJob(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}