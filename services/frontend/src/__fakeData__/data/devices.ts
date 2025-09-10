// Network Devices Mock Data
import { ONU, CPE, OLT } from '@shared/api/types';

export const mockONUs: ONU[] = [
  {
    id: '1',
    serial_number: 'GPON12345678',
    model: 'Huawei HG8245H',
    status: 'online',
    last_inform: '2024-01-15T14:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
    olt_id: 'olt-central-01',
    pon_port: '1/1/1',
    rx_power: -15.2,
    customer_name: 'João da Silva Santos',
    customer_address: 'Rua das Flores, 123',
    external_ip: '200.123.45.67',
    lan_ip: '192.168.1.1',
    voip_enabled: true,
  },
  {
    id: '2',
    serial_number: 'GPON87654321',
    model: 'ZTE F670L',
    status: 'online',
    last_inform: '2024-01-15T14:28:00Z',
    created_at: '2024-01-02T00:00:00Z',
    olt_id: 'olt-central-01',
    pon_port: '1/1/2',
    rx_power: -17.8,
    customer_name: 'Maria Santos Costa',
    customer_address: 'Av. Central, 456',
    external_ip: '200.123.45.68',
    lan_ip: '192.168.1.1',
    voip_enabled: false,
  },
  {
    id: '3',
    serial_number: 'GPON11223344',
    model: 'Fiberhome AN5506-04',
    status: 'offline',
    last_inform: '2024-01-14T22:15:00Z',
    created_at: '2024-01-03T00:00:00Z',
    olt_id: 'olt-norte-03',
    pon_port: '1/2/1',
    rx_power: -25.1,
    customer_name: 'Carlos Mendes',
    customer_address: 'Rua Norte, 789',
    external_ip: '200.123.45.69',
    lan_ip: '192.168.1.1',
    voip_enabled: true,
  },
];

export const mockCPEs: CPE[] = [
  {
    id: '1',
    serial_number: 'CPE12345678',
    model: 'Intelbras Action R1200',
    status: 'online',
    created_at: '2024-01-01T00:00:00Z',
    wifi_enabled: true,
    wifi_ssid: 'RJChronos_123456',
    customer_name: 'Maria Silva',
  },
  {
    id: '2',
    serial_number: 'CPE87654321',
    model: 'TP-Link Archer C6',
    status: 'online',
    created_at: '2024-01-02T00:00:00Z',
    wifi_enabled: true,
    wifi_ssid: 'RJChronos_789012',
    customer_name: 'Pedro Santos',
  },
  {
    id: '3',
    serial_number: 'CPE55667788',
    model: 'Multilaser RE160V',
    status: 'offline',
    created_at: '2024-01-03T00:00:00Z',
    wifi_enabled: false,
    wifi_ssid: 'RJChronos_345678',
    customer_name: 'Ana Costa',
  },
];

export const mockOLTs: OLT[] = [
  {
    id: 'olt-001',
    serial_number: 'OLT12345678',
    model: 'Huawei MA5608T',
    status: 'online',
    created_at: '2024-01-01T00:00:00Z',
    location: 'Central - Rio de Janeiro',
    pon_ports: 16,
    active_onus: 142,
    uptime: 1318800, // 15 days, 8 hours in seconds
    cpu_usage: 45.2,
    memory_usage: 67.8,
    temperature: 42.1,
  },
  {
    id: 'olt-002',
    serial_number: 'OLT87654321',
    model: 'Fiberhome AN5516-06',
    status: 'online',
    created_at: '2024-01-02T00:00:00Z',
    location: 'Bairro - Rio de Janeiro',
    pon_ports: 8,
    active_onus: 89,
    uptime: 226800, // 2 days, 14 hours in seconds
    cpu_usage: 52.7,
    memory_usage: 71.3,
    temperature: 38.9,
  },
  {
    id: 'olt-003',
    serial_number: 'OLT11223344',
    model: 'ZTE C320',
    status: 'online',
    created_at: '2024-01-03T00:00:00Z',
    location: 'Industrial - Rio de Janeiro',
    pon_ports: 8,
    active_onus: 67,
    uptime: 3898800, // 45 days, 2 hours in seconds
    cpu_usage: 38.1,
    memory_usage: 59.4,
    temperature: 44.7,
  },
  {
    id: 'olt-004',
    serial_number: 'OLT99887766',
    model: 'Huawei MA5800-X7',
    status: 'offline',
    created_at: '2024-01-04T00:00:00Z',
    location: 'Residencial - Rio de Janeiro',
    pon_ports: 16,
    active_onus: 0,
    uptime: 21600, // 6 hours in seconds
    cpu_usage: 0,
    memory_usage: 0,
    temperature: 0,
  },
];

// OLT Stats Mock Data
export const mockOLTStats: Record<
  string,
  { total: number; online: number; offline: number }
> = {
  '1': { total: 324, online: 298, offline: 26 },
  '2': { total: 256, online: 231, offline: 25 },
  '3': { total: 189, online: 175, offline: 14 },
  '4': { total: 412, online: 387, offline: 25 },
};
