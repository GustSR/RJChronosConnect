// Tipos compartilhados para integração com API GenieACS
// Baseado nos transformadores do backend (genieacs_transformers.py)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dispositivos - Baseado na estrutura GenieACS/TR-069
export interface Device {
  id: string;
  serial_number: string;
  model: string;
  status: 'online' | 'offline' | 'powered_off' | 'admin_disabled';
  ip_address?: string;
  last_seen?: string;
  created_at: string;
  // GenieACS specific
  last_inform?: string;
  product_class?: string;
  manufacturer?: string;
  hardware_version?: string;
  software_version?: string;
}

export interface CPE extends Device {
  wifi_enabled: boolean;
  wifi_ssid?: string;
  signal_strength?: number;
  customer_name?: string;
  // TR-069 WiFi parameters
  beacon_type?: string;
  channel?: string;
  ssid_advertisement_enabled?: boolean;
  encryption_modes?: string;
  authentication_mode?: string;
}

export interface ONU extends Device {
  olt_id: string;
  pon_port: string;
  rx_power?: number;
  tx_power?: number;
  distance?: number;
  customer_name?: string;
  customer_address?: string;
  board?: string;
  port?: string;
  vlan?: string;
  modo?: 'routing' | 'bridge';
  voip_enabled?: boolean;
  authenticated_at?: string;
  // TR-069/GenieACS specific
  external_ip?: string;
  lan_ip?: string;
  connection_request_url?: string;
  periodic_inform_interval?: number;
  dhcp_enabled?: boolean;
  dns_servers?: string;
}

export interface OLT extends Device {
  location: string;
  pon_ports: number;
  active_onus: number;
  // OLT specific metrics
  uptime?: number;
  cpu_usage?: number;
  memory_usage?: number;
  temperature?: number;
}

// Alertas - Baseado nas fault transformations do GenieACS
export interface Alert {
  id: string;
  device_id?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  acknowledged: boolean;
  created_at: string;
  // GenieACS fault specific
  fault_code?: string;
  fault_string?: string;
  resolved?: boolean;
  resolved_at?: string;
}

// Dashboard Metrics - Baseado no calculate_dashboard_metrics
export interface DashboardMetrics {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  alerts_count: number;
  traffic_stats: {
    total_bandwidth: number;
    upload: number;
    download: number;
  };
  olt_stats: {
    total_olts: number;
    online_olts: number;
    total_onus: number;
    online_onus: number;
    average_rx_power: number;
  };
  connection_stats: {
    pppoe_connections: number;
    dhcp_connections: number;
    static_connections: number;
  };
  wifi_stats: {
    total_wifi_enabled: number;
    unique_ssids: number;
    security_types: Record<string, number>;
  };
}

// WiFi Configuration - Baseado nos presets GenieACS
export interface WiFiConfig {
  device_id: string;
  ssid: string;
  security: string;
  password?: string;
  band?: string;
  channel?: string;
  power?: number;
  hidden: boolean;
  enabled: boolean;
  // TR-069 specific parameters
  beacon_type?: 'Basic' | '11i' | 'WPA' | 'WPAand11i';
  encryption_modes?: 'WEP' | 'TKIP' | 'AES' | 'TKIPandAES';
  authentication_mode?:
    | 'None'
    | 'EAPAuthentication'
    | 'SharedAuthentication'
    | 'PSKAuthentication';
  wps_enabled?: boolean;
  max_bit_rate?: string;
  operating_frequency_band?: '2.4GHz' | '5GHz';
  auto_channel_enable?: boolean;
}

export interface WiFiConfigUpdate {
  ssid?: string;
  security?: string;
  password?: string;
  band?: string;
  channel?: string;
  power?: number;
  hidden?: boolean;
  enabled?: boolean;
  beacon_type?: string;
  encryption_modes?: string;
  authentication_mode?: string;
  wps_enabled?: boolean;
}

// Activity History - Integrado com GenieACS tasks
export interface ActivityLog {
  id: string;
  device_id?: string;
  action: string;
  description: string;
  user_id?: string;
  user_name?: string;
  status: 'success' | 'error' | 'pending' | 'timeout';
  created_at: string;
  details?: Record<string, unknown>;
  // GenieACS task specific
  task_id?: string;
  task_name?: string;
  parameter_values?: Record<string, unknown>;
  fault_code?: string;
  fault_string?: string;
}

// Bandwidth Analytics - Dados históricos de tráfego
export interface BandwidthData {
  timestamp: string;
  download_mbps: number;
  upload_mbps: number;
  total_mbps: number;
}

export interface BandwidthStats {
  current_download: number;
  current_upload: number;
  peak_download: number;
  peak_upload: number;
  average_download: number;
  average_upload: number;
  data_points: BandwidthData[];
}

// Query Parameters - Adaptado para GenieACS
export interface DeviceQuery {
  status?: string;
  model?: string;
  manufacturer?: string;
  product_class?: string;
  olt_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  // GenieACS specific filters
  last_inform_since?: string;
  has_external_ip?: boolean;
  wifi_enabled?: boolean;
  connection_type?: 'pppoe' | 'dhcp' | 'static';
}

export interface AlertQuery {
  severity?: string;
  acknowledged?: boolean;
  device_id?: string;
  page?: number;
  limit?: number;
  resolved?: boolean;
  fault_code?: string;
}

// GenieACS Task - Para operações TR-069
export interface GenieACSTask {
  id: string;
  device_id: string;
  name: string;
  timestamp: string;
  parameter_names?: string[];
  parameter_values?: Record<string, unknown>;
  file_type?: string;
  file_name?: string;
  target_filename?: string;
}

// TR-069 Connection Request
export interface ConnectionRequest {
  device_id: string;
  url: string;
  username?: string;
  password?: string;
  timestamp: string;
}

// Device Parameters - Para TR-069 parameter paths
export interface DeviceParameter {
  path: string;
  value: unknown;
  type: 'string' | 'int' | 'boolean' | 'dateTime' | 'base64';
  writable: boolean;
  timestamp: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface TrafficSource {
  id: string;
  name: string;
  region: string;
  traffic_mbps: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trend_value: number;
  device_type: 'OLT' | 'Router' | 'Switch';
  status: 'online' | 'offline' | 'warning';
}

export interface TrafficSourcesStats {
  sources: TrafficSource[];
  total_traffic: number;
  period: string;
}

export interface OLTPerformanceData {
  olt_id: string;
  olt_name: string;
  cpu_usage: number;
  memory_usage: number;
  temperature: number;
  status: 'online' | 'offline' | 'warning';
  location: string;
  timestamp: string;
}

export interface OLTPerformanceStats {
  performance_data: OLTPerformanceData[];
  period: string;
}
