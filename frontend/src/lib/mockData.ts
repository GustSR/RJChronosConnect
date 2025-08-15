// Mock data for RJChronos frontend
export interface CPE {
  id: string;
  serialNumber: string;
  model: string;
  firmware: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  ipAddress: string;
  macAddress: string;
  lastSeen: string;
  uptime: string;
  signalStrength: number;
  location: string;
  customer: string;
  onuId?: string;
}

export interface ONU {
  id: string;
  serialNumber: string;
  model: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  oltId: string;
  ponPort: number;
  onuIndex: number;
  rxPower: number;
  txPower: number;
  distance: number;
  lastSeen: string;
  cpes: string[];
}

export interface OLT {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  ipAddress: string;
  location: string;
  ponPorts: number;
  activeOnus: number;
  totalOnus: number;
  uptime: string;
  temperature: number;
  lastSeen: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  deviceId: string;
  deviceType: 'cpe' | 'onu' | 'olt';
  timestamp: string;
  acknowledged: boolean;
  assignedTo?: string;
}

export interface Metric {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
  deviceIds: string[];
}

// Mock data
export const mockCPEs: CPE[] = [
  {
    id: 'cpe-001',
    serialNumber: 'CPE001234567',
    model: 'Intelbras IWR 3000N',
    firmware: '1.2.3',
    status: 'online',
    ipAddress: '192.168.1.100',
    macAddress: '00:11:22:33:44:55',
    lastSeen: '2025-01-12T15:30:00Z',
    uptime: '7d 12h 30m',
    signalStrength: -45,
    location: 'Copacabana, RJ',
    customer: 'João Silva',
    onuId: 'onu-001'
  },
  {
    id: 'cpe-002',
    serialNumber: 'CPE001234568',
    model: 'TP-Link Archer C6',
    firmware: '1.3.0',
    status: 'warning',
    ipAddress: '192.168.1.101',
    macAddress: '00:11:22:33:44:56',
    lastSeen: '2025-01-12T15:25:00Z',
    uptime: '3d 8h 15m',
    signalStrength: -65,
    location: 'Ipanema, RJ',
    customer: 'Maria Santos',
    onuId: 'onu-002'
  },
  {
    id: 'cpe-003',
    serialNumber: 'CPE001234569',
    model: 'Huawei HG8245H',
    firmware: '2.1.0',
    status: 'offline',
    ipAddress: '192.168.1.102',
    macAddress: '00:11:22:33:44:57',
    lastSeen: '2025-01-12T10:15:00Z',
    uptime: '0m',
    signalStrength: 0,
    location: 'Leblon, RJ',
    customer: 'Pedro Costa',
    onuId: 'onu-003'
  }
];

export const mockONUs: ONU[] = [
  {
    id: 'onu-001',
    serialNumber: 'ONU001234567',
    model: 'Huawei HG8310M',
    status: 'online',
    oltId: 'olt-001',
    ponPort: 1,
    onuIndex: 1,
    rxPower: -18.5,
    txPower: 2.3,
    distance: 1250,
    lastSeen: '2025-01-12T15:30:00Z',
    cpes: ['cpe-001']
  },
  {
    id: 'onu-002',
    serialNumber: 'ONU001234568',
    model: 'Nokia G-010G-A',
    status: 'warning',
    oltId: 'olt-001',
    ponPort: 1,
    onuIndex: 2,
    rxPower: -22.1,
    txPower: 1.8,
    distance: 1800,
    lastSeen: '2025-01-12T15:25:00Z',
    cpes: ['cpe-002']
  },
  {
    id: 'onu-003',
    serialNumber: 'ONU001234569',
    model: 'ZTE F601',
    status: 'offline',
    oltId: 'olt-001',
    ponPort: 2,
    onuIndex: 1,
    rxPower: 0,
    txPower: 0,
    distance: 0,
    lastSeen: '2025-01-12T10:15:00Z',
    cpes: ['cpe-003']
  }
];

export const mockOLTs: OLT[] = [
  {
    id: 'olt-001',
    name: 'OLT-Copacabana-01',
    model: 'Huawei MA5608T',
    status: 'online',
    ipAddress: '10.0.1.10',
    location: 'Central Copacabana',
    ponPorts: 8,
    activeOnus: 156,
    totalOnus: 200,
    uptime: '45d 12h 30m',
    temperature: 42,
    lastSeen: '2025-01-12T15:30:00Z'
  },
  {
    id: 'olt-002',
    name: 'OLT-Ipanema-01',
    model: 'ZTE C320',
    status: 'warning',
    ipAddress: '10.0.1.11',
    location: 'Central Ipanema',
    ponPorts: 16,
    activeOnus: 298,
    totalOnus: 400,
    uptime: '23d 6h 45m',
    temperature: 55,
    lastSeen: '2025-01-12T15:28:00Z'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    type: 'critical',
    title: 'ONU Offline',
    description: 'ONU ONU001234569 está offline há mais de 5 horas',
    deviceId: 'onu-003',
    deviceType: 'onu',
    timestamp: '2025-01-12T10:15:00Z',
    acknowledged: false
  },
  {
    id: 'alert-002',
    type: 'warning',
    title: 'Sinal Baixo',
    description: 'CPE CPE001234568 com sinal de -65dBm',
    deviceId: 'cpe-002',
    deviceType: 'cpe',
    timestamp: '2025-01-12T14:20:00Z',
    acknowledged: false
  },
  {
    id: 'alert-003',
    type: 'warning',
    title: 'Temperatura Alta',
    description: 'OLT OLT-Ipanema-01 com temperatura de 55°C',
    deviceId: 'olt-002',
    deviceType: 'olt',
    timestamp: '2025-01-12T15:00:00Z',
    acknowledged: true,
    assignedTo: 'Técnico João'
  }
];

export const mockAIInsights: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'prediction',
    title: 'Possível Falha de ONU',
    description: 'ONU ONU001234568 apresenta padrão de degradação que pode levar à falha em 24-48h',
    confidence: 0.85,
    impact: 'high',
    timestamp: '2025-01-12T15:00:00Z',
    deviceIds: ['onu-002']
  },
  {
    id: 'insight-002',
    type: 'recommendation',
    title: 'Otimização de Potência',
    description: 'Recomenda-se ajustar a potência do OLT para melhorar o sinal das ONUs na PON 1',
    confidence: 0.92,
    impact: 'medium',
    timestamp: '2025-01-12T14:30:00Z',
    deviceIds: ['olt-001']
  },
  {
    id: 'insight-003',
    type: 'anomaly',
    title: 'Padrão Anômalo de Tráfego',
    description: 'Detectado tráfego incomum no CPE CPE001234567 nas últimas 2 horas',
    confidence: 0.78,
    impact: 'low',
    timestamp: '2025-01-12T13:45:00Z',
    deviceIds: ['cpe-001']
  }
];

export const mockMetrics = {
  devicesOnline: 245,
  devicesOffline: 12,
  criticalAlerts: 3,
  warningAlerts: 8,
  failureRate: 2.1,
  automations: 15,
  networkUptime: 99.8,
  avgSignalStrength: -52,
  totalBandwidth: 1250,
  usedBandwidth: 890
};

export const mockNetworkData: Metric[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
  value: Math.floor(Math.random() * 100) + 50,
  label: `${23 - i}h atrás`
}));
