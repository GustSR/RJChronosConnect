/**
 * WiFi Service
 * Service layer for WiFi configuration API calls
 */

import apiClient from './api';

import type {
  WiFiConfig,
  WiFiConfigUpdate,
  WiFiProfile,
  WiFiDevice,
  WiFiStats,
  WiFiData,
  WiFiUpdateResponse,
} from '@/types';

// Re-export the types so other files that import from here still work
export type {
  WiFiConfig,
  WiFiConfigUpdate,
  WiFiProfile,
  WiFiDevice,
  WiFiStats,
  WiFiData,
  WiFiUpdateResponse,
};

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