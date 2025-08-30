import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProvisioning } from '../contexts/ProvisioningContext';
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
  Switch,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Wifi,
  Router,
  Save,
  Cancel,
  RestartAlt,
  Delete,
  Sync,
  SettingsBackupRestore,
  Edit,
  WifiOff,
  Cable,
  Add,
  History,
  Close,
} from '@mui/icons-material';
import useTitle from '../hooks/useTitle';
import AnimatedCard from '../components/common/AnimatedCard';

// Interfaces
interface ONUDetails {
  id: string;
  serialNumber: string;
  model: string;
  vendor: string;
  macAddress: string;
  oltName: string;
  board: string;
  port: string;
  onuType: string;
  customerName: string;
  customerAddress: string;
  comment: string;
  authorizedAt: string;
  status: 'online' | 'offline' | 'powered_off';
  uptime: string;
  rxPower: number;
  attachedVlans: string[];
  onuMode: 'routing' | 'bridge';
  tr069Profile: string;
  wanSetupMode: 'dhcp' | 'static' | 'pppoe';
  pppoeUsername?: string;
  pppoePassword?: string;
  imageUrl: string;
}

interface HistoryEntry {
  id: string;
  user: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  description: string;
}

interface WANConfiguration {
  vlanId: string;
  onuMode: 'Routing' | 'Bridging';
  wanMode: 'Setup via ONU webpage' | 'PPPoE' | 'DHCP' | 'Static IP';
  connectionType: 'DHCP' | 'Static IP' | 'PPPoE';
  configMethod: 'OMCI' | 'TR069';
  ipProtocol: 'IPv4' | 'Dual stack IPv4/IPv6';
  ipv6Address: 'DHCPv6' | 'Auto' | 'Static' | 'None';
  ipv6Prefix: 'DHCPv6-PD' | 'Static' | 'None';
  username: string;
  password: string;
  wanRemoteAccess: 'Disabled / not set' | 'Enabled';
}

interface EthernetPort {
  port: number;
  mode: 'Lan' | 'Access' | 'Hybrid' | 'Trunk' | 'Transparent';
  dhcp: 'enabled' | 'disabled';
}

interface WiFiInterface {
  band: '2.4GHz' | '5GHz';
  enabled: boolean;
  ssid: string;
  password: string;
  channel: string | 'auto';
  power: number;
  maxClients: number;
  hidden: boolean;
}

const ONUConfigurationNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { provisionedONUs } = useProvisioning();
  
  useTitle('Configuração da ONU - RJ Chronos');

  // Encontrar a ONU provisionada pelo ID
  const currentONU = provisionedONUs.find(onu => onu.id === id);

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openVoipDialog, setOpenVoipDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'restart' | 'delete' | 'sync' | 'factory_reset' | null;
    title: string;
    message: string;
  }>({
    open: false,
    action: null,
    title: '',
    message: ''
  });

  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [ethernetPorts, setEthernetPorts] = useState<EthernetPort[]>([]);
  const [wifiInterfaces, setWifiInterfaces] = useState<WiFiInterface[]>([]);
  
  // Estados editáveis para configurações técnicas
  const [editableConfig, setEditableConfig] = useState({
    onuMode: 'routing' as 'routing' | 'bridge',
    tr069Profile: '',
    wanSetupMode: 'pppoe' as 'dhcp' | 'static' | 'pppoe',
    attachedVlans: [] as string[],
    pppoeUsername: '',
    pppoePassword: '',
    newVlan: '', // Para adicionar novas VLANs
    voipEnabled: false,
    voipSettings: {
      sipServer: '',
      sipUser: '',
      sipPassword: '',
      displayName: '',
    },
  });

  // Estados editáveis para informações do cliente
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerAddress: '',
    comment: '',
  });

  // Estados para modal de histórico
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);

  // Estados para modal de configuração de porta
  const [portConfigModalOpen, setPortConfigModalOpen] = useState(false);
  const [selectedPortIndex, setSelectedPortIndex] = useState<number | null>(null);
  const [tempPortConfig, setTempPortConfig] = useState<EthernetPort | null>(null);

  // Estados para modal de configuração WAN
  const [wanConfigModalOpen, setWanConfigModalOpen] = useState(false);
  const [wanConfig, setWanConfig] = useState<WANConfiguration>({
    vlanId: '105 - PADRAO-PPPoE-CLI',
    onuMode: 'Routing',
    wanMode: 'PPPoE',
    connectionType: 'PPPoE',
    configMethod: 'TR069',
    ipProtocol: 'Dual stack IPv4/IPv6',
    ipv6Address: 'Auto',
    ipv6Prefix: 'DHCPv6-PD',
    username: '',
    password: '',
    wanRemoteAccess: 'Disabled / not set'
  });

  // Carregar dados da ONU
  useEffect(() => {
    const loadONUData = async () => {
      setLoading(true);
      
      // Se não encontrou a ONU, redirecionar para a lista de provisionamento
      if (!currentONU) {
        navigate('/dashboard/provisionar');
        return;
      }
      
      // Simular um pequeno delay para loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const onuDetails: ONUDetails = {
        id: currentONU.id,
        serialNumber: currentONU.serialNumber,
        model: currentONU.onuType.split(' ').pop() || currentONU.onuType,
        vendor: currentONU.onuType.split(' ')[0] || 'Unknown',
        macAddress: '00:11:22:33:44:55', // Mock - seria obtido via TR069
        oltName: currentONU.oltName,
        board: `${currentONU.board}`,
        port: `${currentONU.port}`,
        onuType: currentONU.onuType,
        customerName: currentONU.clientName,
        customerAddress: currentONU.clientAddress,
        comment: currentONU.comment || '',
        authorizedAt: new Date(currentONU.authorizedAt).toLocaleString('pt-BR'),
        status: currentONU.status === 'online' ? 'online' : 'offline',
        uptime: currentONU.uptime,
        rxPower: currentONU.onuRx,
        attachedVlans: currentONU.attachedVlans.map(vlan => vlan.toString()),
        onuMode: currentONU.onuMode,
        tr069Profile: currentONU.tr069Profile,
        wanSetupMode: currentONU.wanSetupMode,
        pppoeUsername: currentONU.pppoeUsername || '',
        pppoePassword: currentONU.pppoePassword || '',
        imageUrl: '/static/devices/huawei-hg8245h.png'
      };
      
      setOnuDetails(onuDetails);
      
      // Inicializar configurações editáveis
      setEditableConfig({
        onuMode: currentONU.onuMode,
        tr069Profile: currentONU.tr069Profile,
        wanSetupMode: currentONU.wanSetupMode,
        attachedVlans: currentONU.attachedVlans.map(vlan => vlan.toString()),
        pppoeUsername: currentONU.pppoeUsername || '',
        pppoePassword: currentONU.pppoePassword || '',
        newVlan: '',
        voipEnabled: currentONU.voipEnabled || false,
        voipSettings: currentONU.voipSettings || {
          sipServer: '',
          sipUser: '',
          sipPassword: '',
          displayName: '',
        },
      });

      // Inicializar informações do cliente
      setCustomerInfo({
        customerName: currentONU.clientName,
        customerAddress: currentONU.clientAddress,
        comment: currentONU.comment || '',
      });
      
      // Mock ethernet ports
      setEthernetPorts([
        { port: 1, mode: 'Access', dhcp: 'enabled' },
        { port: 2, mode: 'Lan', dhcp: 'enabled' },
        { port: 3, mode: 'Hybrid', dhcp: 'disabled' },
        { port: 4, mode: 'Trunk', dhcp: 'enabled' },
      ]);

      // Configurar interfaces WiFi a partir dos dados da ONU
      const wifiInterfaces = currentONU.wifiSettings.map((wifiConfig) => ({
        band: (wifiConfig.frequency === '2.4GHz' ? '2.4GHz' : '5GHz') as '2.4GHz' | '5GHz',
        enabled: wifiConfig.enabled,
        ssid: wifiConfig.ssid,
        password: wifiConfig.password,
        channel: wifiConfig.channel.toString(),
        power: 75, // Mock - seria obtido via TR069
        maxClients: 32, // Mock - seria obtido via TR069
        hidden: false // Mock - seria obtido via TR069
      }));
      
      setWifiInterfaces(wifiInterfaces);
      
      // Mock histórico de alterações
      setHistoryData([
        {
          id: '1',
          user: 'João Silva (admin)',
          action: 'Configuração',
          field: 'Wi-Fi SSID',
          oldValue: 'CHRONOS_5678_OLD',
          newValue: 'CHRONOS_5678_2G',
          timestamp: '2024-08-29 14:30:15',
          description: 'Alteração do nome da rede Wi-Fi 2.4GHz'
        },
        {
          id: '2',
          user: 'Maria Santos (tecnico)',
          action: 'Configuração',
          field: 'VLAN',
          oldValue: '100',
          newValue: '100, 200',
          timestamp: '2024-08-29 13:45:22',
          description: 'Adicionada VLAN 200 para serviços especiais'
        },
        {
          id: '3',
          user: 'Pedro Costa (admin)',
          action: 'Dados do Cliente',
          field: 'Endereço',
          oldValue: 'Rua das Flores, 123',
          newValue: 'Rua das Flores, 123 - Centro - Rio de Janeiro/RJ',
          timestamp: '2024-08-29 12:20:10',
          description: 'Atualização completa do endereço do cliente'
        },
        {
          id: '4',
          user: 'Ana Oliveira (tecnico)',
          action: 'Configuração',
          field: 'ONU Mode',
          oldValue: 'bridge',
          newValue: 'routing',
          timestamp: '2024-08-29 11:15:05',
          description: 'Alteração do modo de operação para routing'
        },
        {
          id: '5',
          user: 'Carlos Mendes (admin)',
          action: 'Sistema',
          field: 'PPPoE Username',
          oldValue: 'cliente.antigo@provedor.com.br',
          newValue: 'cliente.12345@provedor.com.br',
          timestamp: '2024-08-29 10:30:45',
          description: 'Atualização das credenciais PPPoE'
        },
        {
          id: '6',
          user: 'Sistema Automatico',
          action: 'Criação',
          field: 'ONU',
          oldValue: '-',
          newValue: 'Autorizada',
          timestamp: '2024-08-29 09:00:00',
          description: 'ONU autorizada e provisionada no sistema'
        }
      ]);
      
      setLoading(false);
    };

    loadONUData();
  }, [currentONU, navigate, id]);

  const handleSave = async () => {
    setSaving(true);
    
    // Simular salvamento das configurações (incluindo as editáveis)
    const configurationData = {
      ...editableConfig,
      customerInfo,         // Informações do cliente editáveis
      ethernetPorts,
      wifiInterfaces,
      onuId: id,
      timestamp: new Date().toISOString()
    };
    
    // Adicionar entrada ao histórico
    const newHistoryEntry: HistoryEntry = {
      id: Date.now().toString(),
      user: 'Usuário Atual (admin)', // Em produção, pegar do contexto de autenticação
      action: 'Configuração',
      field: 'Configuração Geral',
      oldValue: 'Configurações anteriores',
      newValue: 'Configurações atualizadas',
      timestamp: new Date().toLocaleString('pt-BR'),
      description: 'Aplicação das configurações editadas pelo usuário'
    };
    
    setHistoryData(prev => [newHistoryEntry, ...prev]);
    
    console.log('Salvando configurações:', configurationData);
    
    // Simular save API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navegar para página de status
    setSaving(false);
    navigate(`/dashboard/provisionar/${id}/status`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'powered_off': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'powered_off': return 'Desligado';
      default: return 'Desconhecido';
    }
  };

  const getSignalColor = (signal: number) => {
    if (signal >= -20) return 'success';
    if (signal >= -25) return 'warning';
    return 'error';
  };

  const handleAction = (action: 'restart' | 'delete' | 'sync' | 'factory_reset') => {
    const actionConfig = {
      restart: {
        title: 'Reiniciar Equipamento',
        message: 'Tem certeza que deseja reiniciar este equipamento? A operação pode levar alguns minutos.'
      },
      delete: {
        title: 'Deletar Equipamento',
        message: 'ATENÇÃO: Esta ação irá remover completamente o equipamento da rede. Esta operação é irreversível.'
      },
      sync: {
        title: 'Ressincronizar Configurações',
        message: 'Deseja ressincronizar as configurações do equipamento com o perfil padrão?'
      },
      factory_reset: {
        title: 'Restaurar Padrão de Fábrica',
        message: 'ATENÇÃO: Esta ação irá restaurar todas as configurações para o padrão de fábrica. Todas as personalizações serão perdidas.'
      }
    };

    setActionDialog({
      open: true,
      action,
      ...actionConfig[action]
    });
  };

  const executeAction = async () => {
    // Simular execução da ação
    await new Promise(resolve => setTimeout(resolve, 2000));
    setActionDialog({ open: false, action: null, title: '', message: '' });
    
    if (actionDialog.action === 'delete') {
      navigate('/dashboard/provisionar');
    }
  };

  const toggleWifiStatus = (wifiIndex: number) => {
    setWifiInterfaces(prev => prev.map((wifi, index) => 
      index === wifiIndex 
        ? { ...wifi, enabled: !wifi.enabled }
        : wifi
    ));
  };

  const handleAddVlan = () => {
    if (editableConfig.newVlan && !editableConfig.attachedVlans.includes(editableConfig.newVlan)) {
      setEditableConfig(prev => ({
        ...prev,
        attachedVlans: [...prev.attachedVlans, prev.newVlan],
        newVlan: ''
      }));
    }
  };

  const handleRemoveVlan = (vlanToRemove: string) => {
    setEditableConfig(prev => ({
      ...prev,
      attachedVlans: prev.attachedVlans.filter(vlan => vlan !== vlanToRemove)
    }));
  };

  const handleOpenPortConfig = (portIndex: number) => {
    setSelectedPortIndex(portIndex);
    setTempPortConfig({ ...ethernetPorts[portIndex] });
    setPortConfigModalOpen(true);
  };

  const handleSavePortConfig = () => {
    if (selectedPortIndex !== null && tempPortConfig) {
      setEthernetPorts(prev => prev.map((port, index) => 
        index === selectedPortIndex ? { ...tempPortConfig } : port
      ));
    }
    setPortConfigModalOpen(false);
    setSelectedPortIndex(null);
    setTempPortConfig(null);
  };

  const handleCancelPortConfig = () => {
    setPortConfigModalOpen(false);
    setSelectedPortIndex(null);
    setTempPortConfig(null);
  };

  const handleOpenWanConfig = () => {
    // Carregar configurações atuais da ONU para o modal
    setWanConfig({
      vlanId: '105 - PADRAO-PPPoE-CLI',
      onuMode: editableConfig.onuMode === 'routing' ? 'Routing' : 'Bridging',
      wanMode: editableConfig.wanSetupMode === 'pppoe' ? 'PPPoE' : 
               editableConfig.wanSetupMode === 'dhcp' ? 'DHCP' : 'Static IP',
      connectionType: editableConfig.wanSetupMode === 'pppoe' ? 'PPPoE' : 
                     editableConfig.wanSetupMode === 'dhcp' ? 'DHCP' : 'Static IP',
      configMethod: 'TR069',
      ipProtocol: 'Dual stack IPv4/IPv6',
      ipv6Address: 'Auto',
      ipv6Prefix: 'DHCPv6-PD',
      username: editableConfig.pppoeUsername || '',
      password: editableConfig.pppoePassword || '',
      wanRemoteAccess: 'Disabled / not set'
    });
    setWanConfigModalOpen(true);
  };

  const handleSaveWanConfig = () => {
    // Aplicar configurações WAN na configuração editável
    setEditableConfig(prev => ({
      ...prev,
      onuMode: wanConfig.onuMode === 'Routing' ? 'routing' : 'bridge',
      wanSetupMode: wanConfig.connectionType === 'PPPoE' ? 'pppoe' : 
                   wanConfig.connectionType === 'DHCP' ? 'dhcp' : 'static',
      pppoeUsername: wanConfig.username,
      pppoePassword: wanConfig.password,
      tr069Profile: wanConfig.configMethod === 'TR069' ? 'TR069_PROFILE' : 'OMCI_PROFILE'
    }));
    setWanConfigModalOpen(false);
  };

  const handleCancelWanConfig = () => {
    setWanConfigModalOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard/provisionar')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando configuração...
          </Typography>
        </Box>
        <LinearProgress sx={{ mb: 4 }} />
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          ONU não encontrada. <Button onClick={() => navigate('/dashboard/provisionar')}>Voltar</Button>
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
            Configuração da ONU - {onuDetails.serialNumber}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {onuDetails.customerName} - {onuDetails.onuType}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAlt />}
            onClick={() => handleAction('restart')}
            sx={{ borderRadius: 2 }}
          >
            Reiniciar
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Sync />}
            onClick={() => handleAction('sync')}
            sx={{ borderRadius: 2 }}
          >
            Ressincronizar
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SettingsBackupRestore />}
            onClick={() => handleAction('factory_reset')}
            sx={{ borderRadius: 2 }}
          >
            Restaurar
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => handleAction('delete')}
            sx={{ borderRadius: 2 }}
          >
            Deletar
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Card do Equipamento */}
        <Grid item xs={12} lg={4}>
          <AnimatedCard delay={100}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={onuDetails.imageUrl}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mr: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  <Router sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {onuDetails.onuType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SN: {onuDetails.serialNumber}
                  </Typography>
                  <Chip 
                    label={getStatusText(onuDetails.status)}
                    color={getStatusColor(onuDetails.status)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    OLT
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.oltName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    BOARD
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.board}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    PORT
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.port}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ONU Type
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.onuType}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Name
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={customerInfo.customerName}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      customerName: e.target.value
                    }))}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '0.875rem',
                        fontWeight: 600 
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Address
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    value={customerInfo.customerAddress}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      customerAddress: e.target.value
                    }))}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '0.875rem',
                        fontWeight: 600 
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Comment
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    value={customerInfo.comment}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      comment: e.target.value
                    }))}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '0.875rem',
                        fontWeight: 600 
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    ONU Authorized
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.authorizedAt}
                  </Typography>
                </Grid>
                
                {/* Botão de Histórico */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<History />}
                    onClick={() => setHistoryModalOpen(true)}
                    sx={{ 
                      borderRadius: 2, 
                      mt: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.50'
                      }
                    }}
                  >
                    Ver Histórico de Alterações
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Status e Configurações Técnicas */}
        <Grid item xs={12} lg={8}>
          <AnimatedCard delay={200}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Status e Configurações Técnicas
              </Typography>

              <Grid container spacing={3}>
                {/* Status somente leitura */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {getStatusText(onuDetails.status)} - {onuDetails.uptime}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      ONU/OLT Rx
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="600" sx={{ mr: 1 }}>
                        {onuDetails.rxPower} dBm
                      </Typography>
                      <Chip 
                        label={getSignalColor(onuDetails.rxPower)}
                        color={getSignalColor(onuDetails.rxPower)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Configurações editáveis */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ONU Mode"
                    value={editableConfig.onuMode === 'routing' ? 'Routing' : 'Bridge'}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2 }}
                    helperText="Modo obtido via WAN Setup Mode"
                  />
                  
                  {/* Configuração VoIP */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      VoIP
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setOpenVoipDialog(true)}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        height: 56,
                        border: '1px solid rgba(0, 0, 0, 0.23)',
                        '&:hover': {
                          border: '1px solid rgba(0, 0, 0, 0.87)',
                        }
                      }}
                      endIcon={<Edit />}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" color="text.primary">
                          {editableConfig.voipEnabled ? 'Habilitado' : 'Desabilitado'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configurar serviço VoIP
                        </Typography>
                      </Box>
                    </Button>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      WAN Setup Mode
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleOpenWanConfig}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        height: 56,
                        border: '1px solid rgba(0, 0, 0, 0.23)',
                        '&:hover': {
                          border: '1px solid rgba(0, 0, 0, 0.87)',
                        }
                      }}
                      endIcon={<Edit />}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" color="text.primary">
                          {editableConfig.wanSetupMode === 'pppoe' ? 'PPPoE' : 
                           editableConfig.wanSetupMode === 'dhcp' ? 'DHCP' : 'Static IP'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configurar WAN avançado
                        </Typography>
                      </Box>
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    label="TR069 Profile"
                    value={editableConfig.tr069Profile}
                    onChange={(e) => setEditableConfig(prev => ({
                      ...prev,
                      tr069Profile: e.target.value
                    }))}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* Attached VLANs - Editável */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Attached VLANs
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {editableConfig.attachedVlans.map(vlan => (
                      <Chip 
                        key={vlan} 
                        label={`VLAN ${vlan}`} 
                        size="small"
                        onDelete={() => handleRemoveVlan(vlan)}
                        color="primary"
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Nova VLAN"
                      value={editableConfig.newVlan}
                      onChange={(e) => setEditableConfig(prev => ({
                        ...prev,
                        newVlan: e.target.value
                      }))}
                      sx={{ width: 150 }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={handleAddVlan}
                      disabled={!editableConfig.newVlan}
                      size="small"
                      startIcon={<Add />}
                    >
                      Adicionar
                    </Button>
                  </Box>
                </Grid>

                {/* PPPoE Information - Apenas Exibição */}
                {editableConfig.wanSetupMode === 'pppoe' && (
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'grey.50' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Nome de Usuário PPPoE
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {editableConfig.pppoeUsername || 'Não configurado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'grey.50' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Status da Senha PPPoE
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {editableConfig.pppoePassword ? '••••••••' : 'Não configurado'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </AnimatedCard>
        </Grid>

        {/* Tabs para Portas e WiFi */}
        <Grid item xs={12}>
          <AnimatedCard delay={300}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab 
                  label="Portas Ethernet" 
                  icon={<Cable />} 
                  iconPosition="start"
                />
                <Tab 
                  label="Interfaces Wi-Fi" 
                  icon={<Wifi />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Ethernet Ports Tab */}
            {tabValue === 0 && (
              <CardContent>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                  Configuração das Portas Ethernet
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Porta</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell>DHCP</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ethernetPorts.map((port, index) => (
                        <TableRow key={port.port}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {port.port}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={port.mode}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={port.dhcp === 'enabled' ? 'Habilitado' : 'Desabilitado'}
                              color={port.dhcp === 'enabled' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenPortConfig(index)}
                              title="Configurar Porta"
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* WiFi Interfaces Tab */}
            {tabValue === 1 && (
              <CardContent>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                  Configuração das Interfaces Wi-Fi
                </Typography>
                
                <Grid container spacing={3}>
                  {wifiInterfaces.map((wifi, index) => (
                    <Grid item xs={12} md={6} key={wifi.band}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="600">
                              Wi-Fi {wifi.band}
                            </Typography>
                            <IconButton
                              onClick={() => toggleWifiStatus(index)}
                              color={wifi.enabled ? 'success' : 'error'}
                            >
                              {wifi.enabled ? <Wifi /> : <WifiOff />}
                            </IconButton>
                          </Box>
                          
                          <Stack spacing={2}>
                            <TextField
                              fullWidth
                              label="SSID"
                              value={wifi.ssid}
                              size="small"
                              disabled={!wifi.enabled}
                            />
                            <TextField
                              fullWidth
                              label="Password"
                              type="password"
                              value={wifi.password}
                              size="small"
                              disabled={!wifi.enabled}
                            />
                            <TextField
                              fullWidth
                              label="Canal"
                              value={wifi.channel}
                              size="small"
                              disabled={!wifi.enabled}
                            />
                            <TextField
                              fullWidth
                              label="Potência (%)"
                              type="number"
                              value={wifi.power}
                              size="small"
                              disabled={!wifi.enabled}
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={wifi.hidden} 
                                  disabled={!wifi.enabled}
                                />
                              }
                              label="Rede Oculta"
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            )}
          </AnimatedCard>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
              {saving ? 'Salvando...' : 'Aplicar Configurações'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{actionDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={executeAction} 
            variant="contained"
            color={actionDialog.action === 'delete' || actionDialog.action === 'factory_reset' ? 'error' : 'primary'}
            sx={{ borderRadius: 2 }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Modal */}
      <Dialog 
        open={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Histórico de Alterações - ONU {onuDetails?.serialNumber}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setHistoryModalOpen(false)}
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Data/Hora
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Usuário
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Ação
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Campo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Valor Anterior
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Novo Valor
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}>
                    Descrição
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {entry.timestamp}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1, 
                            fontSize: '0.875rem',
                            bgcolor: 'primary.main'
                          }}
                        >
                          {entry.user.split(' ')[0].charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {entry.user}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        size="small"
                        color={
                          entry.action === 'Criação' ? 'success' :
                          entry.action === 'Configuração' ? 'primary' :
                          entry.action === 'Sistema' ? 'warning' :
                          'default'
                        }
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {entry.field}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="error.main"
                        sx={{ 
                          textDecoration: 'line-through',
                          fontFamily: 'monospace'
                        }}
                      >
                        {entry.oldValue}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="success.main"
                        sx={{ 
                          fontWeight: 500,
                          fontFamily: 'monospace'
                        }}
                      >
                        {entry.newValue}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {entry.description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setHistoryModalOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Port Configuration Modal */}
      <Dialog
        open={portConfigModalOpen}
        onClose={handleCancelPortConfig}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Configurar Porta {selectedPortIndex !== null ? selectedPortIndex + 1 : ''}
        </DialogTitle>
        <DialogContent>
          {tempPortConfig && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Número da Porta"
                type="number"
                value={tempPortConfig.port}
                disabled
              />
              
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select
                  value={tempPortConfig.mode}
                  onChange={(e) => setTempPortConfig(prev => prev ? {...prev, mode: e.target.value as 'Lan' | 'Access' | 'Hybrid' | 'Trunk' | 'Transparent'} : null)}
                  label="Mode"
                >
                  <MenuItem value="Lan">Lan</MenuItem>
                  <MenuItem value="Access">Access</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
                  <MenuItem value="Trunk">Trunk</MenuItem>
                  <MenuItem value="Transparent">Transparent</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>DHCP</InputLabel>
                <Select
                  value={tempPortConfig.dhcp}
                  onChange={(e) => setTempPortConfig(prev => prev ? {...prev, dhcp: e.target.value as 'enabled' | 'disabled'} : null)}
                  label="DHCP"
                >
                  <MenuItem value="enabled">Habilitado</MenuItem>
                  <MenuItem value="disabled">Desabilitado</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPortConfig}>Cancelar</Button>
          <Button 
            onClick={handleSavePortConfig} 
            variant="contained"
            startIcon={<Save />}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* WAN Configuration Modal */}
      <Dialog
        open={wanConfigModalOpen}
        onClose={handleCancelWanConfig}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Router sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Configuração WAN Avançada
            </Typography>
          </Box>
          <IconButton 
            onClick={handleCancelWanConfig}
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={2}>
            {/* Alert Info */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                Após alterar o WAN VLAN-ID, verifique as configurações das portas Ethernet e atualize as VLANs conforme necessário.
              </Alert>
            </Grid>

            {/* Row 1: VLAN-ID and Remote Access */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>WAN VLAN-ID</InputLabel>
                <Select
                  value={wanConfig.vlanId}
                  onChange={(e) => setWanConfig(prev => ({...prev, vlanId: e.target.value}))}
                  label="WAN VLAN-ID"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="105 - PADRAO-PPPoE-CLI">105 - PADRAO-PPPoE-CLI</MenuItem>
                  <MenuItem value="106 - DHCP-DEFAULT">106 - DHCP-DEFAULT</MenuItem>
                  <MenuItem value="107 - STATIC-IP">107 - STATIC-IP</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Acesso Remoto WAN</InputLabel>
                <Select
                  value={wanConfig.wanRemoteAccess}
                  onChange={(e) => setWanConfig(prev => ({...prev, wanRemoteAccess: e.target.value as 'Disabled / not set' | 'Enabled'}))}
                  label="Acesso Remoto WAN"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Disabled / not set">Desabilitado</MenuItem>
                  <MenuItem value="Enabled">Habilitado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Row 2: ONU Mode and Config Method */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Modo da ONU
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.onuMode}
                  onChange={(e) => setWanConfig(prev => ({...prev, onuMode: e.target.value as 'Routing' | 'Bridging'}))}
                >
                  <FormControlLabel 
                    value="Routing" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Routing</Typography>}
                  />
                  <FormControlLabel 
                    value="Bridging" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Bridging</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Método de Configuração
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.configMethod}
                  onChange={(e) => setWanConfig(prev => ({...prev, configMethod: e.target.value as 'OMCI' | 'TR069'}))}
                >
                  <FormControlLabel 
                    value="OMCI" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">OMCI</Typography>}
                  />
                  <FormControlLabel 
                    value="TR069" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">TR069</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            {/* Row 3: Connection Type */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Tipo de Conexão
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.connectionType}
                  onChange={(e) => setWanConfig(prev => ({...prev, connectionType: e.target.value as WANConfiguration['connectionType']}))}
                  sx={{ gap: 4 }}
                >
                  <FormControlLabel 
                    value="DHCP" 
                    control={<Radio color="primary" />} 
                    label={<Typography variant="body2">DHCP</Typography>}
                  />
                  <FormControlLabel 
                    value="Static IP" 
                    control={<Radio color="primary" />} 
                    label={<Typography variant="body2">IP Estático</Typography>}
                  />
                  <FormControlLabel 
                    value="PPPoE" 
                    control={<Radio color="primary" />} 
                    label={<Typography variant="body2">PPPoE</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            {/* Row 4: IP Protocol and IPv6 Settings */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Protocolo IP
                </Typography>
                <RadioGroup
                  value={wanConfig.ipProtocol}
                  onChange={(e) => setWanConfig(prev => ({...prev, ipProtocol: e.target.value as 'IPv4' | 'Dual stack IPv4/IPv6'}))}
                >
                  <FormControlLabel 
                    value="IPv4" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">IPv4</Typography>}
                  />
                  <FormControlLabel 
                    value="Dual stack IPv4/IPv6" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Dual Stack</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Endereço IPv6
                </Typography>
                <RadioGroup
                  value={wanConfig.ipv6Address}
                  onChange={(e) => setWanConfig(prev => ({...prev, ipv6Address: e.target.value as WANConfiguration['ipv6Address']}))}
                >
                  <FormControlLabel 
                    value="DHCPv6" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">DHCPv6</Typography>}
                  />
                  <FormControlLabel 
                    value="Auto" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Auto</Typography>}
                  />
                  <FormControlLabel 
                    value="Static" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Estático</Typography>}
                  />
                  <FormControlLabel 
                    value="None" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Nenhum</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: 'primary.main' }}>
                  Prefixo IPv6
                </Typography>
                <RadioGroup
                  value={wanConfig.ipv6Prefix}
                  onChange={(e) => setWanConfig(prev => ({...prev, ipv6Prefix: e.target.value as WANConfiguration['ipv6Prefix']}))}
                >
                  <FormControlLabel 
                    value="DHCPv6-PD" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">DHCPv6-PD</Typography>}
                  />
                  <FormControlLabel 
                    value="Static" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Estático</Typography>}
                  />
                  <FormControlLabel 
                    value="None" 
                    control={<Radio color="primary" size="small" />} 
                    label={<Typography variant="body2">Nenhum</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>

            {/* PPPoE Credentials - Only show when PPPoE is selected */}
            {wanConfig.connectionType === 'PPPoE' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Credenciais PPPoE" color="primary" variant="outlined" />
                  </Divider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome de Usuário"
                    value={wanConfig.username}
                    onChange={(e) => setWanConfig(prev => ({...prev, username: e.target.value}))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Senha"
                    type="password"
                    value={wanConfig.password}
                    onChange={(e) => setWanConfig(prev => ({...prev, password: e.target.value}))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleCancelWanConfig}
            variant="outlined"
            sx={{ borderRadius: 2, minWidth: 100 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveWanConfig} 
            variant="contained"
            startIcon={<Save />}
            sx={{
              borderRadius: 2,
              minWidth: 140,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            Aplicar Configurações
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Configuração VoIP */}
      <Dialog
        open={openVoipDialog}
        onClose={() => setOpenVoipDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configuração VoIP
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Switch
              checked={editableConfig.voipEnabled}
              onChange={(e) => setEditableConfig(prev => ({
                ...prev,
                voipEnabled: e.target.checked
              }))}
              color="primary"
            />
            <Typography variant="body1" sx={{ ml: 1 }}>
              Habilitar VoIP
            </Typography>
          </Box>

          {editableConfig.voipEnabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Servidor SIP"
                  value={editableConfig.voipSettings.sipServer}
                  onChange={(e) => setEditableConfig(prev => ({
                    ...prev,
                    voipSettings: {
                      ...prev.voipSettings,
                      sipServer: e.target.value
                    }
                  }))}
                  placeholder="sip.provedor.com.br"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Usuário SIP"
                  value={editableConfig.voipSettings.sipUser}
                  onChange={(e) => setEditableConfig(prev => ({
                    ...prev,
                    voipSettings: {
                      ...prev.voipSettings,
                      sipUser: e.target.value
                    }
                  }))}
                  placeholder="usuario"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha SIP"
                  type="password"
                  value={editableConfig.voipSettings.sipPassword}
                  onChange={(e) => setEditableConfig(prev => ({
                    ...prev,
                    voipSettings: {
                      ...prev.voipSettings,
                      sipPassword: e.target.value
                    }
                  }))}
                  placeholder="senha"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome de Exibição"
                  value={editableConfig.voipSettings.displayName}
                  onChange={(e) => setEditableConfig(prev => ({
                    ...prev,
                    voipSettings: {
                      ...prev.voipSettings,
                      displayName: e.target.value
                    }
                  }))}
                  placeholder="Nome do Cliente"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenVoipDialog(false)}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => setOpenVoipDialog(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ONUConfigurationNew;
