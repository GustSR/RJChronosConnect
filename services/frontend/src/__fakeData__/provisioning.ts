import {
  PendingONU,
  ProvisionedONU,
} from '@features/onu-provisioning/provisioning';

// Dados mockados para ONUs pendentes
export const mockPendingONUs: PendingONU[] = [
  {
    id: 'pending-1',
    serialNumber: 'ZTEG12345678',
    oltName: 'OLT-Central-01',
    board: 1,
    port: 8,
    discoveredAt: '2024-08-29T10:30:00Z',
    distance: 1.2,
    onuType: 'ZTE F601',
    status: 'pending',
    rxPower: -18.5,
    temperature: 32,
  },
  {
    id: 'pending-2',
    serialNumber: 'FHTT87654321',
    oltName: 'OLT-Norte-03',
    board: 2,
    port: 15,
    discoveredAt: '2024-08-29T11:15:00Z',
    distance: 2.8,
    onuType: 'FiberHome AN5506-04-A',
    status: 'pending',
    rxPower: -21.2,
    temperature: 35,
  },
  {
    id: 'pending-3',
    serialNumber: 'HWTC56781234',
    oltName: 'OLT-Sul-02',
    board: 1,
    port: 3,
    discoveredAt: '2024-08-29T09:45:00Z',
    distance: 0.8,
    onuType: 'Huawei HG8240H5',
    status: 'pending',
    rxPower: -16.8,
    temperature: 29,
  },
  {
    id: 'pending-4',
    serialNumber: 'ZTEG98765432',
    oltName: 'OLT-Oeste-01',
    board: 3,
    port: 12,
    discoveredAt: '2024-08-29T12:00:00Z',
    distance: 3.5,
    onuType: 'ZTE F670L',
    status: 'pending',
    rxPower: -23.1,
    temperature: 38,
  },
];

// Dados mockados para ONUs provisionadas
export const mockProvisionedONUs: ProvisionedONU[] = [
  {
    id: 'provisioned-1',
    serialNumber: 'ZTEG11111111',
    oltName: 'OLT-Central-01',
    board: 1,
    port: 5,
    onuId: 1,
    authorizedAt: '2024-08-28T14:20:00Z',
    onuType: 'ZTE F601',

    clientName: 'João Silva Santos',
    clientAddress: 'Rua das Flores, 123, Centro - Rio de Janeiro/RJ',
    comment: 'Cliente VIP - Plano 500MB',

    status: 'online',
    uptime: '2d 14h 30m',
    onuRx: -19.2,
    oltRx: -18.5,
    attachedVlans: [100, 200],
    onuMode: 'routing',

    tr069Profile: 'default-profile',
    wanSetupMode: 'pppoe',
    pppoeUsername: 'joao.silva@provedor.com.br',
    pppoePassword: '********',

    lanPorts: [
      { id: 1, enabled: true, mode: 'auto', description: 'Port 1' },
      { id: 2, enabled: true, mode: 'auto', description: 'Port 2' },
      { id: 3, enabled: false, mode: 'auto', description: 'Port 3' },
      { id: 4, enabled: true, mode: '1G', description: 'Port 4 - IPTV' },
    ],

    wifiSettings: [
      {
        enabled: true,
        ssid: 'Silva_WiFi_2G',
        password: 'MinhaWiFi123',
        channel: 6,
        bandwidth: '20MHz',
        security: 'WPA2/WPA3',
        frequency: '2.4GHz',
      },
      {
        enabled: true,
        ssid: 'Silva_WiFi_5G',
        password: 'MinhaWiFi123',
        channel: 36,
        bandwidth: '80MHz',
        security: 'WPA2/WPA3',
        frequency: '5GHz',
      },
    ],

    // Configurações VoIP
    voipEnabled: true,
    voipSettings: {
      sipServer: 'sip.provedor.com.br',
      sipUser: 'joao.silva',
      sipPassword: '********',
      displayName: 'João Silva Santos',
    },
  },
  {
    id: 'provisioned-2',
    serialNumber: 'FHTT22222222',
    oltName: 'OLT-Norte-03',
    board: 1,
    port: 10,
    onuId: 5,
    authorizedAt: '2024-08-27T09:30:00Z',
    onuType: 'FiberHome AN5506-04-A',

    clientName: 'Maria Oliveira Costa',
    clientAddress: 'Av. Atlântica, 456, Copacabana - Rio de Janeiro/RJ',
    comment: 'Instalação residencial',

    status: 'online',
    uptime: '3d 8h 15m',
    onuRx: -20.8,
    oltRx: -19.2,
    attachedVlans: [100],
    onuMode: 'bridge',

    tr069Profile: 'residential-profile',
    wanSetupMode: 'dhcp',

    lanPorts: [
      { id: 1, enabled: true, mode: 'auto', description: 'LAN 1' },
      { id: 2, enabled: true, mode: 'auto', description: 'LAN 2' },
      { id: 3, enabled: true, mode: 'auto', description: 'LAN 3' },
      { id: 4, enabled: true, mode: 'auto', description: 'LAN 4' },
    ],

    wifiSettings: [
      {
        enabled: true,
        ssid: 'Casa_Maria',
        password: 'FamiliaOliveira2024',
        channel: 11,
        bandwidth: '40MHz',
        security: 'WPA3',
        frequency: 'dual',
      },
    ],

    // Configurações VoIP
    voipEnabled: false,
    voipSettings: {
      sipServer: '',
      sipUser: '',
      sipPassword: '',
      displayName: '',
    },
  },
];

// Perfis TR069 disponíveis
export const tr069Profiles = [
  { value: 'default-profile', label: 'Perfil Padrão Residencial' },
  { value: 'business-profile', label: 'Perfil Empresarial' },
  { value: 'gaming-profile', label: 'Perfil Gaming' },
  { value: 'iptv-profile', label: 'Perfil IPTV' },
  { value: 'custom-profile', label: 'Perfil Personalizado' },
];

// Tipos de ONUs disponíveis
export const onuTypes = [
  { value: 'zte-f601', label: 'ZTE F601', manufacturer: 'ZTE' },
  { value: 'zte-f670l', label: 'ZTE F670L', manufacturer: 'ZTE' },
  {
    value: 'fiberhome-an5506',
    label: 'FiberHome AN5506-04-A',
    manufacturer: 'FiberHome',
  },
  {
    value: 'huawei-hg8240h5',
    label: 'Huawei HG8240H5',
    manufacturer: 'Huawei',
  },
  { value: 'huawei-hg8245h', label: 'Huawei HG8245H', manufacturer: 'Huawei' },
];
