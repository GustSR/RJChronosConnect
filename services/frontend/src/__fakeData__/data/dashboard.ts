// Dashboard Metrics Mock Data
import { DashboardMetrics } from '../../api/types';

export const mockDashboardMetrics: DashboardMetrics = {
  total_devices: 156,
  online_devices: 142,
  offline_devices: 14,
  alerts_count: 3,
  traffic_stats: {
    total_bandwidth: 8547.3,
    upload: 2341.2,
    download: 6206.1,
  },
  olt_stats: {
    total_olts: 4,
    online_olts: 4,
    total_onus: 156,
    online_onus: 142,
    average_rx_power: -18.5,
  },
  connection_stats: {
    pppoe_connections: 98,
    dhcp_connections: 44,
    static_connections: 14,
  },
  wifi_stats: {
    total_wifi_enabled: 134,
    unique_ssids: 89,
    security_types: {
      'WPA2-PSK': 112,
      'WPA-PSK': 18,
      Open: 4,
    },
  },
};