/**
 * WiFi Service
 * Service layer for WiFi configuration API calls
 */

import apiClient from './api';

export interface WiFiConfig {
  device_id: string;
  device_name: string;
  device_model: string;
  ssid: string;
  password?: string;
  security: string;
  band?: string;
  channel?: string;
  power?: number;
  hidden: boolean;
  enabled: boolean;
  beacon_type?: string;
  auto_channel?: boolean;
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
}

export interface WiFiProfile {
  id: string;
  name: string;
  ssid: string;
  security: string;
  band: string;
  channel: string;
  power: number;
  hidden: boolean;
  enabled: boolean;
  status: string;
  applied_devices: number;
  devices: WiFiConfig[];
}

export interface WiFiDevice {
  id: string;
  name: string;
  model: string;
  ssid: string;
  security: string;
  signal_strength: number;
  status: string;
  connected_devices: number;
  last_update: string;
  wifi_config: WiFiConfig;
}

export interface WiFiStats {
  total_profiles: number;
  active_profiles: number;
  total_devices: number;
  online_devices: number;
  avg_signal: number;
  total_connections: number;
}

export interface WiFiData {
  profiles: WiFiProfile[];
  devices: WiFiDevice[];
  stats: WiFiStats;
}

export interface WiFiUpdateResponse {
  success: boolean;
  message: string;
  applied_updates: Record<string, any>;
  tasks_executed: number;
  total_tasks: number;
}

/**
 * Get all WiFi configurations from all devices
 */
export const getWiFiConfigs = async (): Promise<WiFiData> => {
  const response = await apiClient.get('/wifi/configs');
  return response.data;
};

/**
 * Get WiFi configuration for a specific device
 */
export const getDeviceWiFiConfig = async (deviceId: string, band: string = "2.4GHz"): Promise<WiFiConfig> => {
  const response = await apiClient.get(`/wifi/configs/${deviceId}?band=${band}`);
  return response.data;
};

/**
 * Update WiFi configuration for a specific device
 */
export const updateDeviceWiFiConfig = async (
  deviceId: string,
  updates: WiFiConfigUpdate,
  band: string = "2.4GHz"
): Promise<WiFiUpdateResponse> => {
  const response = await apiClient.put(`/wifi/configs/${deviceId}?band=${band}`, updates);
  return response.data;
};

/**
 * Refresh WiFi configuration for a specific device (force sync with device)
 */
export const refreshDeviceWiFiConfig = async (deviceId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/wifi/refresh/${deviceId}`);
  return response.data;
};