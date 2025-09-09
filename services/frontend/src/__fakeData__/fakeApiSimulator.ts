// Centralized Fake API - Frontend-First Development
import {
  mockDashboardMetrics,
  mockONUs,
  mockCPEs,
  mockOLTs,
  mockOLTStats,
  mockAlerts,
  mockActivityLogs,
  generateMockBandwidthStats,
  mockBandwidthStats24h,
  mockBandwidthStats7d,
  mockBandwidthStats30d,
  mockTrafficSources,
  mockOLTPerformanceStats,
  mockPendingONUs,
  getAllMockWiFiConfigs,
  getMockWiFiConfigByBand,
  getMockWiFiConfigsForDevice,
} from './data';
import {
  ONU,
  CPE,
  OLT,
  Alert,
  DashboardMetrics,
  ActivityLog,
  BandwidthStats,
  TrafficSourcesStats,
  OLTPerformanceStats,
  DeviceQuery,
  AlertQuery,
  WiFiConfig,
  WiFiConfigUpdate,
} from '../services/types';

// Simulate realistic network delays
const simulateNetworkDelay = async <T>(data: T, minDelay = 300, maxDelay = 800): Promise<T> => {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  await new Promise((resolve) => setTimeout(resolve, delay));
  // Return a deep clone to prevent mutations
  return JSON.parse(JSON.stringify(data));
};

// Apply query filters to mock data
const applyDeviceQuery = <T extends { status?: string; model?: string }>(data: T[], query?: DeviceQuery): T[] => {
  if (!query) return data;
  
  let filtered = [...data];
  
  if (query.status) {
    filtered = filtered.filter(item => item.status === query.status);
  }
  
  if (query.model) {
    filtered = filtered.filter(item => item.model?.toLowerCase().includes(query.model!.toLowerCase()));
  }
  
  return filtered;
};

const applyAlertQuery = (data: Alert[], query?: AlertQuery): Alert[] => {
  if (!query) return data;
  
  let filtered = [...data];
  
  if (query.severity) {
    filtered = filtered.filter(item => item.severity === query.severity);
  }
  
  if (query.acknowledged !== undefined) {
    filtered = filtered.filter(item => item.acknowledged === query.acknowledged);
  }
  
  return filtered;
};

// Centralized Fake API with realistic behavior
export const fakeApi = {
  // ===== DASHBOARD =====
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    return simulateNetworkDelay(mockDashboardMetrics);
  },

  // ===== DEVICES =====
  getONUs: async (query?: DeviceQuery): Promise<ONU[]> => {
    const filtered = applyDeviceQuery(mockONUs, query);
    return simulateNetworkDelay(filtered);
  },

  getONUById: async (id: string): Promise<ONU> => {
    const found = mockONUs.find(onu => onu.id === id);
    if (!found) {
      throw new Error(`ONU with id ${id} not found`);
    }
    return simulateNetworkDelay(found);
  },

  getCPEs: async (query?: DeviceQuery): Promise<CPE[]> => {
    const filtered = applyDeviceQuery(mockCPEs, query);
    return simulateNetworkDelay(filtered);
  },

  getOLTs: async (query?: DeviceQuery): Promise<OLT[]> => {
    const filtered = applyDeviceQuery(mockOLTs, query);
    return simulateNetworkDelay(filtered);
  },

  getOLTStats: async (oltId: string): Promise<{ total: number; online: number; offline: number }> => {
    const stats = mockOLTStats[oltId] || { total: 0, online: 0, offline: 0 };
    return simulateNetworkDelay(stats);
  },

  // ===== ALERTS =====
  getAlerts: async (query?: AlertQuery): Promise<Alert[]> => {
    const filtered = applyAlertQuery(mockAlerts, query);
    return simulateNetworkDelay(filtered);
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    // Simulate acknowledgment
    const alert = mockAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
    return simulateNetworkDelay(undefined, 200, 500);
  },

  // ===== ACTIVITIES =====
  getActivityLogs: async (query?: { limit?: number; page?: number }): Promise<ActivityLog[]> => {
    let result = [...mockActivityLogs];
    
    if (query?.limit) {
      const offset = (query.page || 0) * query.limit;
      result = result.slice(offset, offset + query.limit);
    }
    
    return simulateNetworkDelay(result);
  },

  getActivityHistory: async (params?: {
    device_id?: string;
    user_id?: string;
    action?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> => {
    let filtered = [...mockActivityLogs];
    
    if (params?.device_id) {
      filtered = filtered.filter(log => log.device_id === params.device_id);
    }
    
    if (params?.action) {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(params.action!.toLowerCase()));
    }
    
    if (params?.status) {
      filtered = filtered.filter(log => log.status === params.status);
    }
    
    if (params?.limit) {
      const offset = params.offset || 0;
      filtered = filtered.slice(offset, offset + params.limit);
    }
    
    return simulateNetworkDelay(filtered);
  },

  getActivityById: async (activityId: string): Promise<ActivityLog> => {
    const found = mockActivityLogs.find(log => log.id === activityId);
    if (!found) {
      throw new Error(`Activity with id ${activityId} not found`);
    }
    return simulateNetworkDelay(found);
  },

  getActivityByDevice: async (deviceId: string): Promise<ActivityLog[]> => {
    const filtered = mockActivityLogs.filter(log => log.device_id === deviceId);
    return simulateNetworkDelay(filtered);
  },

  createActivity: async (activity: {
    device_id?: string;
    action: string;
    description: string;
    user_id?: string;
    user_name?: string;
    details?: Record<string, unknown>;
  }): Promise<ActivityLog> => {
    const newActivity: ActivityLog = {
      id: `mock-${Date.now()}`,
      ...activity,
      status: 'success',
      created_at: new Date().toISOString(),
      task_name: activity.action.toLowerCase().replace(/\s+/g, '_'),
    };
    
    mockActivityLogs.unshift(newActivity);
    return simulateNetworkDelay(newActivity);
  },

  getActivityStats: async (): Promise<{
    total_activities: number;
    success_rate: number;
    recent_activities: number;
    top_actions: Array<{ action: string; count: number }>;
  }> => {
    const stats = {
      total_activities: mockActivityLogs.length,
      success_rate: (mockActivityLogs.filter(log => log.status === 'success').length / mockActivityLogs.length) * 100,
      recent_activities: mockActivityLogs.filter(log => {
        const logTime = new Date(log.created_at).getTime();
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return logTime > oneDayAgo;
      }).length,
      top_actions: [
        { action: 'provision_ont', count: 15 },
        { action: 'update_wifi_config', count: 12 },
        { action: 'reboot_ont', count: 8 },
        { action: 'view_report', count: 6 },
        { action: 'create_customer', count: 4 },
      ],
    };
    
    return simulateNetworkDelay(stats);
  },

  // ===== BANDWIDTH ANALYTICS =====
  getBandwidthStats: async (period: '24h' | '7d' | '30d' = '24h'): Promise<BandwidthStats> => {
    const stats = {
      '24h': mockBandwidthStats24h,
      '7d': mockBandwidthStats7d,
      '30d': mockBandwidthStats30d,
    }[period] || generateMockBandwidthStats(period);
    
    return simulateNetworkDelay(stats);
  },

  // ===== PERFORMANCE ANALYTICS =====
  getTrafficSources: async (): Promise<TrafficSourcesStats> => {
    return simulateNetworkDelay(mockTrafficSources);
  },

  getOLTPerformanceStats: async (): Promise<OLTPerformanceStats> => {
    return simulateNetworkDelay(mockOLTPerformanceStats);
  },

  // ===== PROVISIONING =====
  getPendingONUs: async (): Promise<Record<string, unknown>[]> => {
    return simulateNetworkDelay(mockPendingONUs);
  },

  authorizeONU: async (
    onuId: string,
    provisionData: {
      client_name: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ): Promise<Record<string, unknown>> => {
    const result = {
      success: true,
      message: `ONU ${onuId} autorizada com sucesso`,
      client_name: provisionData.client_name,
      onu_id: onuId,
      authorized_at: new Date().toISOString(),
    };
    
    // Remove from pending list
    const pendingIndex = mockPendingONUs.findIndex(onu => onu.id === onuId);
    if (pendingIndex !== -1) {
      mockPendingONUs.splice(pendingIndex, 1);
    }
    
    return simulateNetworkDelay(result, 1000, 2000); // Longer delay for provision operations
  },

  rejectONU: async (onuId: string, reason?: string): Promise<Record<string, unknown>> => {
    const result = {
      success: true,
      message: `ONU ${onuId} rejeitada`,
      reason: reason || 'Não autorizada pelo administrador',
      rejected_at: new Date().toISOString(),
    };
    
    // Remove from pending list
    const pendingIndex = mockPendingONUs.findIndex(onu => onu.id === onuId);
    if (pendingIndex !== -1) {
      mockPendingONUs.splice(pendingIndex, 1);
    }
    
    return simulateNetworkDelay(result, 500, 1000);
  },

  getClientConfiguration: async (onuId: string): Promise<Record<string, unknown>> => {
    const config = {
      onu_id: onuId,
      client_name: 'Cliente Mock',
      client_address: 'Endereço Mock, 123',
      service_profile: 'internet_100mb',
      vlan_id: 100,
      wan_mode: 'pppoe',
      comment: 'Configuração de teste',
      last_updated: new Date().toISOString(),
    };
    
    return simulateNetworkDelay(config);
  },

  updateClientConfiguration: async (
    onuId: string,
    updates: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    const result = {
      success: true,
      message: `Configuração do cliente ${onuId} atualizada`,
      updates,
      updated_at: new Date().toISOString(),
    };
    
    return simulateNetworkDelay(result, 800, 1500);
  },

  // ===== WIFI CONFIGURATION =====
  getWiFiConfigs: async (): Promise<WiFiConfig[]> => {
    return simulateNetworkDelay(getAllMockWiFiConfigs());
  },

  getWiFiConfigByBand: async (deviceId: string, band: '2.4GHz' | '5GHz'): Promise<WiFiConfig> => {
    const config = getMockWiFiConfigByBand(deviceId, band);
    if (!config) {
      throw new Error(`WiFi config not found for device ${deviceId} band ${band}`);
    }
    return simulateNetworkDelay(config);
  },

  getWiFiConfig: async (deviceId: string): Promise<WiFiConfig> => {
    // Default to 2.4GHz for compatibility
    return fakeApi.getWiFiConfigByBand(deviceId, '2.4GHz');
  },

  updateWiFiConfigByBand: async (
    deviceId: string,
    band: '2.4GHz' | '5GHz',
    config: WiFiConfigUpdate
  ): Promise<WiFiConfig> => {
    // Simulate updating the config
    const currentConfig = getMockWiFiConfigByBand(deviceId, band);
    if (!currentConfig) {
      throw new Error(`WiFi config not found for device ${deviceId} band ${band}`);
    }

    const updatedConfig: WiFiConfig = {
      ...currentConfig,
      ...config,
      band, // Ensure band is preserved
      last_updated: new Date().toISOString(),
    };

    // Simulate longer delay for config operations
    return simulateNetworkDelay(updatedConfig, 1000, 2000);
  },

  updateWiFiConfig: async (deviceId: string, config: WiFiConfigUpdate): Promise<WiFiConfig> => {
    // Default to 2.4GHz for compatibility
    const band = (config.band as '2.4GHz' | '5GHz') || '2.4GHz';
    return fakeApi.updateWiFiConfigByBand(deviceId, band, config);
  },

  refreshWiFi: async (deviceId: string): Promise<void> => {
    console.log(`[MOCK] Refreshing WiFi for device: ${deviceId}`);
    return simulateNetworkDelay(undefined, 800, 1500);
  },

  refreshIP: async (deviceId: string): Promise<void> => {
    console.log(`[MOCK] Refreshing IP for device: ${deviceId}`);
    return simulateNetworkDelay(undefined, 500, 1000);
  },

  // ===== HEALTH CHECK =====
  checkHealth: async (): Promise<{ status: string; message: string }> => {
    return simulateNetworkDelay({
      status: 'ok',
      message: 'Fake API is running - Mock data mode active',
    });
  },
};