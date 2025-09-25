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
} from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { FC } from 'react';
import {
  ThermostatAuto,
  SignalWifi4Bar,
  SignalWifiStatusbar4Bar,
  SignalWifiStatusbarNull,
  Devices,
  Warning,
  CheckCircle,
  Error,
  Speed,
  Router,
  Person,
} from '@mui/icons-material';

const DashboardClientes: FC = () => {
  useTitle('Dashboard de Clientes - RJ Chronos');

  // Dados mockados para demonstração
  const clientesComProblemas = [
    {
      id: 1,
      nome: 'João Silva',
      temperatura: 85,
      sinal: -28,
      dispositivos: 4,
      status: 'crítico',
      problema: 'Temperatura alta',
    },
    {
      id: 2,
      nome: 'Maria Santos',
      temperatura: 45,
      sinal: -32,
      dispositivos: 2,
      status: 'atenção',
      problema: 'Sinal fraco',
    },
    {
      id: 3,
      nome: 'Pedro Costa',
      temperatura: 72,
      sinal: -15,
      dispositivos: 8,
      status: 'normal',
      problema: 'Muitos dispositivos',
    },
  ];

  const estatisticasClientes = {
    totalClientes: 1247,
    clientesOnline: 1180,
    clientesComProblemas: 23,
    temperaturaMedia: 52.3,
    sinalMedio: -22.5,
    dispositivosMedio: 3.2,
  };

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

  const getSinalIcon = (sinal: number) => {
    if (sinal > -20) return <SignalWifi4Bar color="success" />;
    if (sinal > -30) return <SignalWifiStatusbar4Bar color="warning" />;
    return <SignalWifiStatusbarNull color="error" />;
  };

  const getTemperaturaColor = (temp: number) => {
    if (temp > 80) return 'error';
    if (temp > 70) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* KPIs dos Clientes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.totalClientes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Clientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle
                sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.clientesOnline}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clientes Online
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.clientesComProblemas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Com Problemas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ThermostatAuto
                sx={{ fontSize: 40, color: 'info.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.temperaturaMedia}°C
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Temp. Média
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Speed sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.sinalMedio}dBm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sinal Médio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Devices sx={{ fontSize: 40, color: 'primary.dark', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {estatisticasClientes.dispositivosMedio}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dispositivos Médio
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
            {/* Alertas e Status Crítico */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Alertas Críticos de Clientes
                  </Typography>

                  <Alert severity="error" sx={{ mb: 2 }}>
                    <strong>3 clientes</strong> com temperatura acima de 80°C -
                    Ação imediata necessária
                  </Alert>

                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>7 clientes</strong> com sinal fraco (abaixo de
                    -30dBm)
                  </Alert>

                  <Alert severity="info">
                    <strong>13 clientes</strong> com mais de 5 dispositivos
                    conectados
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            {/* Lista de Clientes com Problemas */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Clientes Que Necessitam Atenção
                  </Typography>

                  <List>
                    {clientesComProblemas.map((cliente, index) => (
                      <Box key={cliente.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  getStatusColor(cliente.status) + '.main',
                                color: 'white',
                              }}
                            >
                              <Person />
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
                                  {cliente.nome}
                                </Typography>
                                <Chip
                                  label={cliente.status.toUpperCase()}
                                  color={getStatusColor(cliente.status) as any}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={4}>
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
                                              cliente.temperatura
                                            ) + '.main',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {cliente.temperatura}°C
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      {getSinalIcon(cliente.sinal)}
                                      <Typography variant="body2">
                                        {cliente.sinal}dBm
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12} sm={4}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Devices
                                        sx={{
                                          fontSize: 16,
                                          color: 'text.secondary',
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {cliente.dispositivos} dispositivos
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>
                                <Typography
                                  variant="body2"
                                  color="error.main"
                                  sx={{ mt: 1 }}
                                >
                                  <strong>Problema:</strong> {cliente.problema}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < clientesComProblemas.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna Direita - Gráficos e Métricas */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Distribuição de Temperatura */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Distribuição de Temperatura
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Normal (&lt;70°C)</Typography>
                      <Typography variant="body2">874 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={70}
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
                      <Typography variant="body2">Atenção (70-80°C)</Typography>
                      <Typography variant="body2">350 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={28}
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
                      <Typography variant="body2">
                        Crítico (&gt;80°C)
                      </Typography>
                      <Typography variant="body2">23 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={2}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Qualidade do Sinal */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Qualidade do Sinal
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Excelente (&gt;-20dBm)
                      </Typography>
                      <Typography variant="body2">492 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={39}
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
                        Bom (-20 a -25dBm)
                      </Typography>
                      <Typography variant="body2">586 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={47}
                      color="info"
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
                      <Typography variant="body2">
                        Fraco (&lt;-25dBm)
                      </Typography>
                      <Typography variant="body2">169 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={14}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Dispositivos Conectados */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Dispositivos por Cliente
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">1-2 dispositivos</Typography>
                      <Typography variant="body2">456 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={37}
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
                      <Typography variant="body2">3-5 dispositivos</Typography>
                      <Typography variant="body2">623 clientes</Typography>
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
                      <Typography variant="body2">6+ dispositivos</Typography>
                      <Typography variant="body2">168 clientes</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={13}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardClientes;
