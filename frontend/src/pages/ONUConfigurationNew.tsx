import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProvisioning } from '../contexts/ProvisioningContext';
import { genieacsApi } from '../services/genieacsApi';
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
  const { provisionedONUs, refreshProvisionedONUs } = useProvisioning();

  useTitle('Configuração da ONU - RJ Chronos');

  // Encontrar a ONU provisionada pelo ID
  const currentONU = provisionedONUs.find((onu) => onu.id === id);

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
    message: '',
  });

  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);
  const [ethernetPorts, setEthernetPorts] = useState<EthernetPort[]>([]);
  const [wifiInterfaces, setWifiInterfaces] = useState<WiFiInterface[]>([]);
  const [originalWifiInterfaces, setOriginalWifiInterfaces] = useState<
    WiFiInterface[]
  >([]);

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
  const [selectedPortIndex, setSelectedPortIndex] = useState<number | null>(
    null
  );
  const [tempPortConfig, setTempPortConfig] = useState<EthernetPort | null>(
    null
  );

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
    wanRemoteAccess: 'Disabled / not set',
  });

  // Estados para modal de confirmação de alterações
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [originalData, setOriginalData] = useState<{
    customerInfo: {
      customerName: string;
      customerAddress: string;
      comment: string;
    };
    editableConfig: {
      tr069Profile: string;
      attachedVlans: string[];
      wanSetupMode: string;
    };
  } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      field: string;
      label: string;
      oldValue: string;
      newValue: string;
    }>
  >([]);

  // Carregar dados da ONU
  useEffect(() => {
    const loadONUData = async () => {
      setLoading(true);

      if (!id) {
        navigate('/dashboard/provisionar');
        return;
      }

      try {
        // Carregar dados reais do backend
        const clientData = await genieacsApi.getClientConfiguration(id);

        console.log('Dados carregados do cliente:', clientData);

        const clientDataObj = clientData as Record<string, unknown>;
        const onuDetails: ONUDetails = {
          id: (clientDataObj.id as string) || id,
          serialNumber: (clientDataObj.serial_number as string) || 'N/A',
          model:
            (clientDataObj.model as string)?.split(' ').pop() ||
            (clientDataObj.model as string) ||
            'Unknown',
          vendor: (clientDataObj.model as string)?.split(' ')[0] || 'Unknown',
          macAddress:
            (clientDataObj.mac_address as string) || '00:11:22:33:44:55',
          oltName: (clientDataObj.olt_id as string) || 'N/A',
          board: '1', // Seria extraído dos dados reais
          port: (clientDataObj.pon_port as string)?.split('/')[1] || '1',
          onuType: (clientDataObj.model as string) || 'Unknown',
          customerName:
            (clientDataObj.customer_name as string) || 'Cliente não informado',
          customerAddress:
            (clientDataObj.customer_address as string) ||
            'Endereço não informado',
          comment: (clientDataObj.comment as string) || '',
          authorizedAt: new Date(
            (clientDataObj.provisioned_at as string | number) || Date.now()
          ).toLocaleString('pt-BR'),
          status:
            (clientDataObj.status as string) === 'online'
              ? 'online'
              : 'offline',
          uptime: (clientDataObj.uptime as string) || '0m',
          rxPower: (clientDataObj.rx_power as number) || -20,
          attachedVlans: [
            ((clientDataObj.vlan_id as number) || 100).toString(),
          ],
          onuMode: 'routing',
          tr069Profile: (clientDataObj.service_profile as string) || 'default',
          wanSetupMode:
            (clientDataObj.wan_mode as 'dhcp' | 'static' | 'pppoe') || 'dhcp',
          pppoeUsername: (clientDataObj.pppoe_username as string) || '',
          pppoePassword: (clientDataObj.pppoe_password as string) || '',
          imageUrl: '/static/devices/huawei-hg8245h.png',
        };

        setOnuDetails(onuDetails);

        // Inicializar configurações editáveis com dados reais
        setEditableConfig({
          onuMode: 'routing',
          tr069Profile: (clientDataObj.service_profile as string) || 'default',
          wanSetupMode:
            (clientDataObj.wan_mode as 'dhcp' | 'static' | 'pppoe') || 'dhcp',
          attachedVlans: [
            ((clientDataObj.vlan_id as number) || 100).toString(),
          ],
          pppoeUsername: (clientDataObj.pppoe_username as string) || '',
          pppoePassword: (clientDataObj.pppoe_password as string) || '',
          newVlan: '',
          voipEnabled: false,
          voipSettings: {
            sipServer: '',
            sipUser: '',
            sipPassword: '',
            displayName: '',
          },
        });

        // Inicializar informações do cliente com dados reais
        const initialCustomerInfo = {
          customerName:
            (clientDataObj.customer_name as string) || 'Cliente não informado',
          customerAddress:
            (clientDataObj.customer_address as string) ||
            'Endereço não informado',
          comment: (clientDataObj.comment as string) || '',
        };

        const initialEditableConfig = {
          tr069Profile: (clientDataObj.service_profile as string) || 'default',
          attachedVlans: [
            ((clientDataObj.vlan_id as number) || 100).toString(),
          ],
          wanSetupMode: (clientDataObj.wan_mode as string) || 'dhcp',
        };

        setCustomerInfo(initialCustomerInfo);

        // Armazenar dados originais para comparação
        setOriginalData({
          customerInfo: { ...initialCustomerInfo },
          editableConfig: { ...initialEditableConfig },
        });

        // Mock ethernet ports
        setEthernetPorts([
          { port: 1, mode: 'Access', dhcp: 'enabled' },
          { port: 2, mode: 'Lan', dhcp: 'enabled' },
          { port: 3, mode: 'Hybrid', dhcp: 'disabled' },
          { port: 4, mode: 'Trunk', dhcp: 'enabled' },
        ]);

        // Carregar configurações WiFi reais do equipamento (separadas por banda)
        try {
          // Carregar configurações das duas bandas separadamente
          const [wifi24Config, wifi5Config] = await Promise.all([
            genieacsApi.getWiFiConfigByBand(id, '2.4GHz'),
            genieacsApi.getWiFiConfigByBand(id, '5GHz'),
          ]);

          // Converter dados da API para o formato da interface local
          const wifiInterfaces: WiFiInterface[] = [
            {
              band: '2.4GHz',
              enabled: wifi24Config.enabled,
              ssid: wifi24Config.ssid,
              password: wifi24Config.password || '',
              channel: wifi24Config.channel || 'auto',
              power: wifi24Config.power || 75,
              maxClients: 32, // Valor padrão, seria obtido da API
              hidden: wifi24Config.hidden,
            },
            {
              band: '5GHz',
              enabled: wifi5Config.enabled,
              ssid: wifi5Config.ssid,
              password: wifi5Config.password || '',
              channel: wifi5Config.channel || 'auto',
              power: wifi5Config.power || 75,
              maxClients: 32,
              hidden: wifi5Config.hidden,
            },
          ];

          setWifiInterfaces(wifiInterfaces);
          setOriginalWifiInterfaces([...wifiInterfaces]); // Salvar configurações originais
        } catch (error) {
          console.error(
            'Erro ao carregar configurações WiFi do GenieACS:',
            error
          );

          // Mostrar erro ao usuário, não usar dados mock
          alert(
            'Erro ao carregar configurações WiFi do equipamento. Verifique se o dispositivo está conectado ao GenieACS.'
          );

          // Inicializar com interfaces vazias se falhar
          const emptyWifiInterfaces: WiFiInterface[] = [
            {
              band: '2.4GHz',
              enabled: false,
              ssid: '',
              password: '',
              channel: 'auto',
              power: 75,
              maxClients: 32,
              hidden: false,
            },
            {
              band: '5GHz',
              enabled: false,
              ssid: '',
              password: '',
              channel: 'auto',
              power: 75,
              maxClients: 32,
              hidden: false,
            },
          ];

          setWifiInterfaces(emptyWifiInterfaces);
          setOriginalWifiInterfaces([...emptyWifiInterfaces]);
        }

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
            description: 'Alteração do nome da rede Wi-Fi 2.4GHz',
          },
          {
            id: '2',
            user: 'Maria Santos (tecnico)',
            action: 'Configuração',
            field: 'VLAN',
            oldValue: '100',
            newValue: '100, 200',
            timestamp: '2024-08-29 13:45:22',
            description: 'Adicionada VLAN 200 para serviços especiais',
          },
          {
            id: '3',
            user: 'Pedro Costa (admin)',
            action: 'Dados do Cliente',
            field: 'Endereço',
            oldValue: 'Rua das Flores, 123',
            newValue: 'Rua das Flores, 123 - Centro - Rio de Janeiro/RJ',
            timestamp: '2024-08-29 12:20:10',
            description: 'Atualização completa do endereço do cliente',
          },
          {
            id: '4',
            user: 'Ana Oliveira (tecnico)',
            action: 'Configuração',
            field: 'ONU Mode',
            oldValue: 'bridge',
            newValue: 'routing',
            timestamp: '2024-08-29 11:15:05',
            description: 'Alteração do modo de operação para routing',
          },
          {
            id: '5',
            user: 'Carlos Mendes (admin)',
            action: 'Sistema',
            field: 'PPPoE Username',
            oldValue: 'cliente.antigo@provedor.com.br',
            newValue: 'cliente.12345@provedor.com.br',
            timestamp: '2024-08-29 10:30:45',
            description: 'Atualização das credenciais PPPoE',
          },
          {
            id: '6',
            user: 'Sistema Automatico',
            action: 'Criação',
            field: 'ONU',
            oldValue: '-',
            newValue: 'Autorizada',
            timestamp: '2024-08-29 09:00:00',
            description: 'ONU autorizada e provisionada no sistema',
          },
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados da ONU:', error);
        // Se cliente não foi encontrado, redirecionar
        navigate('/dashboard/clientes');
      } finally {
        setLoading(false);
      }
    };

    loadONUData();
  }, [currentONU, navigate, id]);

  // Função para detectar alterações e preparar modal de confirmação
  const handleSaveClick = () => {
    if (!originalData) return;

    const changes: Array<{
      field: string;
      label: string;
      oldValue: string;
      newValue: string;
    }> = [];

    // Comparar informações do cliente
    if (customerInfo.customerName !== originalData.customerInfo.customerName) {
      changes.push({
        field: 'customerName',
        label: 'Nome do Cliente',
        oldValue: originalData.customerInfo.customerName,
        newValue: customerInfo.customerName,
      });
    }

    if (
      customerInfo.customerAddress !== originalData.customerInfo.customerAddress
    ) {
      changes.push({
        field: 'customerAddress',
        label: 'Endereço do Cliente',
        oldValue: originalData.customerInfo.customerAddress,
        newValue: customerInfo.customerAddress,
      });
    }

    if (customerInfo.comment !== originalData.customerInfo.comment) {
      changes.push({
        field: 'comment',
        label: 'Comentário',
        oldValue: originalData.customerInfo.comment || '(Vazio)',
        newValue: customerInfo.comment || '(Vazio)',
      });
    }

    // Comparar configurações técnicas
    if (
      editableConfig.tr069Profile !== originalData.editableConfig.tr069Profile
    ) {
      changes.push({
        field: 'tr069Profile',
        label: 'Perfil de Serviço',
        oldValue: originalData.editableConfig.tr069Profile,
        newValue: editableConfig.tr069Profile,
      });
    }

    if (
      editableConfig.attachedVlans[0] !==
      originalData.editableConfig.attachedVlans[0]
    ) {
      changes.push({
        field: 'vlanId',
        label: 'VLAN ID',
        oldValue: originalData.editableConfig.attachedVlans[0],
        newValue: editableConfig.attachedVlans[0],
      });
    }

    if (
      editableConfig.wanSetupMode !== originalData.editableConfig.wanSetupMode
    ) {
      const wanModeLabels: Record<string, string> = {
        dhcp: 'DHCP',
        static: 'IP Estático',
        pppoe: 'PPPoE',
      };

      changes.push({
        field: 'wanSetupMode',
        label: 'Modo de Conexão WAN',
        oldValue:
          wanModeLabels[originalData.editableConfig.wanSetupMode] ||
          originalData.editableConfig.wanSetupMode,
        newValue:
          wanModeLabels[editableConfig.wanSetupMode] ||
          editableConfig.wanSetupMode,
      });
    }

    // Verificar alterações do WiFi
    if (hasWiFiChanges()) {
      wifiInterfaces.forEach((wifi, index) => {
        const original = originalWifiInterfaces[index];
        if (!original) return;

        if (wifi.ssid !== original.ssid) {
          changes.push({
            field: `wifi_${index}_ssid`,
            label: `WiFi ${wifi.band} - SSID`,
            oldValue: original.ssid,
            newValue: wifi.ssid,
          });
        }

        if (wifi.password !== original.password) {
          changes.push({
            field: `wifi_${index}_password`,
            label: `WiFi ${wifi.band} - Senha`,
            oldValue: `${original.password.substring(
              0,
              2
            )}***${original.password.substring(original.password.length - 2)}`,
            newValue: `${wifi.password.substring(
              0,
              2
            )}***${wifi.password.substring(wifi.password.length - 2)}`,
          });
        }

        if (wifi.enabled !== original.enabled) {
          changes.push({
            field: `wifi_${index}_enabled`,
            label: `WiFi ${wifi.band} - Status`,
            oldValue: original.enabled ? 'Habilitado' : 'Desabilitado',
            newValue: wifi.enabled ? 'Habilitado' : 'Desabilitado',
          });
        }

        if (wifi.hidden !== original.hidden) {
          changes.push({
            field: `wifi_${index}_hidden`,
            label: `WiFi ${wifi.band} - Rede Oculta`,
            oldValue: original.hidden ? 'Sim' : 'Não',
            newValue: wifi.hidden ? 'Sim' : 'Não',
          });
        }

        if (wifi.channel !== original.channel) {
          changes.push({
            field: `wifi_${index}_channel`,
            label: `WiFi ${wifi.band} - Canal`,
            oldValue: original.channel || 'Auto',
            newValue: wifi.channel || 'Auto',
          });
        }

        if (wifi.power !== original.power) {
          changes.push({
            field: `wifi_${index}_power`,
            label: `WiFi ${wifi.band} - Potência`,
            oldValue: `${original.power}%`,
            newValue: `${wifi.power}%`,
          });
        }
      });
    }

    if (changes.length === 0) {
      // Nenhuma alteração detectada
      setActionDialog({
        open: true,
        title: 'Nenhuma Alteração',
        message: 'Nenhuma alteração foi detectada nos dados.',
        action: null,
      });
      return;
    }

    // Mostrar modal de confirmação com as alterações
    setPendingChanges(changes);
    setConfirmationModalOpen(true);
  };

  // Função para confirmar e executar o salvamento
  const handleConfirmSave = async () => {
    console.log(
      'FUNÇÃO handleConfirmSave EXECUTADA - CONFIGURAÇÃO GERAL E WiFi'
    );

    if (!id) return;

    setConfirmationModalOpen(false);
    setSaving(true);

    try {
      // Preparar dados para salvamento das configurações gerais
      const updates = {
        client_name: customerInfo.customerName,
        client_address: customerInfo.customerAddress,
        comment: customerInfo.comment,
        service_profile: editableConfig.tr069Profile,
        vlan_id: parseInt(editableConfig.attachedVlans[0]) || 100,
        wan_mode: editableConfig.wanSetupMode,
      };

      console.log('Salvando configurações gerais:', updates);

      // Salvar configurações gerais via API
      const result = await genieacsApi.updateClientConfiguration(id, updates);

      if (result.success) {
        console.log('Configurações gerais salvas com sucesso:', result);
      } else {
        throw new Error('Falha ao salvar configurações gerais');
      }

      // Verificar se há alterações WiFi para salvar
      if (hasWiFiChanges()) {
        console.log('Salvando configurações WiFi...');

        // Para cada interface WiFi, salvar as configurações na banda específica
        for (const wifi of wifiInterfaces) {
          const wifiUpdate: Record<string, unknown> = {
            ssid: wifi.ssid,
            password: wifi.password,
            enabled: wifi.enabled,
            hidden: wifi.hidden,
            channel: wifi.channel === 'auto' ? undefined : wifi.channel,
            power: wifi.power,
          };

          console.log(`🔐 Enviando configurações WiFi para ${wifi.band}:`, {
            ssid: wifi.ssid,
            password: `${wifi.password.substring(
              0,
              2
            )}***${wifi.password.substring(wifi.password.length - 2)}`,
            passwordLength: wifi.password.length,
            fullUpdate: wifiUpdate,
          });

          // Usar a nova API que especifica a banda
          await genieacsApi.updateWiFiConfigByBand(id, wifi.band, wifiUpdate);
          console.log(`Configurações WiFi ${wifi.band} enviadas ao backend`);
        }

        console.log('Todas as configurações WiFi salvas com sucesso');

        // Atualizar configurações originais após salvamento bem-sucedido
        setOriginalWifiInterfaces([...wifiInterfaces]);
      }

      // Atualizar dados originais após salvamento bem-sucedido
      setOriginalData({
        customerInfo: { ...customerInfo },
        editableConfig: {
          tr069Profile: editableConfig.tr069Profile,
          attachedVlans: [...editableConfig.attachedVlans],
          wanSetupMode: editableConfig.wanSetupMode,
        },
      });

      // Adicionar entrada ao histórico
      const newHistoryEntry: HistoryEntry = {
        id: Date.now().toString(),
        user: 'Usuário Atual (admin)',
        action: 'Configuração',
        field: hasWiFiChanges()
          ? 'Configuração Geral e WiFi'
          : 'Configuração Geral',
        oldValue: 'Configurações anteriores',
        newValue: hasWiFiChanges()
          ? 'Configurações gerais e WiFi atualizadas'
          : 'Configurações gerais atualizadas',
        timestamp: new Date().toLocaleString('pt-BR'),
        description: `Atualizados ${
          (result as Record<string, unknown>).updated_fields
            ? (
                (result as Record<string, unknown>)
                  .updated_fields as Array<unknown>
              ).length
            : 0
        } campos. TR-069: ${
          (result as Record<string, unknown>).tr069_updates_applied || 0
        } aplicadas.${
          hasWiFiChanges() ? ` Configurações WiFi também atualizadas.` : ''
        }`,
      };

      setHistoryData((prev) => [newHistoryEntry, ...prev]);

      // Refresh geral dos dados provisionados para atualizar todas as páginas
      await refreshProvisionedONUs();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'powered_off':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'powered_off':
        return 'Desligado';
      default:
        return 'Desconhecido';
    }
  };

  const getSignalColor = (signal: number) => {
    if (signal >= -20) return 'success';
    if (signal >= -25) return 'warning';
    return 'error';
  };

  const handleAction = (
    action: 'restart' | 'delete' | 'sync' | 'factory_reset'
  ) => {
    const actionConfig = {
      restart: {
        title: 'Reiniciar Equipamento',
        message:
          'Tem certeza que deseja reiniciar este equipamento? A operação pode levar alguns minutos.',
      },
      delete: {
        title: 'Deletar Equipamento',
        message:
          'ATENÇÃO: Esta ação irá remover completamente o equipamento da rede. Esta operação é irreversível.',
      },
      sync: {
        title: 'Ressincronizar Configurações',
        message:
          'Deseja ressincronizar as configurações do equipamento com o perfil padrão?',
      },
      factory_reset: {
        title: 'Restaurar Padrão de Fábrica',
        message:
          'ATENÇÃO: Esta ação irá restaurar todas as configurações para o padrão de fábrica. Todas as personalizações serão perdidas.',
      },
    };

    setActionDialog({
      open: true,
      action,
      ...actionConfig[action],
    });
  };

  const executeAction = async () => {
    // Simular execução da ação
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setActionDialog({ open: false, action: null, title: '', message: '' });

    if (actionDialog.action === 'delete') {
      navigate('/dashboard/provisionar');
    }
  };

  const toggleWifiStatus = (wifiIndex: number) => {
    setWifiInterfaces((prev) =>
      prev.map((wifi, index) =>
        index === wifiIndex ? { ...wifi, enabled: !wifi.enabled } : wifi
      )
    );
  };

  const updateWiFiField = (
    wifiIndex: number,
    field: keyof WiFiInterface,
    value: string | number | boolean
  ) => {
    setWifiInterfaces((prev) =>
      prev.map((wifi, index) =>
        index === wifiIndex ? { ...wifi, [field]: value } : wifi
      )
    );
  };

  const hasWiFiChanges = () => {
    if (wifiInterfaces.length !== originalWifiInterfaces.length) return true;

    return wifiInterfaces.some((wifi, index) => {
      const original = originalWifiInterfaces[index];
      if (!original) return true;

      return (
        wifi.ssid !== original.ssid ||
        wifi.password !== original.password ||
        wifi.enabled !== original.enabled ||
        wifi.hidden !== original.hidden ||
        wifi.channel !== original.channel ||
        wifi.power !== original.power ||
        wifi.maxClients !== original.maxClients
      );
    });
  };

  const saveWiFiChanges = async () => {
    console.log('FUNÇÃO saveWiFiChanges EXECUTADA - CONFIGURAÇÃO WiFi');

    if (!id) return;

    try {
      setSaving(true);

      // Para cada interface WiFi, salvar as configurações na banda específica
      for (const wifi of wifiInterfaces) {
        const wifiUpdate: Record<string, unknown> = {
          ssid: wifi.ssid,
          password: wifi.password,
          enabled: wifi.enabled,
          hidden: wifi.hidden,
          channel: wifi.channel === 'auto' ? undefined : wifi.channel,
          power: wifi.power,
        };

        console.log(`🔐 Enviando senha para ${wifi.band}:`, {
          ssid: wifi.ssid,
          password: `${wifi.password.substring(
            0,
            2
          )}***${wifi.password.substring(wifi.password.length - 2)}`,
          passwordLength: wifi.password.length,
          fullUpdate: wifiUpdate,
        });

        // Usar a nova API que especifica a banda
        await genieacsApi.updateWiFiConfigByBand(id, wifi.band, wifiUpdate);
        console.log(`Configurações WiFi ${wifi.band} enviadas ao backend`);
      }

      console.log('Todas as configurações WiFi salvas com sucesso');

      // Atualizar configurações originais após salvamento bem-sucedido
      setOriginalWifiInterfaces([...wifiInterfaces]);

      // Adicionar entrada ao histórico
      const newHistoryEntry: HistoryEntry = {
        id: Date.now().toString(),
        user: 'Usuário Atual (admin)',
        action: 'Configuração WiFi',
        field: 'WiFi',
        oldValue: 'Configurações anteriores',
        newValue: 'Configurações WiFi atualizadas',
        timestamp: new Date().toLocaleString('pt-BR'),
        description: `Configurações WiFi atualizadas para ${wifiInterfaces.length} interfaces.`,
      };

      setHistoryData((prev) => [newHistoryEntry, ...prev]);

      // Refresh geral das configurações
      await refreshProvisionedONUs();
    } catch (error) {
      console.error('Erro ao salvar configurações WiFi:', error);
      alert('Erro ao salvar configurações WiFi. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVlan = () => {
    if (
      editableConfig.newVlan &&
      !editableConfig.attachedVlans.includes(editableConfig.newVlan)
    ) {
      setEditableConfig((prev) => ({
        ...prev,
        attachedVlans: [...prev.attachedVlans, prev.newVlan],
        newVlan: '',
      }));
    }
  };

  const handleRemoveVlan = (vlanToRemove: string) => {
    setEditableConfig((prev) => ({
      ...prev,
      attachedVlans: prev.attachedVlans.filter((vlan) => vlan !== vlanToRemove),
    }));
  };

  const handleOpenPortConfig = (portIndex: number) => {
    setSelectedPortIndex(portIndex);
    setTempPortConfig({ ...ethernetPorts[portIndex] });
    setPortConfigModalOpen(true);
  };

  const handleSavePortConfig = () => {
    if (selectedPortIndex !== null && tempPortConfig) {
      setEthernetPorts((prev) =>
        prev.map((port, index) =>
          index === selectedPortIndex ? { ...tempPortConfig } : port
        )
      );
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
      wanMode:
        editableConfig.wanSetupMode === 'pppoe'
          ? 'PPPoE'
          : editableConfig.wanSetupMode === 'dhcp'
          ? 'DHCP'
          : 'Static IP',
      connectionType:
        editableConfig.wanSetupMode === 'pppoe'
          ? 'PPPoE'
          : editableConfig.wanSetupMode === 'dhcp'
          ? 'DHCP'
          : 'Static IP',
      configMethod: 'TR069',
      ipProtocol: 'Dual stack IPv4/IPv6',
      ipv6Address: 'Auto',
      ipv6Prefix: 'DHCPv6-PD',
      username: editableConfig.pppoeUsername || '',
      password: editableConfig.pppoePassword || '',
      wanRemoteAccess: 'Disabled / not set',
    });
    setWanConfigModalOpen(true);
  };

  const handleSaveWanConfig = async () => {
    if (!id) return;

    try {
      setSaving(true);

      // Preparar dados WAN para salvamento
      const wanUpdates = {
        client_name: customerInfo.customerName,
        client_address: customerInfo.customerAddress,
        comment: customerInfo.comment,
        service_profile:
          wanConfig.configMethod === 'TR069' ? 'TR069_PROFILE' : 'OMCI_PROFILE',
        vlan_id: parseInt(wanConfig.vlanId.split(' - ')[0]) || 105, // Extrair número da VLAN
        wan_mode:
          wanConfig.connectionType === 'PPPoE'
            ? 'pppoe'
            : wanConfig.connectionType === 'DHCP'
            ? 'dhcp'
            : 'static',
        onu_mode: wanConfig.onuMode === 'Routing' ? 'routing' : 'bridge',
        pppoe_username: wanConfig.username || '',
        pppoe_password: wanConfig.password || '',
        wan_remote_access: wanConfig.wanRemoteAccess === 'Enabled',
      };

      console.log('Salvando configurações WAN:', wanUpdates);

      // Salvar via API
      const result = await genieacsApi.updateClientConfiguration(
        id,
        wanUpdates
      );

      if (result.success) {
        // Aplicar configurações WAN na configuração editável local
        setEditableConfig((prev) => ({
          ...prev,
          onuMode: wanConfig.onuMode === 'Routing' ? 'routing' : 'bridge',
          wanSetupMode:
            wanConfig.connectionType === 'PPPoE'
              ? 'pppoe'
              : wanConfig.connectionType === 'DHCP'
              ? 'dhcp'
              : 'static',
          pppoeUsername: wanConfig.username,
          pppoePassword: wanConfig.password,
          tr069Profile:
            wanConfig.configMethod === 'TR069'
              ? 'TR069_PROFILE'
              : 'OMCI_PROFILE',
          attachedVlans: [wanConfig.vlanId.split(' - ')[0] || '105'],
        }));

        // Adicionar entrada ao histórico
        const newHistoryEntry: HistoryEntry = {
          id: Date.now().toString(),
          user: 'Usuário Atual (admin)',
          action: 'Configuração WAN',
          field: 'WAN Setup',
          oldValue: 'Configurações anteriores',
          newValue: `Modo: ${wanConfig.onuMode}, Tipo: ${wanConfig.connectionType}, VLAN: ${wanConfig.vlanId}`,
          timestamp: new Date().toLocaleString('pt-BR'),
          description: `Configurações WAN atualizadas. VLAN: ${wanConfig.vlanId}, Modo: ${wanConfig.onuMode}, Conexão: ${wanConfig.connectionType}`,
        };

        setHistoryData((prev) => [newHistoryEntry, ...prev]);

        console.log('Configurações WAN salvas com sucesso:', result);

        // Refresh dos dados
        await refreshProvisionedONUs();

        setWanConfigModalOpen(false);
      } else {
        throw new Error('Falha ao salvar configurações WAN');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações WAN:', error);
      alert('Erro ao salvar configurações WAN. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelWanConfig = () => {
    setWanConfigModalOpen(false);
  };

  const handleSaveVoipConfig = async () => {
    if (!id) return;

    try {
      setSaving(true);

      // Preparar dados VoIP para salvamento
      const voipUpdates = {
        client_name: customerInfo.customerName,
        client_address: customerInfo.customerAddress,
        comment: customerInfo.comment,
        service_profile: editableConfig.tr069Profile,
        vlan_id: parseInt(editableConfig.attachedVlans[0]) || 100,
        wan_mode: editableConfig.wanSetupMode,
        voip_enabled: editableConfig.voipEnabled,
        voip_sip_server: editableConfig.voipSettings.sipServer || '',
        voip_sip_user: editableConfig.voipSettings.sipUser || '',
        voip_sip_password: editableConfig.voipSettings.sipPassword || '',
        voip_display_name: editableConfig.voipSettings.displayName || '',
      };

      console.log('Salvando configurações VoIP:', voipUpdates);

      // Salvar via API
      const result = await genieacsApi.updateClientConfiguration(
        id,
        voipUpdates
      );

      if (result.success) {
        // Adicionar entrada ao histórico
        const newHistoryEntry: HistoryEntry = {
          id: Date.now().toString(),
          user: 'Usuário Atual (admin)',
          action: 'Configuração VoIP',
          field: 'VoIP',
          oldValue: 'Configurações anteriores',
          newValue: editableConfig.voipEnabled
            ? `VoIP Habilitado - Servidor: ${editableConfig.voipSettings.sipServer}, Usuário: ${editableConfig.voipSettings.sipUser}`
            : 'VoIP Desabilitado',
          timestamp: new Date().toLocaleString('pt-BR'),
          description: `Configurações VoIP ${
            editableConfig.voipEnabled ? 'habilitadas' : 'desabilitadas'
          }.${
            editableConfig.voipEnabled
              ? ` Servidor: ${editableConfig.voipSettings.sipServer}`
              : ''
          }`,
        };

        setHistoryData((prev) => [newHistoryEntry, ...prev]);

        console.log('Configurações VoIP salvas com sucesso:', result);

        // Refresh dos dados
        await refreshProvisionedONUs();

        setOpenVoipDialog(false);
      } else {
        throw new Error('Falha ao salvar configurações VoIP');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações VoIP:', error);
      alert('Erro ao salvar configurações VoIP. Tente novamente.');
    } finally {
      setSaving(false);
    }
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
                    bgcolor: 'primary.main',
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
                    Modelo da ONU
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {onuDetails.onuType}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome"
                    variant="outlined"
                    size="small"
                    value={customerInfo.customerName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Nome do cliente"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Endereço"
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    value={customerInfo.customerAddress}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        customerAddress: e.target.value,
                      }))
                    }
                    placeholder="Endereço completo do cliente"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Comentário"
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    value={customerInfo.comment}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="Observações sobre o cliente"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    ONU Autorizada
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
                        backgroundColor: 'primary.50',
                      },
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
                  <Box
                    sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {getStatusText(onuDetails.status)} - {onuDetails.uptime}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}
                  >
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
                    value={
                      editableConfig.onuMode === 'routing'
                        ? 'Routing'
                        : 'Bridge'
                    }
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2 }}
                    helperText="Modo obtido via WAN Setup Mode"
                  />

                  {/* Configuração VoIP */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
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
                        },
                      }}
                      endIcon={<Edit />}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" color="text.primary">
                          {editableConfig.voipEnabled
                            ? 'Habilitado'
                            : 'Desabilitado'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configurar serviço VoIP
                        </Typography>
                      </Box>
                    </Button>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
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
                        },
                      }}
                      endIcon={<Edit />}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" color="text.primary">
                          {editableConfig.wanSetupMode === 'pppoe'
                            ? 'PPPoE'
                            : editableConfig.wanSetupMode === 'dhcp'
                            ? 'DHCP'
                            : 'Static IP'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configurar WAN avançado
                        </Typography>
                      </Box>
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    label="Perfil TR069"
                    value={editableConfig.tr069Profile}
                    onChange={(e) =>
                      setEditableConfig((prev) => ({
                        ...prev,
                        tr069Profile: e.target.value,
                      }))
                    }
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* Attached VLANs - Editável */}
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    VLANs Associadas
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    {editableConfig.attachedVlans.map((vlan) => (
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
                      onChange={(e) =>
                        setEditableConfig((prev) => ({
                          ...prev,
                          newVlan: e.target.value,
                        }))
                      }
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
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'grey.50',
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: 'block' }}
                          >
                            Nome de Usuário PPPoE
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {editableConfig.pppoeUsername || 'Não configurado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'grey.50',
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: 'block' }}
                          >
                            Status da Senha PPPoE
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {editableConfig.pppoePassword
                              ? '••••••••'
                              : 'Não configurado'}
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
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
              >
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
                              label={
                                port.dhcp === 'enabled'
                                  ? 'Habilitado'
                                  : 'Desabilitado'
                              }
                              color={
                                port.dhcp === 'enabled' ? 'success' : 'error'
                              }
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
                  Configuração das Interfaces Wi-Fi (Redes Separadas)
                </Typography>

                <Grid container spacing={3}>
                  {wifiInterfaces.map((wifi, index) => (
                    <Grid item xs={12} md={6} key={wifi.band}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderColor:
                            wifi.band === '5GHz'
                              ? 'primary.main'
                              : 'success.main',
                          borderWidth: 2,
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Typography variant="h6" fontWeight="600">
                                Rede Wi-Fi {wifi.band}
                              </Typography>
                              <Chip
                                label={
                                  wifi.band === '5GHz'
                                    ? 'Banda Rápida'
                                    : 'Banda Padrão'
                                }
                                size="small"
                                color={
                                  wifi.band === '5GHz' ? 'primary' : 'success'
                                }
                                variant="outlined"
                              />
                            </Box>
                            <IconButton
                              onClick={() => toggleWifiStatus(index)}
                              color={wifi.enabled ? 'success' : 'error'}
                              sx={{
                                backgroundColor: wifi.enabled
                                  ? 'success.light'
                                  : 'error.light',
                                '&:hover': {
                                  backgroundColor: wifi.enabled
                                    ? 'success.main'
                                    : 'error.main',
                                },
                              }}
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
                              onChange={(e) =>
                                updateWiFiField(index, 'ssid', e.target.value)
                              }
                              placeholder="Nome da rede WiFi"
                            />
                            <TextField
                              fullWidth
                              label="Senha"
                              type="password"
                              value={wifi.password}
                              size="small"
                              disabled={!wifi.enabled}
                              onChange={(e) =>
                                updateWiFiField(
                                  index,
                                  'password',
                                  e.target.value
                                )
                              }
                              placeholder="Senha da rede WiFi"
                            />
                            <FormControl
                              size="small"
                              fullWidth
                              disabled={!wifi.enabled}
                            >
                              <InputLabel>Canal</InputLabel>
                              <Select
                                value={wifi.channel}
                                label="Canal"
                                onChange={(e) =>
                                  updateWiFiField(
                                    index,
                                    'channel',
                                    e.target.value
                                  )
                                }
                              >
                                <MenuItem value="auto">Automático</MenuItem>
                                {wifi.band === '2.4GHz'
                                  ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
                                      (ch) => (
                                        <MenuItem
                                          key={ch}
                                          value={ch.toString()}
                                        >
                                          {ch}
                                        </MenuItem>
                                      )
                                    )
                                  : [36, 40, 44, 48, 149, 153, 157, 161].map(
                                      (ch) => (
                                        <MenuItem
                                          key={ch}
                                          value={ch.toString()}
                                        >
                                          {ch}
                                        </MenuItem>
                                      )
                                    )}
                              </Select>
                            </FormControl>
                            <TextField
                              fullWidth
                              label="Potência (%)"
                              type="number"
                              value={wifi.power}
                              size="small"
                              disabled={!wifi.enabled}
                              onChange={(e) =>
                                updateWiFiField(
                                  index,
                                  'power',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              inputProps={{ min: 1, max: 100 }}
                              placeholder="1-100"
                            />
                            <TextField
                              fullWidth
                              label="Máx. Clientes"
                              type="number"
                              value={wifi.maxClients}
                              size="small"
                              disabled={!wifi.enabled}
                              onChange={(e) =>
                                updateWiFiField(
                                  index,
                                  'maxClients',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              inputProps={{ min: 1, max: 64 }}
                              placeholder="1-64"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={wifi.hidden}
                                  disabled={!wifi.enabled}
                                  onChange={(e) =>
                                    updateWiFiField(
                                      index,
                                      'hidden',
                                      e.target.checked
                                    )
                                  }
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

                {/* Botão para salvar configurações WiFi */}
                <Box
                  sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}
                >
                  <Button
                    variant="contained"
                    startIcon={<Wifi />}
                    onClick={saveWiFiChanges}
                    disabled={saving || !hasWiFiChanges()}
                    sx={{
                      borderRadius: 2,
                      background: hasWiFiChanges()
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #6b7280, #4b5563)',
                      '&:hover': {
                        background: hasWiFiChanges()
                          ? 'linear-gradient(135deg, #059669, #047857)'
                          : 'linear-gradient(135deg, #4b5563, #374151)',
                      },
                    }}
                  >
                    {saving
                      ? 'Salvando...'
                      : hasWiFiChanges()
                      ? 'Salvar WiFi'
                      : 'WiFi Salvo'}
                  </Button>
                </Box>
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
              onClick={handleSaveClick}
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
        onClose={() => setActionDialog((prev) => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{actionDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog((prev) => ({ ...prev, open: false }))
            }
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={executeAction}
            variant="contained"
            color={
              actionDialog.action === 'delete' ||
              actionDialog.action === 'factory_reset'
                ? 'error'
                : 'primary'
            }
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Data/Hora
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Usuário
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Ação
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Campo
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Valor Anterior
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
                    Novo Valor
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, backgroundColor: 'grey.50' }}
                  >
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
                            bgcolor: 'primary.main',
                          }}
                        >
                          {entry.user.split(' ')[0].charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{entry.user}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        size="small"
                        color={
                          entry.action === 'Criação'
                            ? 'success'
                            : entry.action === 'Configuração'
                            ? 'primary'
                            : entry.action === 'Sistema'
                            ? 'warning'
                            : 'default'
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
                          fontFamily: 'monospace',
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
                          fontFamily: 'monospace',
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
          Configurar Porta{' '}
          {selectedPortIndex !== null ? selectedPortIndex + 1 : ''}
        </DialogTitle>
        <DialogContent>
          {tempPortConfig && (
            <Box
              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
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
                  onChange={(e) =>
                    setTempPortConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            mode: e.target.value as
                              | 'Lan'
                              | 'Access'
                              | 'Hybrid'
                              | 'Trunk'
                              | 'Transparent',
                          }
                        : null
                    )
                  }
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
                  onChange={(e) =>
                    setTempPortConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            dhcp: e.target.value as 'enabled' | 'disabled',
                          }
                        : null
                    )
                  }
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
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
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

        <DialogContent
          sx={{
            p: 3,
            pt: 4,
            mt: 1,
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <Grid container spacing={2}>
            {/* Row 1: VLAN-ID and Remote Access */}
            <Grid item xs={12} md={6} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>WAN VLAN-ID</InputLabel>
                <Select
                  value={wanConfig.vlanId}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      vlanId: e.target.value,
                    }))
                  }
                  label="WAN VLAN-ID"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="105 - PADRAO-PPPoE-CLI">
                    105 - PADRAO-PPPoE-CLI
                  </MenuItem>
                  <MenuItem value="106 - DHCP-DEFAULT">
                    106 - DHCP-DEFAULT
                  </MenuItem>
                  <MenuItem value="107 - STATIC-IP">107 - STATIC-IP</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Acesso Remoto WAN</InputLabel>
                <Select
                  value={wanConfig.wanRemoteAccess}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      wanRemoteAccess: e.target.value as
                        | 'Disabled / not set'
                        | 'Enabled',
                    }))
                  }
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
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, height: '100%' }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Modo da ONU
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.onuMode}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      onuMode: e.target.value as 'Routing' | 'Bridging',
                    }))
                  }
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
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, height: '100%' }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Método de Configuração
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.configMethod}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      configMethod: e.target.value as 'OMCI' | 'TR069',
                    }))
                  }
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
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Tipo de Conexão
                </Typography>
                <RadioGroup
                  row
                  value={wanConfig.connectionType}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      connectionType: e.target
                        .value as WANConfiguration['connectionType'],
                    }))
                  }
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
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, height: '100%' }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Protocolo IP
                </Typography>
                <RadioGroup
                  value={wanConfig.ipProtocol}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      ipProtocol: e.target.value as
                        | 'IPv4'
                        | 'Dual stack IPv4/IPv6',
                    }))
                  }
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
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, height: '100%' }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Endereço IPv6
                </Typography>
                <RadioGroup
                  value={wanConfig.ipv6Address}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      ipv6Address: e.target
                        .value as WANConfiguration['ipv6Address'],
                    }))
                  }
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
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, height: '100%' }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{ mb: 1.5, color: 'primary.main' }}
                >
                  Prefixo IPv6
                </Typography>
                <RadioGroup
                  value={wanConfig.ipv6Prefix}
                  onChange={(e) =>
                    setWanConfig((prev) => ({
                      ...prev,
                      ipv6Prefix: e.target
                        .value as WANConfiguration['ipv6Prefix'],
                    }))
                  }
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
                    <Chip
                      label="Credenciais PPPoE"
                      color="primary"
                      variant="outlined"
                    />
                  </Divider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome de Usuário"
                    value={wanConfig.username}
                    onChange={(e) =>
                      setWanConfig((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Senha"
                    type="password"
                    value={wanConfig.password}
                    onChange={(e) =>
                      setWanConfig((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            gap: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
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
            startIcon={saving ? null : <Save />}
            disabled={saving}
            sx={{
              borderRadius: 2,
              minWidth: 140,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            {saving ? 'Salvando...' : 'Aplicar Configurações'}
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
        <DialogTitle>Configuração VoIP</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Switch
              checked={editableConfig.voipEnabled}
              onChange={(e) =>
                setEditableConfig((prev) => ({
                  ...prev,
                  voipEnabled: e.target.checked,
                }))
              }
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
                  onChange={(e) =>
                    setEditableConfig((prev) => ({
                      ...prev,
                      voipSettings: {
                        ...prev.voipSettings,
                        sipServer: e.target.value,
                      },
                    }))
                  }
                  placeholder="sip.provedor.com.br"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Usuário SIP"
                  value={editableConfig.voipSettings.sipUser}
                  onChange={(e) =>
                    setEditableConfig((prev) => ({
                      ...prev,
                      voipSettings: {
                        ...prev.voipSettings,
                        sipUser: e.target.value,
                      },
                    }))
                  }
                  placeholder="usuario"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha SIP"
                  type="password"
                  value={editableConfig.voipSettings.sipPassword}
                  onChange={(e) =>
                    setEditableConfig((prev) => ({
                      ...prev,
                      voipSettings: {
                        ...prev.voipSettings,
                        sipPassword: e.target.value,
                      },
                    }))
                  }
                  placeholder="senha"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome de Exibição"
                  value={editableConfig.voipSettings.displayName}
                  onChange={(e) =>
                    setEditableConfig((prev) => ({
                      ...prev,
                      voipSettings: {
                        ...prev.voipSettings,
                        displayName: e.target.value,
                      },
                    }))
                  }
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
            onClick={handleSaveVoipConfig}
            variant="contained"
            disabled={saving}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Alterações */}
      <Dialog
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            background: 'linear-gradient(135deg, #6366f1, #5855eb)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Save />
          Confirmar Alterações
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Atenção:</strong> As seguintes alterações serão aplicadas.
              Verifique cuidadosamente antes de confirmar.
            </Typography>
          </Alert>

          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: '#374151', fontWeight: 600 }}
          >
            Alterações Detectadas ({pendingChanges.length})
          </Typography>

          {pendingChanges.map((change, index) => (
            <Card
              key={index}
              sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}
            >
              <CardContent sx={{ py: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: '#4f46e5' }}
                    >
                      {change.label}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Valor Anterior
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#dc2626',
                          fontFamily: 'monospace',
                          backgroundColor: '#fef2f2',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid #fecaca',
                          wordBreak: 'break-word',
                        }}
                      >
                        {change.oldValue}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={1}
                    display="flex"
                    justifyContent="center"
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#6b7280',
                      }}
                    >
                      →
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Novo Valor
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#059669',
                          fontFamily: 'monospace',
                          backgroundColor: '#f0fdf4',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid #bbf7d0',
                          wordBreak: 'break-word',
                        }}
                      >
                        {change.newValue}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Estas alterações serão aplicadas
              imediatamente e podem afetar a conectividade do cliente.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setConfirmationModalOpen(false)}
            variant="outlined"
            startIcon={<Close />}
            sx={{
              borderRadius: 2,
              minWidth: 140,
              color: '#6b7280',
              borderColor: '#d1d5db',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleConfirmSave}
            variant="contained"
            startIcon={<Save />}
            disabled={saving}
            sx={{
              borderRadius: 2,
              minWidth: 140,
              background: 'linear-gradient(135deg, #6366f1, #5855eb)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5855eb, #4f46e5)',
              },
            }}
          >
            {saving ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ONUConfigurationNew;
