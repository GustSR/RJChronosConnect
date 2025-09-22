import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { FC } from 'react';
import {
  Router,
  ThermostatAuto,
  Memory,
  Speed,
  Security,
  Warning,
  CheckCircle,
  Error,
  NetworkCheck,
  Timeline,
  Storage,
  SignalCellularAlt,
  Visibility,
} from '@mui/icons-material';

const DashboardOLTs: FC = () => {
  useTitle('Dashboard de OLTs - RJ Chronos');

  // Dados mockados para demonstração
  const oltsComProblemas = [
    {
      id: 1,
      nome: 'OLT-Central-01',
      ip: '192.168.1.10',
      temperatura: 78,
      cpuUsage: 85,
      memoryUsage: 72,
      trafego: 89,
      alarmes: 2,
      status: 'crítico',
      problema: 'CPU alta + Temperatura',
    },
    {
      id: 2,
      nome: 'OLT-Bairro-02',
      ip: '192.168.1.11',
      temperatura: 65,
      cpuUsage: 45,
      memoryUsage: 88,
      trafego: 67,
      alarmes: 1,
      status: 'atenção',
      problema: 'Memória alta',
    },
    {
      id: 3,
      nome: 'OLT-Industrial-03',
      ip: '192.168.1.12',
      temperatura: 52,
      cpuUsage: 62,
      memoryUsage: 45,
      trafego: 95,
      alarmes: 0,
      status: 'normal',
      problema: 'Tráfego alto',
    },
  ];

  const estatisticasOLTs = {
    totalOLTs: 24,
    oltsOnline: 22,
    oltsComProblemas: 6,
    temperaturaMedia: 58.2,
    cpuMedio: 52.8,
    memoriaMedio: 61.3,
    trafegoTotal: 87.2,
  };

  const alarmesSeguranca = [
    {
      tipo: 'Login Suspeito',
      olt: 'OLT-Central-01',
      timestamp: '2024-01-15 14:30',
      severidade: 'alta',
    },
    {
      tipo: 'Tentativa de Acesso',
      olt: 'OLT-Bairro-05',
      timestamp: '2024-01-15 13:45',
      severidade: 'média',
    },
    {
      tipo: 'Configuração Alterada',
      olt: 'OLT-Norte-08',
      timestamp: '2024-01-15 12:20',
      severidade: 'baixa',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'crítico':
        return 'error';
      case 'atenção':
        return 'warning';
      case 'normal':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeveridadeColor = (severidade: string) => {
    switch (severidade) {
      case 'alta':
        return 'error';
      case 'média':
        return 'warning';
      case 'baixa':
        return 'info';
      default:
        return 'default';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'error';
    if (usage > 60) return 'warning';
    return 'success';
  };

  const getTemperaturaColor = (temp: number) => {
    if (temp > 75) return 'error';
    if (temp > 65) return 'warning';
    return 'success';
  };

  return (
    <Box
      sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}
    >
      {/* Header do Dashboard */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Dashboard de OLTs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitoramento avançado das OLTs - Saúde, Performance, Segurança e
          Tráfego
        </Typography>
      </Box>

      {/* KPIs das OLTs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Router sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.totalOLTs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total OLTs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle
                sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.oltsOnline}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.oltsComProblemas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Com Problemas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ThermostatAuto
                sx={{ fontSize: 40, color: 'info.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.temperaturaMedia}°C
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Temp. Média
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Memory sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.cpuMedio}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CPU Médio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SignalCellularAlt
                sx={{ fontSize: 40, color: 'primary.dark', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasOLTs.trafegoTotal}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tráfego Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Layout Principal */}
      <Grid container spacing={3}>
        {/* Coluna Esquerda */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Alertas de Segurança */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Alertas de Segurança Recentes
                  </Typography>

                  <List>
                    {alarmesSeguranca.map((alarme, index) => (
                      <Box key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  getSeveridadeColor(alarme.severidade) +
                                  '.main',
                                color: 'white',
                              }}
                            >
                              <Security />
                            </Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {alarme.tipo}
                                </Typography>
                                <Chip
                                  label={alarme.severidade.toUpperCase()}
                                  color={
                                    getSeveridadeColor(alarme.severidade) as any
                                  }
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                >
                                  <strong>OLT:</strong> {alarme.olt}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {alarme.timestamp}
                                </Typography>
                              </Box>
                            }
                          />

                          <Tooltip title="Ver detalhes">
                            <IconButton color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                        {index < alarmesSeguranca.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* OLTs que Necessitam Atenção */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    OLTs que Necessitam Atenção
                  </Typography>

                  <List>
                    {oltsComProblemas.map((olt, index) => (
                      <Box key={olt.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: getStatusColor(olt.status) + '.main',
                                color: 'white',
                              }}
                            >
                              <Router />
                            </Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {olt.nome}
                                </Typography>
                                <Chip
                                  label={olt.status.toUpperCase()}
                                  color={getStatusColor(olt.status) as any}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  IP: {olt.ip}
                                </Typography>

                                <Grid container spacing={2}>
                                  <Grid item xs={6} sm={3}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <ThermostatAuto
                                        sx={{
                                          fontSize: 16,
                                          color:
                                            getTemperaturaColor(
                                              olt.temperatura
                                            ) + '.main',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {olt.temperatura}°C
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Memory
                                        sx={{
                                          fontSize: 16,
                                          color:
                                            getUsageColor(olt.cpuUsage) +
                                            '.main',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        CPU {olt.cpuUsage}%
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Storage
                                        sx={{
                                          fontSize: 16,
                                          color:
                                            getUsageColor(olt.memoryUsage) +
                                            '.main',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        RAM {olt.memoryUsage}%
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Timeline
                                        sx={{
                                          fontSize: 16,
                                          color:
                                            getUsageColor(olt.trafego) +
                                            '.main',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {olt.trafego}% tráfego
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Typography
                                  variant="body2"
                                  color="error.main"
                                  sx={{ mt: 1 }}
                                >
                                  <strong>Problema:</strong> {olt.problema}
                                </Typography>

                                {olt.alarmes > 0 && (
                                  <Chip
                                    label={`${olt.alarmes} alarme${
                                      olt.alarmes > 1 ? 's' : ''
                                    } ativo${olt.alarmes > 1 ? 's' : ''}`}
                                    color="error"
                                    size="small"
                                    sx={{ mt: 1 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < oltsComProblemas.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna Direita - Métricas */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Saúde Geral das OLTs */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Saúde Geral das OLTs
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Saudáveis</Typography>
                      <Typography variant="body2">18 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Atenção Necessária
                      </Typography>
                      <Typography variant="body2">4 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={17}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Estado Crítico</Typography>
                      <Typography variant="body2">2 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={8}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Utilização de CPU */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Utilização de CPU
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Normal (&lt;60%)</Typography>
                      <Typography variant="body2">16 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={67}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Alto (60-80%)</Typography>
                      <Typography variant="body2">5 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={21}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Crítico (&gt;80%)</Typography>
                      <Typography variant="body2">3 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={12}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Distribuição de Tráfego */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Distribuição de Tráfego
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Baixo (&lt;50%)</Typography>
                      <Typography variant="body2">8 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={33}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Médio (50-80%)</Typography>
                      <Typography variant="body2">12 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={50}
                      color="primary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Alto (&gt;80%)</Typography>
                      <Typography variant="body2">4 OLTs</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={17}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Resumo de Alarmes */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Resumo de Alarmes (24h)
                  </Typography>

                  <Alert severity="error" sx={{ mb: 2 }}>
                    <strong>12</strong> alarmes críticos registrados
                  </Alert>

                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>8</strong> avisos de performance
                  </Alert>

                  <Alert severity="info">
                    <strong>5</strong> notificações de manutenção
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOLTs;
