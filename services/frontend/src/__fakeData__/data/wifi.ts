// WiFi Configuration Mock Data
import { WiFiConfig } from '../../api/types';

export const mockWiFiConfigs: Record<string, WiFiConfig[]> = {
  // Mock WiFi configs por device ID
  'pending-demo-1': [
    {
      device_id: 'pending-demo-1',
      band: '2.4GHz',
      ssid: 'RJChronos_DEMO1_2.4G',
      enabled: true,
      security_mode: 'WPA2-PSK',
      password: 'demo123456',
      channel: 6,
      tx_power: 20,
      last_updated: new Date().toISOString(),
    },
    {
      device_id: 'pending-demo-1',
      band: '5GHz', 
      ssid: 'RJChronos_DEMO1_5G',
      enabled: true,
      security_mode: 'WPA2-PSK',
      password: 'demo123456',
      channel: 149,
      tx_power: 23,
      last_updated: new Date().toISOString(),
    },
  ],
  'pending-demo-2': [
    {
      device_id: 'pending-demo-2',
      band: '2.4GHz',
      ssid: 'RJChronos_DEMO2_2.4G',
      enabled: true,
      security_mode: 'WPA2-PSK',
      password: 'demo789012',
      channel: 11,
      tx_power: 18,
      last_updated: new Date().toISOString(),
    },
    {
      device_id: 'pending-demo-2',
      band: '5GHz',
      ssid: 'RJChronos_DEMO2_5G',
      enabled: false,
      security_mode: 'WPA2-PSK',
      password: 'demo789012',
      channel: 36,
      tx_power: 20,
      last_updated: new Date().toISOString(),
    },
  ],
  '1': [
    {
      device_id: '1',
      band: '2.4GHz',
      ssid: 'RJChronos_Cliente1_2.4G',
      enabled: true,
      security_mode: 'WPA2-PSK',
      password: 'cliente123',
      channel: 1,
      tx_power: 20,
      last_updated: new Date().toISOString(),
    },
    {
      device_id: '1',
      band: '5GHz',
      ssid: 'RJChronos_Cliente1_5G',
      enabled: true,
      security_mode: 'WPA2-PSK',
      password: 'cliente123',
      channel: 44,
      tx_power: 23,
      last_updated: new Date().toISOString(),
    },
  ],
};

// Get all WiFi configs (flattened)
export const getAllMockWiFiConfigs = (): WiFiConfig[] => {
  return Object.values(mockWiFiConfigs).flat();
};

// Get WiFi config by device and band
export const getMockWiFiConfigByBand = (deviceId: string, band: '2.4GHz' | '5GHz'): WiFiConfig | null => {
  const deviceConfigs = mockWiFiConfigs[deviceId];
  if (!deviceConfigs) return null;
  
  return deviceConfigs.find(config => config.band === band) || null;
};

// Get all WiFi configs for a device
export const getMockWiFiConfigsForDevice = (deviceId: string): WiFiConfig[] => {
  return mockWiFiConfigs[deviceId] || [];
};