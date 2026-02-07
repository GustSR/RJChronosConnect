import { fakeDataService } from '@/__fakeData__';
import { devConfig, httpClient } from './api';
import {
  ActivityLog,
  Alert,
  AlertQuery,
  BandwidthStats,
  ConnectionRequest,
  CPE,
  DashboardMetrics,
  DeviceParameter,
  DeviceQuery,
  GenieACSTask,
  OLT,
  OLTPerformanceStats,
  ONU,
  Subscriber,
  SubscriberCreate,
  SubscriberUpdate,
  TrafficSourcesStats,
  WiFiConfig,
  WiFiConfigUpdate,
} from './types';

// Serviço específico para integração com GenieACS via backend FastAPI
export class GenieACSApiService {
  // ===== DISPOSITIVOS =====

  /**
   * Buscar ONUs pendentes de autorização/provisionamento
   */
  async getPendingONUs(): Promise<Record<string, unknown>[]> {
    return httpClient.get<Record<string, unknown>[]>('/provisioning/pending');
  }

  /**
   * Autorizar uma ONU pendente (Versão Assíncrona - EDA)
   */
  async authorizeONUAsync(
    onuId: string,
    provisionData: {
      client_name: string;
      client_cpf_cnpj?: string;
      client_address: string;
      serial_number?: string;
      onu_type?: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
      olt_id?: number;
      olt_port?: string;
      frame?: number;
      slot?: number;
      board?: number;
      port?: number;
      ont_id?: number;
      line_profile?: string;
      srv_profile?: string;
    }
  ): Promise<Record<string, unknown>> {
    return httpClient.post(
      `/provisioning/${onuId}/authorize-async`,
      provisionData
    ) as Promise<Record<string, unknown>>;
  }

  /**
   * Autorizar uma ONU pendente (Síncrono - Legacy)
   */
  async authorizeONU(
    onuId: string,
    provisionData: {
      client_name: string;
      client_cpf_cnpj?: string;
      client_address: string;
      serial_number?: string;
      onu_type?: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
      olt_id?: number;
      olt_port?: string;
      frame?: number;
      slot?: number;
      board?: number;
      port?: number;
      ont_id?: number;
      line_profile?: string;
      srv_profile?: string;
    }
  ): Promise<Record<string, unknown>> {
    return httpClient.post(
      `/provisioning/${onuId}/authorize`,
      provisionData
    ) as Promise<Record<string, unknown>>;
  }

  /**
   * Rejeitar uma ONU pendente
   */
  async rejectONU(
    onuId: string,
    reason?: string
  ): Promise<Record<string, unknown>> {
    const endpoint = reason
      ? `/provisioning/${onuId}/reject?reason=${encodeURIComponent(reason)}`
      : `/provisioning/${onuId}/reject`;
    return httpClient.delete(endpoint) as Promise<Record<string, unknown>>;
  }

  /**
   * Buscar configuração específica de um cliente provisionado
   */
  async getClientConfiguration(
    onuId: string
  ): Promise<Record<string, unknown>> {
    if (devConfig.useMockData) {
      return fakeDataService.getClientConfiguration(onuId);
    }
    return httpClient.get(`/clients/${onuId}`) as Promise<
      Record<string, unknown>
    >;
  }

  /**
   * Atualizar configuração de um cliente provisionado
   */
  async updateClientConfiguration(
    onuId: string,
    updates: {
      client_name?: string;
      client_address?: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ): Promise<Record<string, unknown>> {
    if (devConfig.useMockData) {
      return fakeDataService.updateClientConfiguration(onuId, updates);
    }
    return httpClient.put(`/clients/${onuId}`, updates) as Promise<
      Record<string, unknown>
    >;
  }

  /**
   * Buscar todos os CPEs
   */
  async getCPEs(query?: DeviceQuery): Promise<CPE[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getCPEs(query);
    }
    return httpClient.get<CPE[]>(
      '/devices/cpes',
      query as Record<string, unknown>
    );
  }

  /**
   * Buscar todas as ONUs provisionadas (clientes) preservando dados salvos
   */
  async getONUs(query?: DeviceQuery): Promise<ONU[]> {
    return httpClient.get<ONU[]>(
      '/provisioning/clients',
      query as Record<string, unknown>
    );
  }

  /**
   * Buscar uma ONU específica por ID
   */
  async getONUById(id: string): Promise<ONU> {
    if (devConfig.useMockData) {
      return fakeDataService.getONUById(id);
    }
    return httpClient.get<ONU>(`/devices/onus/${id}`);
  }

  /**
   * Buscar todas as OLTs
   */
  async getOLTs(query?: DeviceQuery): Promise<OLT[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getOLTs(query);
    }
    return httpClient.get<OLT[]>(
      '/devices/olts',
      query as Record<string, unknown>
    );
  }

  /**
   * Obter estatísticas de ONUs por OLT
   */
  async getOLTStats(
    oltId: string
  ): Promise<{ total: number; online: number; offline: number }> {
    if (devConfig.useMockData) {
      return fakeDataService.getOLTStats(oltId);
    }
    return httpClient.get<{
      total: number;
      online: number;
      offline: number;
    }>(`/devices/olts/${oltId}/stats`);
  }

  // ===== ALERTAS =====

  /**
   * Buscar alertas
   */
  async getAlerts(query?: AlertQuery): Promise<Alert[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getAlerts(query);
    }
    return httpClient.get<Alert[]>('/alerts', query as Record<string, unknown>);
  }

  /**
   * Marcar alerta como reconhecido
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    if (devConfig.useMockData) {
      return fakeDataService.acknowledgeAlert(alertId);
    }
    return httpClient.put(`/alerts/${alertId}/acknowledge`);
  }

  // ===== ACTIVITY LOGS =====

  /**
   * Buscar logs de atividade
   */
  async getActivityLogs(query?: {
    limit?: number;
    page?: number;
  }): Promise<ActivityLog[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getActivityLogs(query);
    }
    return httpClient.get<ActivityLog[]>(
      '/activity/logs',
      query as Record<string, unknown>
    );
  }

  // ===== BANDWIDTH ANALYTICS =====

  /**
   * Buscar dados históricos de bandwidth
   */
  async getBandwidthStats(
    period: '24h' | '7d' | '30d' = '24h'
  ): Promise<BandwidthStats> {
    if (devConfig.useMockData) {
      return fakeDataService.getBandwidthStats(period);
    }
    return httpClient.get<BandwidthStats>(`/analytics/bandwidth`, {
      period,
    } as Record<string, unknown>);
  }

  // ===== DASHBOARD =====

  /**
   * Buscar métricas do dashboard
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (devConfig.useMockData) {
      return fakeDataService.getDashboardMetrics();
    }
    return httpClient.get<DashboardMetrics>('/dashboard/metrics');
  }

  // ===== WIFI CONFIGURATION (TR-069) =====

  /**
   * Buscar todas as configurações WiFi
   */
  async getWiFiConfigs(): Promise<WiFiConfig[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getWiFiConfigs();
    }
    return httpClient.get<WiFiConfig[]>('/wifi/configs');
  }

  /**
   * Buscar configuração WiFi de um dispositivo específico por banda
   */
  async getWiFiConfigByBand(
    deviceId: string,
    band: '2.4GHz' | '5GHz'
  ): Promise<WiFiConfig> {
    if (devConfig.useMockData) {
      return fakeDataService.getWiFiConfigByBand(deviceId, band);
    }
    return httpClient.get<WiFiConfig>(
      `/wifi/configs/${deviceId}?band=${encodeURIComponent(band)}`
    );
  }

  /**
   * Buscar configuração WiFi de um dispositivo específico (compatibilidade)
   */
  async getWiFiConfig(deviceId: string): Promise<WiFiConfig> {
    if (devConfig.useMockData) {
      return fakeDataService.getWiFiConfig(deviceId);
    }
    // Por padrão retorna a configuração 2.4GHz para compatibilidade
    return this.getWiFiConfigByBand(deviceId, '2.4GHz');
  }

  /**
   * Atualizar configuração WiFi de um dispositivo por banda (via TR-069)
   */
  async updateWiFiConfigByBand(
    deviceId: string,
    band: '2.4GHz' | '5GHz',
    config: WiFiConfigUpdate
  ): Promise<WiFiConfig> {
    if (devConfig.useMockData) {
      console.log(
        `[MOCK] Atualizando WiFi ${band} do dispositivo ${deviceId}:`,
        config
      );
      return fakeDataService.updateWiFiConfigByBand(deviceId, band, config);
    }

    const url = `/wifi/configs/${deviceId}?band=${encodeURIComponent(band)}`;
    console.log(`CHAMANDO ENDPOINT WiFi: PUT ${url}`);
    console.log(`📤 DADOS ENVIADOS:`, config);

    const data = await httpClient.put<WiFiConfig>(url, config);
    console.log(`📥 DADOS RECEBIDOS:`, data);
    return data;
  }

  /**
   * Atualizar configuração WiFi de um dispositivo (via TR-069) - compatibilidade
   */
  async updateWiFiConfig(
    deviceId: string,
    config: WiFiConfigUpdate
  ): Promise<WiFiConfig> {
    if (devConfig.useMockData) {
      return fakeDataService.updateWiFiConfig(deviceId, config);
    }
    // Por padrão atualiza a configuração 2.4GHz para compatibilidade
    const band = (config.band as '2.4GHz' | '5GHz') || '2.4GHz';
    return this.updateWiFiConfigByBand(deviceId, band, config);
  }

  /**
   * Forçar refresh das configurações WiFi via TR-069
   */
  async refreshWiFi(deviceId: string): Promise<void> {
    if (devConfig.useMockData) {
      console.log('[MOCK] Fazendo refresh WiFi para dispositivo:', deviceId);
      return fakeDataService.refreshWiFi(deviceId);
    }
    console.log('Fazendo refresh WiFi para dispositivo:', deviceId);
    await httpClient.post(`/device/refresh-wifi?device_id=${deviceId}`);
    console.log('Refresh WiFi realizado com sucesso');
  }

  /**
   * Forçar refresh do IP de um dispositivo via TR-069
   */
  async refreshIP(deviceId: string): Promise<void> {
    if (devConfig.useMockData) {
      console.log('[MOCK] Fazendo refresh IP para dispositivo:', deviceId);
      return fakeDataService.refreshIP(deviceId);
    }
    return httpClient.post(`/wifi/refresh-ip/${deviceId}`);
  }

  // ===== TR-069 SPECIFIC OPERATIONS =====

  /**
   * Executar connection request para um dispositivo
   */
  async executeConnectionRequest(deviceId: string): Promise<ConnectionRequest> {
    if (devConfig.useMockData) {
      console.log(`[MOCK] Executando connection request para ${deviceId}`);
      const mockResult: ConnectionRequest = {
        device_id: deviceId,
        status: 'success',
        message: 'Connection request executado com sucesso',
        timestamp: new Date().toISOString(),
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockResult), 1000)
      );
    }
    return httpClient.post<ConnectionRequest>(
      `/tr069/connection-request/${deviceId}`
    );
  }

  /**
   * Obter parâmetros específicos de um dispositivo via TR-069
   */
  async getDeviceParameters(
    deviceId: string,
    parameters: string[]
  ): Promise<DeviceParameter[]> {
    if (devConfig.useMockData) {
      console.log(
        `[MOCK] Obtendo parâmetros do dispositivo ${deviceId}:`,
        parameters
      );
      const mockParams: DeviceParameter[] = parameters.map((param, index) => ({
        name: param,
        value: `mock-value-${index}`,
        type: 'string',
        last_updated: new Date().toISOString(),
      }));
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockParams), 800)
      );
    }
    return httpClient.post<DeviceParameter[]>(
      `/tr069/get-parameters/${deviceId}`,
      { parameters }
    );
  }

  /**
   * Definir parâmetros específicos de um dispositivo via TR-069
   */
  async setDeviceParameters(
    deviceId: string,
    parameters: Record<string, unknown>
  ): Promise<GenieACSTask> {
    if (devConfig.useMockData) {
      console.log(
        `[MOCK] Definindo parâmetros do dispositivo ${deviceId}:`,
        parameters
      );
      const mockTask: GenieACSTask = {
        id: `mock-task-${Date.now()}`,
        device_id: deviceId,
        task_type: 'setParameterValues',
        status: 'pending',
        created_at: new Date().toISOString(),
        parameters,
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockTask), 1200)
      );
    }
    return httpClient.post<GenieACSTask>(`/tr069/set-parameters/${deviceId}`, {
      parameters,
    });
  }

  /**
   * Executar factory reset em um dispositivo via TR-069
   */
  async factoryReset(deviceId: string): Promise<GenieACSTask> {
    if (devConfig.useMockData) {
      console.log(`[MOCK] Executando factory reset no dispositivo ${deviceId}`);
      const mockTask: GenieACSTask = {
        id: `mock-factory-reset-${Date.now()}`,
        device_id: deviceId,
        task_type: 'factoryReset',
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockTask), 2000)
      );
    }
    return httpClient.post<GenieACSTask>(`/tr069/factory-reset/${deviceId}`);
  }

  /**
   * Reiniciar um dispositivo via TR-069
   */
  async rebootDevice(deviceId: string): Promise<GenieACSTask> {
    if (devConfig.useMockData) {
      console.log(`[MOCK] Reiniciando dispositivo ${deviceId}`);
      const mockTask: GenieACSTask = {
        id: `mock-reboot-${Date.now()}`,
        device_id: deviceId,
        task_type: 'reboot',
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockTask), 1500)
      );
    }
    return httpClient.post<GenieACSTask>(`/tr069/reboot/${deviceId}`);
  }

  // ===== HISTÓRICO DE ATIVIDADES =====

  /**
   * Buscar histórico de atividades
   */
  async getActivityHistory(params?: {
    device_id?: string;
    user_id?: string;
    action?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getActivityHistory(params);
    }
    return httpClient.get<ActivityLog[]>(
      '/activity-history',
      params as Record<string, unknown>
    );
  }

  /**
   * Buscar atividade específica por ID
   */
  async getActivityById(activityId: string): Promise<ActivityLog> {
    if (devConfig.useMockData) {
      return fakeDataService.getActivityById(activityId);
    }
    return httpClient.get<ActivityLog>(`/activity-history/${activityId}`);
  }

  /**
   * Buscar atividades de um dispositivo específico
   */
  async getActivityByDevice(deviceId: string): Promise<ActivityLog[]> {
    if (devConfig.useMockData) {
      return fakeDataService.getActivityByDevice(deviceId);
    }
    return httpClient.get<ActivityLog[]>(
      `/activity-history/device/${deviceId}`
    );
  }

  /**
   * Criar nova entrada no histórico de atividades
   */
  async createActivity(activity: {
    device_id?: string;
    action: string;
    description: string;
    user_id?: string;
    user_name?: string;
    details?: Record<string, unknown>;
  }): Promise<ActivityLog> {
    if (devConfig.useMockData) {
      return fakeDataService.createActivity(activity);
    }
    return httpClient.post<ActivityLog>('/activity-history', activity);
  }

  /**
   * Buscar estatísticas do histórico de atividades
   */
  async getActivityStats(): Promise<{
    total_activities: number;
    success_rate: number;
    recent_activities: number;
    top_actions: Array<{ action: string; count: number }>;
  }> {
    if (devConfig.useMockData) {
      return fakeDataService.getActivityStats();
    }
    return httpClient.get<{
      total_activities: number;
      success_rate: number;
      recent_activities: number;
      top_actions: Array<{ action: string; count: number }>;
    }>('/activity-history/stats');
  }

  // ===== UTILITÁRIOS =====

  /**
   * Verificar status de conexão com o backend
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    if (devConfig.useMockData) {
      return fakeDataService.checkHealth();
    }
    return httpClient.get<{ status: string; message: string }>('/');
  }

  /**
   * Verificar se um dispositivo está online (método de conveniência)
   */
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      const device = await this.getONUById(deviceId);
      return device.status === 'online';
    } catch (error) {
      console.warn(
        `Não foi possível verificar status do dispositivo ${deviceId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Verificar conectividade com GenieACS
   */
  async checkGenieACSHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${devConfig.genieacsUrl}/ping`);
      return response.ok;
    } catch (error) {
      console.warn('GenieACS não está acessível:', error);
      return false;
    }
  }

  // ===== MOCK DATA METHODS - REMOVED =====
  // All mock data has been moved to centralized __fakeApi__ structure
  // See __fakeApi__/data/ for organized mock data files

  /**
   * Obter fontes de tráfego principais - Top Traffic Sources
   */
  async getTrafficSources(): Promise<TrafficSourcesStats> {
    if (devConfig.useMockData) {
      return fakeDataService.getTrafficSources();
    }
    // TODO: Implementar endpoint real no backend
    return fakeDataService.getTrafficSources();
  }

  /**
   * Obter dados de performance dos OLTs
   */
  async getOLTPerformanceStats(): Promise<OLTPerformanceStats> {
    if (devConfig.useMockData) {
      return fakeDataService.getOLTPerformanceStats();
    }
    // TODO: Implementar endpoint real no backend
    return fakeDataService.getOLTPerformanceStats();
  }

  // ===== SUBSCRIBERS (CLIENTES) =====

  /**
   * Listar todos os subscribers (clientes)
   */
  async getSubscribers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<Subscriber[]> {
    return httpClient.get<Subscriber[]>(
      '/subscribers',
      params as Record<string, unknown>
    );
  }

  /**
   * Buscar subscriber por ID
   */
  async getSubscriberById(subscriberId: number): Promise<Subscriber> {
    return httpClient.get<Subscriber>(`/subscribers/${subscriberId}`);
  }

  /**
   * Criar novo subscriber (cliente)
   */
  async createSubscriber(data: SubscriberCreate): Promise<Subscriber> {
    return httpClient.post<Subscriber>('/subscribers', data);
  }

  /**
   * Atualizar subscriber existente
   */
  async updateSubscriber(
    subscriberId: number,
    data: SubscriberUpdate
  ): Promise<Subscriber> {
    return httpClient.put<Subscriber>(`/subscribers/${subscriberId}`, data);
  }

  /**
   * Deletar subscriber
   */
  async deleteSubscriber(subscriberId: number): Promise<void> {
    return httpClient.delete(`/subscribers/${subscriberId}`);
  }

  /**
   * Contar total de subscribers
   */
  async getSubscribersCount(search?: string): Promise<{ count: number }> {
    return httpClient.get<{ count: number }>(
      '/subscribers/count',
      search ? { search } : undefined
    );
  }
}

// Instância global do serviço GenieACS
export const genieacsApi = new GenieACSApiService();
