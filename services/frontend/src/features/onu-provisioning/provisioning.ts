// Tipos para provisionamento de ONUs/ONTs
export interface PendingONU {
  id: string;
  serialNumber: string;
  oltName: string;
  board: number;
  port: number;
  discoveredAt: string;
  distance: number;
  onuType: string;
  status: 'pending' | 'authorized' | 'failed';
  rxPower?: number;
  temperature?: number;
}

export interface ProvisionedONU {
  id: string;
  serialNumber: string;
  oltName: string;
  board: number;
  port: number;
  onuId: number;
  authorizedAt: string;
  onuType: string;

  // Informações do cliente
  clientName: string;
  clientAddress: string;
  comment?: string;

  // Status e monitoramento
  status: 'online' | 'offline' | 'disabled';
  uptime: string;
  onuRx: number;
  oltRx: number;
  attachedVlans: number[];
  onuMode: 'routing' | 'bridge';

  // Configuração de rede
  tr069Profile: string;
  wanSetupMode: 'dhcp' | 'static' | 'pppoe';

  // Configuração PPPoE (quando aplicável)
  pppoeUsername?: string;
  pppoePassword?: string;

  // Configurações de portas LAN
  lanPorts: {
    id: number;
    enabled: boolean;
    mode: 'auto' | '10M' | '100M' | '1G';
    description?: string;
  }[];

  // Configurações WiFi
  wifiSettings: {
    enabled: boolean;
    ssid: string;
    password: string;
    channel: number;
    bandwidth: '20MHz' | '40MHz' | '80MHz';
    security: 'WPA2' | 'WPA3' | 'WPA2/WPA3';
    frequency: '2.4GHz' | '5GHz' | 'dual';
  }[];

  // Configurações VoIP
  voipEnabled?: boolean;
  voipSettings?: {
    sipServer: string;
    sipUser: string;
    sipPassword: string;
    displayName: string;
  };
}

// Utility function to determine signal status based on RX power
export function getSignalStatus(rxPower: number): 'good' | 'warning' | 'poor' {
  if (rxPower >= -23) return 'good';
  if (rxPower >= -27) return 'warning';
  return 'poor';
}
