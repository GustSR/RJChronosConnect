import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HistoricoAlteracoesModal from '@/components/HistoricoAlteracoesModal';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Divider,
  Link,
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  RouterOutlined,
  NetworkWifi,
  Cable,
  Security,
  DeviceHub,
  Assignment,
  Computer,
  Settings,
  Edit,
  Save,
  Cancel,
  BugReport,
} from '@mui/icons-material';
import { useTitle } from '@shared/lib/hooks';
import { useProvisioning } from '@features/onu-provisioning';

// Interfaces
interface ONUDetails {
  id: string;
  serialNumber: string;
  model: string;
  customerName: string;
  oltName: string;
  board: string;
  port: string;
  status: 'online' | 'offline' | 'powered_off';
  authorizedAt: string;
  ip?: string;
  temperature?: number;
}

// Menu items
const menuItems = [
  { id: 'general', label: 'Geral', icon: Settings },
  { id: 'lan-dhcp', label: 'LAN DHCP', icon: Cable },
  { id: 'wifi', label: 'WI-FI', icon: NetworkWifi },
  { id: 'hosts', label: 'Hosts', icon: Computer },
  { id: 'lan-ports', label: 'Lan Ports', icon: DeviceHub },
  { id: 'device-logs', label: 'Device Logs', icon: Assignment },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: BugReport },
  { id: 'security', label: 'Security', icon: Security },
];

const ONUConfiguration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provisionedONUs } = useProvisioning();

  useTitle('Configuração ONU - RJ Chronos');

  // Estados
  const [loading, setLoading] = useState(true);
  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [selectedWifiLan, setSelectedWifiLan] = useState<string>('');

  // Estados para Troubleshooting
  const [selectedTroubleshootingTest, setSelectedTroubleshootingTest] =
    useState<string>('');

  // Estados para campos editáveis do LAN DHCP
  const [lanDhcpConfig, setLanDhcpConfig] = useState({
    lanIpInterface: '192.168.1.1',
    lanIpNetmask: '255.255.255.0',
    dhcpServerActive: 'Sim',
    dhcpIpPoolMin: '192.168.1.100',
    dhcpIpPoolMax: '192.168.1.200',
    dhcpSubnetMask: '255.255.255.0',
    dhcpGateway: '192.168.1.1',
    dhcpDnsServers: '8.8.8.8, 8.8.4.4',
  });

  // Estados para controlar mudanças
  const [originalLanDhcpConfig, setOriginalLanDhcpConfig] = useState({
    lanIpInterface: '192.168.1.1',
    lanIpNetmask: '255.255.255.0',
    dhcpServerActive: 'Sim',
    dhcpIpPoolMin: '192.168.1.100',
    dhcpIpPoolMax: '192.168.1.200',
    dhcpSubnetMask: '255.255.255.0',
    dhcpGateway: '192.168.1.1',
    dhcpDnsServers: '8.8.8.8, 8.8.4.4',
  });

  // Verificar se houve mudanças
  const hasLanDhcpChanges =
    JSON.stringify(lanDhcpConfig) !== JSON.stringify(originalLanDhcpConfig);

  // Função para salvar alterações
  const handleSaveLanDhcp = () => {
    setOriginalLanDhcpConfig({ ...lanDhcpConfig });
  };

  // Estados para campos editáveis do WiFi
  const [wifiNetworks, setWifiNetworks] = useState({
    wlan1: {
      name: 'Wireless LAN 1',
      band: '2.4G',
      ssid: 'RJChronos_2G',
      password: 'password123',
      authMode: 'WPA2-PSK',
      status: 'Ativo',
      enabled: true,
      rfBand: '2.4GHz',
      standard: '802.11n',
      radioEnabled: true,
      totalAssociations: 3,
      ssidAdvertisement: true,
      wpaEncryption: 'AES',
      channelWidth: '20MHz',
      autoChannel: true,
      channel: 6,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan2: {
      name: 'Wireless LAN 2',
      band: '2.4G',
      ssid: 'RJChronos_Guest_2G',
      password: 'guest2024',
      authMode: 'WPA2-PSK',
      status: 'Inativo',
      enabled: false,
      rfBand: '2.4GHz',
      standard: '802.11n',
      radioEnabled: false,
      totalAssociations: 0,
      ssidAdvertisement: false,
      wpaEncryption: 'AES',
      channelWidth: '20MHz',
      autoChannel: true,
      channel: 11,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan3: {
      name: 'Wireless LAN 3',
      band: '5G',
      ssid: 'RJChronos_5G',
      password: 'password123',
      authMode: 'WPA3-PSK',
      status: 'Ativo',
      enabled: true,
      rfBand: '5GHz',
      standard: '802.11ac',
      radioEnabled: true,
      totalAssociations: 2,
      ssidAdvertisement: true,
      wpaEncryption: 'AES',
      channelWidth: '80MHz',
      autoChannel: true,
      channel: 36,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan4: {
      name: 'Wireless LAN 4',
      band: '5G',
      ssid: 'RJChronos_Guest_5G',
      password: 'guest2024',
      authMode: 'WPA2-PSK',
      status: 'Inativo',
      enabled: false,
      rfBand: '5GHz',
      standard: '802.11ac',
      radioEnabled: false,
      totalAssociations: 0,
      ssidAdvertisement: false,
      wpaEncryption: 'AES',
      channelWidth: '40MHz',
      autoChannel: false,
      channel: 149,
      countryDomain: 'BR',
      txPower: '75%',
    },
  });

  // Estados originais para comparação
  const [originalWifiNetworks, setOriginalWifiNetworks] = useState({
    wlan1: {
      name: 'Wireless LAN 1',
      band: '2.4G',
      ssid: 'RJChronos_2G',
      password: 'password123',
      authMode: 'WPA2-PSK',
      status: 'Ativo',
      enabled: true,
      rfBand: '2.4GHz',
      standard: '802.11n',
      radioEnabled: true,
      totalAssociations: 3,
      ssidAdvertisement: true,
      wpaEncryption: 'AES',
      channelWidth: '20MHz',
      autoChannel: true,
      channel: 6,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan2: {
      name: 'Wireless LAN 2',
      band: '2.4G',
      ssid: 'RJChronos_Guest_2G',
      password: 'guest2024',
      authMode: 'WPA2-PSK',
      status: 'Inativo',
      enabled: false,
      rfBand: '2.4GHz',
      standard: '802.11n',
      radioEnabled: false,
      totalAssociations: 0,
      ssidAdvertisement: false,
      wpaEncryption: 'AES',
      channelWidth: '20MHz',
      autoChannel: true,
      channel: 11,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan3: {
      name: 'Wireless LAN 3',
      band: '5G',
      ssid: 'RJChronos_5G',
      password: 'password123',
      authMode: 'WPA3-PSK',
      status: 'Ativo',
      enabled: true,
      rfBand: '5GHz',
      standard: '802.11ac',
      radioEnabled: true,
      totalAssociations: 2,
      ssidAdvertisement: true,
      wpaEncryption: 'AES',
      channelWidth: '80MHz',
      autoChannel: true,
      channel: 36,
      countryDomain: 'BR',
      txPower: '100%',
    },
    wlan4: {
      name: 'Wireless LAN 4',
      band: '5G',
      ssid: 'RJChronos_Guest_5G',
      password: 'guest2024',
      authMode: 'WPA2-PSK',
      status: 'Inativo',
      enabled: false,
      rfBand: '5GHz',
      standard: '802.11ac',
      radioEnabled: false,
      totalAssociations: 0,
      ssidAdvertisement: false,
      wpaEncryption: 'AES',
      channelWidth: '40MHz',
      autoChannel: false,
      channel: 149,
      countryDomain: 'BR',
      txPower: '75%',
    },
  });

  // Verificar se houve mudanças em uma rede específica
  const hasWifiChanges = (networkKey: string) => {
    return (
      JSON.stringify(wifiNetworks[networkKey as keyof typeof wifiNetworks]) !==
      JSON.stringify(
        originalWifiNetworks[networkKey as keyof typeof originalWifiNetworks]
      )
    );
  };

  // Função para salvar alterações de WiFi
  const handleSaveWifi = (networkKey: string) => {
    setOriginalWifiNetworks((prev) => ({
      ...prev,
      [networkKey]: {
        ...wifiNetworks[networkKey as keyof typeof wifiNetworks],
      },
    }));
  };

  // Função para atualizar uma rede WiFi
  const updateWifiNetwork = (networkKey: string, field: string, value: any) => {
    setWifiNetworks((prev) => ({
      ...prev,
      [networkKey]: {
        ...prev[networkKey as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  // Dados dos hosts conectados
  const connectedHosts = [
    {
      id: 1,
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: '192.168.1.100',
      addressSource: 'DHCP',
      hostname: 'Smartphone-Samsung',
      port: 'WiFi 2.4G',
      active: true,
    },
    {
      id: 2,
      macAddress: 'AA:BB:CC:DD:EE:FF',
      ipAddress: '192.168.1.101',
      addressSource: 'Static',
      hostname: 'Desktop-Gaming',
      port: 'LAN1',
      active: true,
    },
    {
      id: 3,
      macAddress: '11:22:33:44:55:66',
      ipAddress: '192.168.1.102',
      addressSource: 'DHCP',
      hostname: 'Notebook-Work',
      port: 'WiFi 5G',
      active: false,
    },
    {
      id: 4,
      macAddress: '77:88:99:AA:BB:CC',
      ipAddress: '192.168.1.103',
      addressSource: 'DHCP',
      hostname: 'Smart-TV-LG',
      port: 'LAN3',
      active: true,
    },
    {
      id: 5,
      macAddress: 'DD:EE:FF:00:11:22',
      ipAddress: '192.168.1.104',
      addressSource: 'DHCP',
      hostname: 'Tablet-iPad',
      port: 'WiFi 5G',
      active: true,
    },
    {
      id: 6,
      macAddress: '33:44:55:66:77:88',
      ipAddress: '192.168.1.105',
      addressSource: 'Static',
      hostname: 'Chromecast',
      port: 'WiFi 2.4G',
      active: false,
    },
  ];

  // Estados para campos editáveis do Security
  const [securityConfig, setSecurityConfig] = useState({
    tpAccessFromWan: 'Disabled',
    ftpAccessFromLan: 'Enabled',
    userInterfaceAccessFromWan: 'Disabled',
    userInterfaceAccessFromLan: 'Enabled',
    sshAccessFromWan: 'Disabled',
    sshAccessFromLan: 'Enabled',
    sambaAccessFromWan: 'Disabled',
    sambaAccessFromLan: 'Enabled',
    telnetAccessFromWan: 'Disabled',
    telnetAccessFromLan: 'Disabled',
    wanIcmpEchoReply: 'Block',
    sshService: 'Enabled',
    telnetService: 'Disabled',
    cliUsername: 'admin',
    cliPassword: 'admin123',
    webUserAccount: 'Enabled',
    webUserName: 'user',
    webUserPassword: 'user123',
    webAdminAccount: 'Enabled',
    webAdminName: 'admin',
    webAdminPassword: 'admin456',
  });

  // Estados originais para comparação
  const [originalSecurityConfig, setOriginalSecurityConfig] = useState({
    tpAccessFromWan: 'Disabled',
    ftpAccessFromLan: 'Enabled',
    userInterfaceAccessFromWan: 'Disabled',
    userInterfaceAccessFromLan: 'Enabled',
    sshAccessFromWan: 'Disabled',
    sshAccessFromLan: 'Enabled',
    sambaAccessFromWan: 'Disabled',
    sambaAccessFromLan: 'Enabled',
    telnetAccessFromWan: 'Disabled',
    telnetAccessFromLan: 'Disabled',
    wanIcmpEchoReply: 'Block',
    sshService: 'Enabled',
    telnetService: 'Disabled',
    cliUsername: 'admin',
    cliPassword: 'admin123',
    webUserAccount: 'Enabled',
    webUserName: 'user',
    webUserPassword: 'user123',
    webAdminAccount: 'Enabled',
    webAdminName: 'admin',
    webAdminPassword: 'admin456',
  });

  // Verificar se houve mudanças no Security
  const hasSecurityChanges =
    JSON.stringify(securityConfig) !== JSON.stringify(originalSecurityConfig);

  // Função para salvar alterações de Security
  const handleSaveSecurity = () => {
    setOriginalSecurityConfig({ ...securityConfig });
  };

  useEffect(() => {
    const loadONUData = async () => {
      setLoading(true);

      // Simular carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Encontrar ONU nos dados provisionados
      const onu = provisionedONUs.find((item) => item.id === id);

      if (onu) {
        const onuData: ONUDetails = {
          id: onu.id,
          serialNumber: onu.serialNumber,
          model: onu.onuType,
          customerName: onu.clientName,
          oltName: onu.oltName,
          board: onu.board.toString(),
          port: onu.port.toString(),
          status: onu.status,
          authorizedAt: onu.authorizedAt,
          ip: '192.168.2.1',
          temperature: 45,
        };

        setOnuDetails(onuData);
      }

      setLoading(false);
    };

    if (id) {
      loadONUData();
    }
  }, [id, provisionedONUs]);

  // Dados simulados do histórico de alterações
  const historicoAlteracoes = [
    {
      id: '1',
      usuario: 'João Silva',
      usuarioAvatar: '',
      dataHora: '2024-01-15T14:30:00',
      acao: 'editado' as const,
      campo: 'Configuração WiFi',
      valorAnterior: 'SSID: WiFi_Antigo',
      valorNovo: 'SSID: RJChronos_WiFi',
      descricao: 'Alterou o nome da rede WiFi principal',
    },
    {
      id: '2',
      usuario: 'Maria Santos',
      usuarioAvatar: '',
      dataHora: '2024-01-15T10:15:00',
      acao: 'configurado' as const,
      campo: 'Porta LAN',
      valorAnterior: 'Porta 2: Inativa',
      valorNovo: 'Porta 2: Ativa - 100Mbps',
      descricao: 'Ativou a porta LAN 2 com limite de velocidade',
    },
    {
      id: '3',
      usuario: 'Carlos Oliveira',
      usuarioAvatar: '',
      dataHora: '2024-01-14T16:45:00',
      acao: 'visualizado' as const,
      descricao: 'Visualizou as configurações gerais do equipamento',
    },
    {
      id: '4',
      usuario: 'Ana Costa',
      usuarioAvatar: '',
      dataHora: '2024-01-14T09:20:00',
      acao: 'editado' as const,
      campo: 'Configuração de Segurança',
      valorAnterior: 'WEP',
      valorNovo: 'WPA2',
      descricao: 'Atualizou protocolo de segurança WiFi',
    },
    {
      id: '5',
      usuario: 'Pedro Fernandes',
      usuarioAvatar: '',
      dataHora: '2024-01-13T11:30:00',
      acao: 'configurado' as const,
      campo: 'Primeiro Setup',
      descricao: 'Realizou configuração inicial do equipamento',
    },
  ];

  const renderContent = () => {
    if (!onuDetails) return null;

    switch (selectedMenuItem) {
      case 'general':
        return (
          <Grid
            container
            spacing={2}
            sx={{
              '& .MuiGrid-item': {
                transition: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fabricante
              </Typography>
              <Typography variant="body1" fontWeight="500">
                ZTE Corporation
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nome do modelo
              </Typography>
              <Typography variant="body1" fontWeight="500">
                {onuDetails.model}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Versão do Software
              </Typography>
              <Typography variant="body1" fontWeight="500">
                V2.1.3_220825
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Versão do hardware
              </Typography>
              <Typography variant="body1" fontWeight="500">
                V1.0
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Número de série
              </Typography>
              <Typography variant="body1" fontWeight="500">
                {onuDetails.serialNumber}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Temperatura do transceptor GPON
              </Typography>
              <Typography variant="body1" fontWeight="500">
                {onuDetails.temperature}°C
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uso da CPU
              </Typography>
              <Typography variant="body1" fontWeight="500">
                12%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total de RAM
              </Typography>
              <Typography variant="body1" fontWeight="500">
                128 MB
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                RAM livre
              </Typography>
              <Typography variant="body1" fontWeight="500">
                95 MB
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tempo de atividade
              </Typography>
              <Typography variant="body1" fontWeight="500">
                15 dias, 8 horas, 23 minutos
              </Typography>
            </Grid>
          </Grid>
        );
      case 'lan-dhcp':
        return (
          <Box>
            <Grid
              container
              spacing={2}
              sx={{
                '& .MuiGrid-item': {
                  transition: 'none !important',
                  transform: 'none !important',
                },
              }}
            >
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  LAN IP interface
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.lanIpInterface}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      lanIpInterface: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  LAN IP NETMASK
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.lanIpNetmask}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      lanIpNetmask: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP server Ativo
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={lanDhcpConfig.dhcpServerActive}
                    onChange={(e) =>
                      setLanDhcpConfig((prev) => ({
                        ...prev,
                        dhcpServerActive: e.target.value,
                      }))
                    }
                    sx={{ borderRadius: 2 }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    <MenuItem value="Sim">Sim</MenuItem>
                    <MenuItem value="Não">Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP IP Pool Mínimo de endereços
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.dhcpIpPoolMin}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      dhcpIpPoolMin: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP IP Pool Máximo de endereços
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.dhcpIpPoolMax}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      dhcpIpPoolMax: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP Subnet máscara
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.dhcpSubnetMask}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      dhcpSubnetMask: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP Gateway padrão
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.dhcpGateway}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      dhcpGateway: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  DHCP DNS Servers
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={lanDhcpConfig.dhcpDnsServers}
                  onChange={(e) =>
                    setLanDhcpConfig((prev) => ({
                      ...prev,
                      dhcpDnsServers: e.target.value,
                    }))
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>

            {/* Botão de Salvar - só aparece quando há alterações */}
            {hasLanDhcpChanges && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveLanDhcp}
                  sx={{ borderRadius: 2 }}
                >
                  Salvar Alterações
                </Button>
              </Box>
            )}
          </Box>
        );
      case 'wifi':
        return (
          <Box>
            {!selectedWifiLan ? (
              // Lista de redes WiFi
              <Grid container spacing={2}>
                {Object.entries(wifiNetworks).map(([key, network]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        boxShadow: 'none',
                        cursor: 'pointer',
                        transition: 'none !important',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 'none !important',
                          transform: 'none !important',
                        },
                      }}
                      onClick={() => setSelectedWifiLan(key)}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={1.5}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="600"
                              color="primary.main"
                            >
                              {network.name}
                            </Typography>
                            <Chip
                              label={network.band}
                              size="small"
                              color={network.band === '5G' ? 'success' : 'info'}
                              variant="outlined"
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              SSID: <strong>{network.ssid}</strong>
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Chip
                              label={network.status}
                              size="small"
                              color={
                                network.status === 'Ativo'
                                  ? 'success'
                                  : 'default'
                              }
                            />
                            <Typography variant="body2" color="text.secondary">
                              {network.totalAssociations} dispositivos
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Detalhes da rede WiFi selecionada
              <Box>
                {/* Botão Voltar */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedWifiLan('')}
                    sx={{ borderRadius: 2 }}
                  >
                    ← Voltar
                  </Button>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ ml: 2, color: 'primary.main' }}
                  >
                    {
                      wifiNetworks[selectedWifiLan as keyof typeof wifiNetworks]
                        ?.name
                    }{' '}
                    -{' '}
                    {
                      wifiNetworks[selectedWifiLan as keyof typeof wifiNetworks]
                        ?.band
                    }
                  </Typography>
                </Box>

                {/* Detalhes completos da rede */}
                <Grid
                  container
                  spacing={2}
                  sx={{
                    '& .MuiGrid-item': {
                      transition: 'none !important',
                      transform: 'none !important',
                    },
                  }}
                >
                  {(() => {
                    const network =
                      wifiNetworks[
                        selectedWifiLan as keyof typeof wifiNetworks
                      ];
                    if (!network) return null;

                    return (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            SSID
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={network.ssid}
                            onChange={(e) =>
                              updateWifiNetwork(
                                selectedWifiLan,
                                'ssid',
                                e.target.value
                              )
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Password
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            value={network.password}
                            onChange={(e) =>
                              updateWifiNetwork(
                                selectedWifiLan,
                                'password',
                                e.target.value
                              )
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Authentication mode
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.authMode}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'authMode',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Open">Open</MenuItem>
                              <MenuItem value="WEP">WEP</MenuItem>
                              <MenuItem value="WPA-PSK">WPA-PSK</MenuItem>
                              <MenuItem value="WPA2-PSK">WPA2-PSK</MenuItem>
                              <MenuItem value="WPA3-PSK">WPA3-PSK</MenuItem>
                              <MenuItem value="WPA/WPA2-PSK">
                                WPA/WPA2-PSK
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Status
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.status}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'status',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Ativo">Ativo</MenuItem>
                              <MenuItem value="Inativo">Inativo</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Enable
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.enabled ? 'Sim' : 'Não'}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'enabled',
                                  e.target.value === 'Sim'
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Sim">Sim</MenuItem>
                              <MenuItem value="Não">Não</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            RF Band
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.rfBand}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'rfBand',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="2.4GHz">2.4GHz</MenuItem>
                              <MenuItem value="5GHz">5GHz</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Standard
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.standard}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'standard',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="802.11b">802.11b</MenuItem>
                              <MenuItem value="802.11g">802.11g</MenuItem>
                              <MenuItem value="802.11n">802.11n</MenuItem>
                              <MenuItem value="802.11ac">802.11ac</MenuItem>
                              <MenuItem value="802.11ax">802.11ax</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Radio Enabled
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.radioEnabled ? 'Sim' : 'Não'}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'radioEnabled',
                                  e.target.value === 'Sim'
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Sim">Sim</MenuItem>
                              <MenuItem value="Não">Não</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Total associations
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={network.totalAssociations}
                            onChange={(e) =>
                              updateWifiNetwork(
                                selectedWifiLan,
                                'totalAssociations',
                                parseInt(e.target.value) || 0
                              )
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            SSID Advertisement Enabled
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.ssidAdvertisement ? 'Sim' : 'Não'}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'ssidAdvertisement',
                                  e.target.value === 'Sim'
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Sim">Sim</MenuItem>
                              <MenuItem value="Não">Não</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            WPA Encryption
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.wpaEncryption}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'wpaEncryption',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="TKIP">TKIP</MenuItem>
                              <MenuItem value="AES">AES</MenuItem>
                              <MenuItem value="TKIP+AES">TKIP+AES</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Channel width
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.channelWidth}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'channelWidth',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="20MHz">20MHz</MenuItem>
                              <MenuItem value="40MHz">40MHz</MenuItem>
                              <MenuItem value="80MHz">80MHz</MenuItem>
                              <MenuItem value="160MHz">160MHz</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Auto channel
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.autoChannel ? 'Sim' : 'Não'}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'autoChannel',
                                  e.target.value === 'Sim'
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Sim">Sim</MenuItem>
                              <MenuItem value="Não">Não</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Channel
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={network.channel}
                            onChange={(e) =>
                              updateWifiNetwork(
                                selectedWifiLan,
                                'channel',
                                parseInt(e.target.value) || 1
                              )
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Country Regulatory Domain
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.countryDomain}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'countryDomain',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="BR">BR - Brasil</MenuItem>
                              <MenuItem value="US">
                                US - Estados Unidos
                              </MenuItem>
                              <MenuItem value="EU">EU - Europa</MenuItem>
                              <MenuItem value="JP">JP - Japão</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Tx Power
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={network.txPower}
                              onChange={(e) =>
                                updateWifiNetwork(
                                  selectedWifiLan,
                                  'txPower',
                                  e.target.value
                                )
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="25%">25%</MenuItem>
                              <MenuItem value="50%">50%</MenuItem>
                              <MenuItem value="75%">75%</MenuItem>
                              <MenuItem value="100%">100%</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    );
                  })()}
                </Grid>

                {/* Botão de Salvar - só aparece quando há alterações */}
                {hasWifiChanges(selectedWifiLan) && (
                  <Box
                    sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={() => handleSaveWifi(selectedWifiLan)}
                      sx={{ borderRadius: 2 }}
                    >
                      Salvar Alterações
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      case 'hosts':
        return (
          <Box>
            {/* Resumo dos dispositivos */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        fontWeight="600"
                        color="primary.main"
                      >
                        {connectedHosts.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Dispositivos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        fontWeight="600"
                        color="success.main"
                      >
                        {connectedHosts.filter((host) => host.active).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dispositivos Ativos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        fontWeight="600"
                        color="error.main"
                      >
                        {connectedHosts.filter((host) => !host.active).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dispositivos Inativos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Tabela de dispositivos */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                boxShadow: 'none',
                transition: 'none !important',
                '&:hover': {
                  boxShadow: 'none !important',
                },
                overflowX: 'hidden',
              }}
            >
              <Table
                size="small"
                sx={{
                  tableLayout: 'fixed',
                  width: '100%',
                }}
                aria-label="tabela de hosts conectados"
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '50px',
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '140px',
                      }}
                    >
                      MAC ADDRESS
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '120px',
                      }}
                    >
                      IP ADDRESS
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '120px',
                      }}
                    >
                      SOURCE
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '140px',
                      }}
                    >
                      HOSTNAME
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '80px',
                      }}
                    >
                      PORT
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'text.primary',
                        width: '80px',
                      }}
                    >
                      STATUS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connectedHosts.map((host) => (
                    <TableRow
                      key={host.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: 'none !important',
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="primary.main"
                        >
                          {host.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {host.macAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {host.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={host.addressSource}
                          size="small"
                          color={
                            host.addressSource === 'DHCP' ? 'info' : 'warning'
                          }
                          variant="outlined"
                          sx={{
                            fontSize: '11px',
                            transition: 'none !important',
                            '&:hover': { transform: 'none !important' },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {host.hostname}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={host.port}
                          size="small"
                          color={
                            host.port.includes('WiFi') ? 'primary' : 'secondary'
                          }
                          variant="outlined"
                          sx={{
                            fontSize: '10px',
                            height: '22px',
                            transition: 'none !important',
                            '&:hover': { transform: 'none !important' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={host.active ? 'Ativo' : 'Inativo'}
                          size="small"
                          color={host.active ? 'success' : 'error'}
                          sx={{
                            fontSize: '10px',
                            height: '22px',
                            transition: 'none !important',
                            '&:hover': { transform: 'none !important' },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      case 'lan-ports':
        return (
          <Box>
            <Stack spacing={3}>
              {/* Porta 1 */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Porta 1 - LAN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Nome
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        LAN1
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Ativo
                      </Typography>
                      <Chip label="Sim" color="success" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip label="Conectado" color="success" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Velocidade
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        1000 Mbps
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Duplex
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        Full
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Porta 2 */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': { boxShadow: 'none !important' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Porta 2 - LAN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Nome
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        LAN2
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Ativo
                      </Typography>
                      <Chip label="Não" color="default" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip label="Desconectado" color="error" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Velocidade
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="500"
                        color="text.secondary"
                      >
                        -
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Duplex
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="500"
                        color="text.secondary"
                      >
                        -
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Porta 3 */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': { boxShadow: 'none !important' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Porta 3 - LAN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Nome
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        LAN3
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Ativo
                      </Typography>
                      <Chip label="Sim" color="success" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip label="Conectado" color="success" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Velocidade
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        100 Mbps
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Duplex
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        Full
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Porta 4 */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': { boxShadow: 'none !important' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Porta 4 - LAN
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Nome
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        LAN4
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Ativo
                      </Typography>
                      <Chip label="Não" color="default" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip label="Desconectado" color="error" size="small" />
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Velocidade
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="500"
                        color="text.secondary"
                      >
                        -
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Duplex
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="500"
                        color="text.secondary"
                      >
                        -
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        );
      case 'device-logs':
        return (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Últimos eventos do sistema
            </Typography>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Stack spacing={1}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                >
                  <strong>2024-01-15 16:30:25</strong> - Sistema iniciado
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                >
                  <strong>2024-01-15 16:30:45</strong> - WiFi configurado
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                >
                  <strong>2024-01-15 16:31:00</strong> - DHCP ativo
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                >
                  <strong>2024-01-15 16:31:15</strong> - Primeira conexão de
                  cliente
                </Typography>
              </Stack>
            </Box>
          </Stack>
        );
      case 'troubleshooting':
        return (
          <Box>
            {!selectedTroubleshootingTest ? (
              // Lista de testes disponíveis
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none !important',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 'none !important',
                      },
                    }}
                    onClick={() => setSelectedTroubleshootingTest('ip-ping')}
                  >
                    <CardContent
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color="primary.main"
                      >
                        IP PING
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none !important',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 'none !important',
                      },
                    }}
                    onClick={() =>
                      setSelectedTroubleshootingTest('download-test')
                    }
                  >
                    <CardContent
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color="primary.main"
                      >
                        Download Test
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none !important',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 'none !important',
                      },
                    }}
                    onClick={() =>
                      setSelectedTroubleshootingTest('upload-test')
                    }
                  >
                    <CardContent
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color="primary.main"
                      >
                        Upload Test
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      transition: 'none !important',
                      height: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 'none !important',
                      },
                    }}
                    onClick={() =>
                      setSelectedTroubleshootingTest('trace-route')
                    }
                  >
                    <CardContent
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color="primary.main"
                      >
                        Trace Route
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              // Detalhes do teste selecionado
              <Box>
                {/* Botão Voltar */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTroubleshootingTest('')}
                    sx={{ borderRadius: 2 }}
                  >
                    ← Voltar
                  </Button>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ ml: 2, color: 'primary.main' }}
                  >
                    {selectedTroubleshootingTest === 'ip-ping' &&
                      'IP PING - Teste de Conectividade'}
                    {selectedTroubleshootingTest === 'download-test' &&
                      'Download Test - Teste de Velocidade'}
                    {selectedTroubleshootingTest === 'upload-test' &&
                      'Upload Test - Teste de Velocidade'}
                    {selectedTroubleshootingTest === 'trace-route' &&
                      'Trace Route - Rastreamento de Rota'}
                  </Typography>
                </Box>

                {/* Conteúdo específico do teste */}
                {selectedTroubleshootingTest === 'ip-ping' && (
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Configurações do Teste PING
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Endereço IP de Destino
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Ex: 8.8.8.8"
                            defaultValue="8.8.8.8"
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Número de Pacotes
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={4}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Tamanho do Pacote (bytes)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={64}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Timeout (segundos)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={5}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                      </Grid>
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          sx={{ borderRadius: 2, px: 4 }}
                        >
                          Executar Teste PING
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {selectedTroubleshootingTest === 'download-test' && (
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Teste de Velocidade de Download
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Servidor de Teste
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              defaultValue="auto"
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="auto">Automático</MenuItem>
                              <MenuItem value="speedtest.net">
                                Speedtest.net
                              </MenuItem>
                              <MenuItem value="fast.com">Fast.com</MenuItem>
                              <MenuItem value="custom">Personalizado</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Duração do Teste (segundos)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={30}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                      </Grid>
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          sx={{ borderRadius: 2, px: 4 }}
                        >
                          Iniciar Teste de Download
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {selectedTroubleshootingTest === 'upload-test' && (
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Teste de Velocidade de Upload
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Servidor de Teste
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              defaultValue="auto"
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="auto">Automático</MenuItem>
                              <MenuItem value="speedtest.net">
                                Speedtest.net
                              </MenuItem>
                              <MenuItem value="fast.com">Fast.com</MenuItem>
                              <MenuItem value="custom">Personalizado</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Duração do Teste (segundos)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={30}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                      </Grid>
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          sx={{ borderRadius: 2, px: 4 }}
                        >
                          Iniciar Teste de Upload
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {selectedTroubleshootingTest === 'trace-route' && (
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'primary.main' }}
                      >
                        Rastreamento de Rota de Rede
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Endereço de Destino
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Ex: google.com ou 8.8.8.8"
                            defaultValue="google.com"
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Máximo de Saltos
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={30}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Timeout por Salto (segundos)
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            defaultValue={5}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Resolver Nomes
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              defaultValue="true"
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="true">Sim</MenuItem>
                              <MenuItem value="false">Não</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <Box
                        sx={{
                          mt: 3,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          sx={{ borderRadius: 2, px: 4 }}
                        >
                          Executar Trace Route
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Box>
        );
      case 'security':
        return (
          <Box>
            <Stack spacing={3}>
              {/* Seção: Acessos de Serviços */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Acessos de Serviços
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        TP access from WAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.tpAccessFromWan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              tpAccessFromWan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        FTP access from LAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.ftpAccessFromLan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              ftpAccessFromLan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        User interface access from WAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.userInterfaceAccessFromWan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              userInterfaceAccessFromWan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        User interface access from LAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.userInterfaceAccessFromLan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              userInterfaceAccessFromLan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        SSH access from WAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.sshAccessFromWan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              sshAccessFromWan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        SSH access from LAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.sshAccessFromLan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              sshAccessFromLan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Samba access from WAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.sambaAccessFromWan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              sambaAccessFromWan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Samba access from LAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.sambaAccessFromLan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              sambaAccessFromLan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Telnet access from WAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.telnetAccessFromWan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              telnetAccessFromWan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Telnet access from LAN
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.telnetAccessFromLan}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              telnetAccessFromLan: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Seção: Configurações de Rede */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Configurações de Rede
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        WAN ICMP Echo reply
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.wanIcmpEchoReply}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              wanIcmpEchoReply: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Block">Block</MenuItem>
                          <MenuItem value="Permit">Permit</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        SSH Service
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.sshService}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              sshService: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Telnet Service
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={securityConfig.telnetService}
                          onChange={(e) =>
                            setSecurityConfig((prev) => ({
                              ...prev,
                              telnetService: e.target.value,
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                          MenuProps={{ disableScrollLock: true }}
                        >
                          <MenuItem value="Enabled">Enabled</MenuItem>
                          <MenuItem value="Disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Seção: Credenciais CLI */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Credenciais CLI
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        CLI Username
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={securityConfig.cliUsername}
                        onChange={(e) =>
                          setSecurityConfig((prev) => ({
                            ...prev,
                            cliUsername: e.target.value,
                          }))
                        }
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        CLI Password
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        value={securityConfig.cliPassword}
                        onChange={(e) =>
                          setSecurityConfig((prev) => ({
                            ...prev,
                            cliPassword: e.target.value,
                          }))
                        }
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Seção: Contas Web */}
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'none !important',
                  '&:hover': {
                    boxShadow: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, color: 'primary.main' }}
                  >
                    Contas de Acesso Web
                  </Typography>
                  <Grid container spacing={4}>
                    {/* Coluna Esquerda - Web User */}
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="body1"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'text.primary' }}
                      >
                        Usuário Web
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web user Account
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={securityConfig.webUserAccount}
                              onChange={(e) =>
                                setSecurityConfig((prev) => ({
                                  ...prev,
                                  webUserAccount: e.target.value,
                                }))
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Enabled">Enabled</MenuItem>
                              <MenuItem value="Disabled">Disabled</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web user name
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={securityConfig.webUserName}
                            onChange={(e) =>
                              setSecurityConfig((prev) => ({
                                ...prev,
                                webUserName: e.target.value,
                              }))
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web user password
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            value={securityConfig.webUserPassword}
                            onChange={(e) =>
                              setSecurityConfig((prev) => ({
                                ...prev,
                                webUserPassword: e.target.value,
                              }))
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Coluna Direita - Web Admin */}
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="body1"
                        fontWeight="600"
                        sx={{ mb: 2, color: 'text.primary' }}
                      >
                        Administrador Web
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web admin account
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={securityConfig.webAdminAccount}
                              onChange={(e) =>
                                setSecurityConfig((prev) => ({
                                  ...prev,
                                  webAdminAccount: e.target.value,
                                }))
                              }
                              sx={{ borderRadius: 2 }}
                              MenuProps={{ disableScrollLock: true }}
                            >
                              <MenuItem value="Enabled">Enabled</MenuItem>
                              <MenuItem value="Disabled">Disabled</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web admin name
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={securityConfig.webAdminName}
                            onChange={(e) =>
                              setSecurityConfig((prev) => ({
                                ...prev,
                                webAdminName: e.target.value,
                              }))
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Web admin password
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            value={securityConfig.webAdminPassword}
                            onChange={(e) =>
                              setSecurityConfig((prev) => ({
                                ...prev,
                                webAdminPassword: e.target.value,
                              }))
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>

            {/* Botão de Salvar - só aparece quando há alterações */}
            {hasSecurityChanges && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSecurity}
                  sx={{ borderRadius: 2 }}
                >
                  Salvar Alterações
                </Button>
              </Box>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            ONU não encontrada
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      </Box>

      <Grid
        container
        spacing={3}
        sx={{
          '& .MuiGrid-item': {
            transition: 'none !important',
            transform: 'none !important',
          },
          '& .MuiGrid-root': {
            transition: 'none !important',
            transform: 'none !important',
          },
        }}
      >
        {/* Equipment Information and 3D Model */}
        <Grid item xs={12}>
          <Card
            sx={{
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              transition: 'none !important',
              '&:hover': {
                boxShadow: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={4}>
                {/* Left Side - Equipment Info */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <RouterOutlined
                        sx={{ mr: 1, color: 'primary.main', fontSize: 24 }}
                      />
                      Equipamento: {onuDetails.serialNumber}
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} sx={{ maxWidth: 300 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        Pertence a: {onuDetails.customerName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        OLT: {onuDetails.oltName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        SLOT: {onuDetails.board}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        PON: {onuDetails.port}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        TR-069
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        SN: {onuDetails.serialNumber}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight="500"
                      >
                        Status:{' '}
                        {onuDetails.status === 'online' ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '12px' }}
                      >
                        Autorizado em:{' '}
                        {new Date(onuDetails.authorizedAt).toLocaleDateString(
                          'pt-BR'
                        )}{' '}
                        às{' '}
                        {new Date(onuDetails.authorizedAt).toLocaleTimeString(
                          'pt-BR'
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Link
                        href="#"
                        color="primary"
                        underline="hover"
                        sx={{
                          fontWeight: 500,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          setHistoricoModalOpen(true);
                        }}
                      >
                        Histórico de alterações
                      </Link>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Side - 3D Model Area */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* 3D Device Model */}
                    <Box
                      sx={{
                        width: 150,
                        height: 100,
                        border: '2px solid #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        animation: 'rotate 4s linear infinite',
                        '@keyframes rotate': {
                          '0%': { transform: 'rotateY(0deg)' },
                          '100%': { transform: 'rotateY(360deg)' },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 25,
                          border: '1px solid #999',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#000',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#0088ff',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        >
                          0000
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Options Grid */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              transition: 'none !important',
              '&:hover': {
                boxShadow: 'none !important',
                transform: 'none !important',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Opções de Configuração
              </Typography>

              <Grid
                container
                spacing={2}
                sx={{
                  '& .MuiGrid-item': {
                    transition: 'none !important',
                    transform: 'none !important',
                  },
                }}
              >
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Grid item xs={12} sm={6} key={item.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border:
                            selectedMenuItem === item.id
                              ? '2px solid'
                              : '1px solid',
                          borderColor:
                            selectedMenuItem === item.id
                              ? 'primary.main'
                              : 'divider',
                          backgroundColor:
                            selectedMenuItem === item.id
                              ? 'rgba(25, 118, 210, 0.04)'
                              : 'background.paper',
                          boxShadow: 'none',
                          transition: 'none !important',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            boxShadow: 'none !important',
                            transform: 'none !important',
                          },
                        }}
                        onClick={() => setSelectedMenuItem(item.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            <IconComponent
                              color={
                                selectedMenuItem === item.id
                                  ? 'primary'
                                  : 'action'
                              }
                              fontSize="medium"
                            />
                            <Typography
                              variant="body1"
                              fontWeight={
                                selectedMenuItem === item.id ? 600 : 500
                              }
                              color={
                                selectedMenuItem === item.id
                                  ? 'primary.main'
                                  : 'text.primary'
                              }
                            >
                              {item.label}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Content Panel */}
        {selectedMenuItem && (
          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                transition: 'none !important',
                '&:hover': {
                  boxShadow: 'none !important',
                  transform: 'none !important',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                  {
                    menuItems.find((item) => item.id === selectedMenuItem)
                      ?.label
                  }
                </Typography>
                {renderContent()}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Modal de Histórico de Alterações */}
      <HistoricoAlteracoesModal
        open={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        equipamentoId={onuDetails.id}
        equipamentoNome={onuDetails.serialNumber}
        historico={historicoAlteracoes}
      />
    </Container>
  );
};

export default ONUConfiguration;
