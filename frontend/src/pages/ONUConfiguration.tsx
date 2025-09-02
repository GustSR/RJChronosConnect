import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  IconButton,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  Wifi,
  Router,
  Security,
  NetworkCheck,
  Save,
  Cancel,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import useTitle from '../hooks/useTitle';
import AnimatedCard from '../components/common/AnimatedCard';

interface ONUDetails {
  id: string;
  serialNumber: string;
  model: string;
  vendor: string;
  macAddress: string;
  oltName: string;
  ponPort: string;
  status: 'pending' | 'authorized' | 'failed';
  discoveredAt: string;
  signalStrength: number;
  distance: number;
}

interface ConfigurationState {
  // Configurações Básicas
  deviceName: string;
  description: string;
  vlan: string;
  profile: string;

  // Configurações de Rede
  ipMode: 'dhcp' | 'static' | 'pppoe';
  staticIp: string;
  subnet: string;
  gateway: string;
  dns1: string;
  dns2: string;
  pppoeUser: string;
  pppoePassword: string;

  // Configurações Wi-Fi
  wifiEnabled: boolean;
  ssid2g: string;
  password2g: string;
  ssid5g: string;
  password5g: string;
  wifiChannel2g: string;
  wifiChannel5g: string;
  wifiSecurity: string;

  // Configurações Avançadas
  bridgeMode: boolean;
  portForwarding: Record<string, unknown>[];
  qosEnabled: boolean;
  bandwidthLimit: string;
  managementVlan: string;
}

const ONUConfiguration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Título da página
  useTitle('Configuração da ONU - RJ Chronos');

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [config, setConfig] = useState<ConfigurationState>({
    deviceName: '',
    description: '',
    vlan: '100',
    profile: 'residential_100mb',

    ipMode: 'dhcp',
    staticIp: '',
    subnet: '',
    gateway: '',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    pppoeUser: '',
    pppoePassword: '',

    wifiEnabled: true,
    ssid2g: '',
    password2g: '',
    ssid5g: '',
    password5g: '',
    wifiChannel2g: 'auto',
    wifiChannel5g: 'auto',
    wifiSecurity: 'wpa2',

    bridgeMode: false,
    portForwarding: [],
    qosEnabled: false,
    bandwidthLimit: '',
    managementVlan: '10',
  });

  // Simular carregamento dos dados da ONU
  useEffect(() => {
    const loadONUData = async () => {
      setLoading(true);

      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockONU: ONUDetails = {
        id: id || '1',
        serialNumber: 'GPON12345678',
        model: 'HG8245H',
        vendor: 'Huawei',
        macAddress: '00:11:22:33:44:55',
        oltName: 'OLT-Central-01',
        ponPort: '1/1/1',
        status: 'pending',
        discoveredAt: '2024-01-15 14:30:00',
        signalStrength: -18.5,
        distance: 1.2,
      };

      setOnuDetails(mockONU);

      // Pré-configurar alguns campos
      setConfig((prev) => ({
        ...prev,
        deviceName: `ONU-${mockONU.serialNumber.slice(-4)}`,
        description: `ONU ${mockONU.model} - Cliente Residencial`,
        ssid2g: `CHRONOS_${mockONU.serialNumber.slice(-4)}_2G`,
        ssid5g: `CHRONOS_${mockONU.serialNumber.slice(-4)}_5G`,
        password2g: `chronos${mockONU.serialNumber.slice(-4)}`,
        password5g: `chronos${mockONU.serialNumber.slice(-4)}`,
      }));

      setLoading(false);
    };

    loadONUData();
  }, [id]);

  // Função para salvar configurações
  const handleSave = async () => {
    setSaving(true);

    // Simular save API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Navegar para página de status
    setSaving(false);
    navigate(`/dashboard/provisionar/${id}/status`);
  };

  const getSignalColor = (signal: number) => {
    if (signal >= -20) return 'success';
    if (signal >= -25) return 'warning';
    return 'error';
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= -20) return <CheckCircle />;
    if (signal >= -25) return <Warning />;
    return <ErrorIcon />;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate('/dashboard/provisionar')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando configuração...
          </Typography>
        </Box>
        <LinearProgress sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">Carregando...</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          ONU não encontrada.{' '}
          <Button onClick={() => navigate('/dashboard/provisionar')}>
            Voltar
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/dashboard/provisionar')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
            Configuração da ONU
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure os parâmetros da ONU {onuDetails.serialNumber}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/dashboard/provisionar')}
            sx={{ borderRadius: 3 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? null : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Informações da ONU */}
        <Grid item xs={12} lg={4}>
          <AnimatedCard delay={100}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Router sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight="600">
                  Informações do Equipamento
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Número de Série
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {onuDetails.serialNumber}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Modelo / Fabricante
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {onuDetails.model} - {onuDetails.vendor}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    MAC Address
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {onuDetails.macAddress}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    OLT / Porta PON
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {onuDetails.oltName} - {onuDetails.ponPort}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Sinal Óptico
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSignalIcon(onuDetails.signalStrength)}
                    <Typography variant="body1" fontWeight="600">
                      {onuDetails.signalStrength} dBm
                    </Typography>
                    <Chip
                      label={
                        onuDetails.signalStrength >= -20
                          ? 'Ótimo'
                          : onuDetails.signalStrength >= -25
                          ? 'Bom'
                          : 'Fraco'
                      }
                      color={getSignalColor(onuDetails.signalStrength)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Distância
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {onuDetails.distance} km
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Configurações */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Configurações Básicas */}
            <AnimatedCard delay={200}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Settings sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Configurações Básicas
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nome do Dispositivo"
                      value={config.deviceName}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          deviceName: e.target.value,
                        }))
                      }
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Perfil de Serviço</InputLabel>
                      <Select
                        value={config.profile}
                        label="Perfil de Serviço"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            profile: e.target.value,
                          }))
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="residential_100mb">
                          Residencial 100MB
                        </MenuItem>
                        <MenuItem value="residential_200mb">
                          Residencial 200MB
                        </MenuItem>
                        <MenuItem value="business_500mb">
                          Empresarial 500MB
                        </MenuItem>
                        <MenuItem value="business_1gb">
                          Empresarial 1GB
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrição"
                      value={config.description}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      multiline
                      rows={2}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="VLAN"
                      value={config.vlan}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, vlan: e.target.value }))
                      }
                      size="small"
                      type="number"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </AnimatedCard>

            {/* Configurações de Rede */}
            <AnimatedCard delay={300}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <NetworkCheck sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Configurações de Rede
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Modo IP</InputLabel>
                      <Select
                        value={config.ipMode}
                        label="Modo IP"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            ipMode: e.target.value as string,
                          }))
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="dhcp">DHCP</MenuItem>
                        <MenuItem value="static">IP Estático</MenuItem>
                        <MenuItem value="pppoe">PPPoE</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {config.ipMode === 'static' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="IP Estático"
                          value={config.staticIp}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              staticIp: e.target.value,
                            }))
                          }
                          placeholder="192.168.1.100"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Máscara de Rede"
                          value={config.subnet}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              subnet: e.target.value,
                            }))
                          }
                          placeholder="255.255.255.0"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Gateway"
                          value={config.gateway}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              gateway: e.target.value,
                            }))
                          }
                          placeholder="192.168.1.1"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                    </>
                  )}

                  {config.ipMode === 'pppoe' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Usuário PPPoE"
                          value={config.pppoeUser}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              pppoeUser: e.target.value,
                            }))
                          }
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Senha PPPoE"
                          type="password"
                          value={config.pppoePassword}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              pppoePassword: e.target.value,
                            }))
                          }
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="DNS Primário"
                      value={config.dns1}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, dns1: e.target.value }))
                      }
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="DNS Secundário"
                      value={config.dns2}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, dns2: e.target.value }))
                      }
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </AnimatedCard>

            {/* Configurações Wi-Fi */}
            <AnimatedCard delay={400}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Wifi sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" fontWeight="600">
                      Configurações Wi-Fi
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.wifiEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            wifiEnabled: e.target.checked,
                          }))
                        }
                        color="primary"
                      />
                    }
                    label="Wi-Fi Ativo"
                  />
                </Box>

                {config.wifiEnabled && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Configure as redes Wi-Fi 2.4GHz e 5GHz separadamente
                        para melhor performance.
                      </Alert>
                    </Grid>

                    {/* Wi-Fi 2.4GHz */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Rede 2.4GHz
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SSID 2.4GHz"
                        value={config.ssid2g}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            ssid2g: e.target.value,
                          }))
                        }
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Senha 2.4GHz"
                        value={config.password2g}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            password2g: e.target.value,
                          }))
                        }
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    {/* Wi-Fi 5GHz */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Rede 5GHz
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SSID 5GHz"
                        value={config.ssid5g}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            ssid5g: e.target.value,
                          }))
                        }
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Senha 5GHz"
                        value={config.password5g}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            password5g: e.target.value,
                          }))
                        }
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Canal 2.4GHz</InputLabel>
                        <Select
                          value={config.wifiChannel2g}
                          label="Canal 2.4GHz"
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              wifiChannel2g: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="auto">Automático</MenuItem>
                          <MenuItem value="1">Canal 1</MenuItem>
                          <MenuItem value="6">Canal 6</MenuItem>
                          <MenuItem value="11">Canal 11</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Canal 5GHz</InputLabel>
                        <Select
                          value={config.wifiChannel5g}
                          label="Canal 5GHz"
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              wifiChannel5g: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="auto">Automático</MenuItem>
                          <MenuItem value="36">Canal 36</MenuItem>
                          <MenuItem value="40">Canal 40</MenuItem>
                          <MenuItem value="44">Canal 44</MenuItem>
                          <MenuItem value="48">Canal 48</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Segurança</InputLabel>
                        <Select
                          value={config.wifiSecurity}
                          label="Segurança"
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              wifiSecurity: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="wpa2">WPA2</MenuItem>
                          <MenuItem value="wpa3">WPA3</MenuItem>
                          <MenuItem value="wpa2_wpa3">WPA2/WPA3</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </AnimatedCard>

            {/* Configurações Avançadas */}
            <AnimatedCard delay={500}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Security sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    Configurações Avançadas
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.bridgeMode}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              bridgeMode: e.target.checked,
                            }))
                          }
                          color="primary"
                        />
                      }
                      label="Modo Bridge"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.qosEnabled}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              qosEnabled: e.target.checked,
                            }))
                          }
                          color="primary"
                        />
                      }
                      label="QoS Ativo"
                    />
                  </Grid>

                  {config.qosEnabled && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Limite de Banda (Mbps)"
                        value={config.bandwidthLimit}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            bandwidthLimit: e.target.value,
                          }))
                        }
                        size="small"
                        type="number"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="VLAN de Gerenciamento"
                      value={config.managementVlan}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          managementVlan: e.target.value,
                        }))
                      }
                      size="small"
                      type="number"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </AnimatedCard>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ONUConfiguration;
