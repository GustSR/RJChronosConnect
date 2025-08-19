/**
 * WiFi React Query Hooks
 * Custom hooks for WiFi configuration data management using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWiFiConfigs,
  getDeviceWiFiConfig,
  updateDeviceWiFiConfig,
  refreshDeviceWiFiConfig,
  WiFiConfigUpdate,
  WiFiData,
  WiFiConfig,
  WiFiUpdateResponse
} from '@/services/wifiService';

const WIFI_QUERY_KEYS = {
  all: ['wifi'] as const,
  configs: () => [...WIFI_QUERY_KEYS.all, 'configs'] as const,
  deviceConfig: (deviceId: string) => [...WIFI_QUERY_KEYS.all, 'device', deviceId] as const,
};

/**
 * Hook to get all WiFi configurations
 */
export const useWiFiConfigs = () => {
  return useQuery<WiFiData>({
    queryKey: WIFI_QUERY_KEYS.configs(),
    queryFn: getWiFiConfigs,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get WiFi configuration for a specific device
 */
export const useDeviceWiFiConfig = (deviceId: string) => {
  return useQuery<WiFiConfig>({
    queryKey: WIFI_QUERY_KEYS.deviceConfig(deviceId),
    queryFn: () => getDeviceWiFiConfig(deviceId),
    enabled: !!deviceId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to update device WiFi configuration
 */
export const useUpdateDeviceWiFiConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<WiFiUpdateResponse, Error, { deviceId: string; updates: WiFiConfigUpdate }>({
    mutationFn: ({ deviceId, updates }) => updateDeviceWiFiConfig(deviceId, updates),
    onSuccess: (data, { deviceId }) => {
      // Invalidate and refetch WiFi configs
      queryClient.invalidateQueries({ queryKey: WIFI_QUERY_KEYS.configs() });
      queryClient.invalidateQueries({ queryKey: WIFI_QUERY_KEYS.deviceConfig(deviceId) });
      
      // Also invalidate device lists that might show WiFi info
      queryClient.invalidateQueries({ queryKey: ['devices', 'cpes'] });
    },
  });
};

/**
 * Hook to refresh device WiFi configuration
 */
export const useRefreshDeviceWiFiConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (deviceId: string) => refreshDeviceWiFiConfig(deviceId),
    onSuccess: (data, deviceId) => {
      // Invalidate and refetch WiFi configs after refresh
      queryClient.invalidateQueries({ queryKey: WIFI_QUERY_KEYS.configs() });
      queryClient.invalidateQueries({ queryKey: WIFI_QUERY_KEYS.deviceConfig(deviceId) });
      
      // Also invalidate device lists
      queryClient.invalidateQueries({ queryKey: ['devices', 'cpes'] });
    },
  });
};