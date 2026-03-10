import type { ConnectedHost } from './types';

export const connectedHosts: ConnectedHost[] = [
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

export const historicoAlteracoes = [
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

export const mockGeneralInfo = {
  manufacturer: 'ZTE Corporation',
  softwareVersion: 'V2.1.3_220825',
  hardwareVersion: 'V1.0',
  cpuUsage: '12%',
  totalRam: '128 MB',
  freeRam: '95 MB',
  uptime: '15 dias, 8 horas, 23 minutos',
};

export const mockDeviceLogs = [
  { timestamp: '2024-01-15 16:30:25', message: 'Sistema iniciado' },
  { timestamp: '2024-01-15 16:30:45', message: 'WiFi configurado' },
  { timestamp: '2024-01-15 16:31:00', message: 'DHCP ativo' },
  { timestamp: '2024-01-15 16:31:15', message: 'Primeira conexão de cliente' },
];

export const mockLanPorts = [
  { name: 'LAN1', active: true, connected: true, speed: '1000 Mbps', duplex: 'Full' },
  { name: 'LAN2', active: false, connected: false, speed: '-', duplex: '-' },
  { name: 'LAN3', active: true, connected: true, speed: '100 Mbps', duplex: 'Full' },
  { name: 'LAN4', active: false, connected: false, speed: '-', duplex: '-' },
];
