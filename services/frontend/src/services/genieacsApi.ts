import { httpClient, devConfig } from './api';
import {
  ONU,
  OLT,
  CPE,
  Alert,
  DashboardMetrics,
  WiFiConfig,
  WiFiConfigUpdate,
  ActivityLog,
  BandwidthStats,
  TrafficSourcesStats,
  OLTPerformanceStats,
  DeviceQuery,
  AlertQuery,
  GenieACSTask,
  ConnectionRequest,
  DeviceParameter,
} from './types';

// Mock data para desenvolvimento quando backend não está disponível
const mockDashboardMetrics: DashboardMetrics = {
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

// Serviço específico para integração com GenieACS via backend FastAPI
export class GenieACSApiService {
  // ===== DISPOSITIVOS =====

  /**
   * Buscar ONUs pendentes de autorização/provisionamento
   */
  async getPendingONUs(): Promise<Record<string, unknown>[]> {
    try {
      const data = await httpClient.get<Record<string, unknown>[]>(
        '/api/provisioning/pending'
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar ONUs pendentes:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para ONUs pendentes');
        return this.getMockPendingONUs();
      }

      throw error;
    }
  }

  /**
   * Autorizar uma ONU pendente
   */
  async authorizeONU(
    onuId: string,
    provisionData: {
      client_name: string;
      client_address: string;
      service_profile?: string;
      vlan_id?: number;
      wan_mode?: string;
      comment?: string;
    }
  ): Promise<Record<string, unknown>> {
    try {
      const data = await httpClient.post(
        `/api/provisioning/${onuId}/authorize`,
        provisionData
      );
      return data as Record<string, unknown>;
    } catch (error) {
      console.error(`Erro ao autorizar ONU ${onuId}:`, error);
      throw error;
    }
  }

  /**
   * Rejeitar uma ONU pendente
   */
  async rejectONU(
    onuId: string,
    reason?: string
  ): Promise<Record<string, unknown>> {
    try {
      const endpoint = reason
        ? `/api/provisioning/${onuId}/reject?reason=${encodeURIComponent(
            reason
          )}`
        : `/api/provisioning/${onuId}/reject`;
      const data = await httpClient.delete(endpoint);
      return data as Record<string, unknown>;
    } catch (error) {
      console.error(`Erro ao rejeitar ONU ${onuId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar configuração específica de um cliente provisionado
   */
  async getClientConfiguration(
    onuId: string
  ): Promise<Record<string, unknown>> {
    try {
      const data = await httpClient.get(`/api/clients/${onuId}`);
      return data as Record<string, unknown>;
    } catch (error) {
      console.error(`Erro ao buscar configuração do cliente ${onuId}:`, error);
      throw error;
    }
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
    try {
      const data = await httpClient.put(`/api/clients/${onuId}`, updates);
      return data as Record<string, unknown>;
    } catch (error) {
      console.error(
        `Erro ao atualizar configuração do cliente ${onuId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Buscar todos os CPEs com fallback para mock
   */
  async getCPEs(query?: DeviceQuery): Promise<CPE[]> {
    try {
      const data = await httpClient.get<CPE[]>(
        '/api/devices/cpes',
        query as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar CPEs:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para CPEs');
        return this.getMockCPEs();
      }

      throw error;
    }
  }

  /**
   * Buscar todas as ONUs provisionadas (clientes) preservando dados salvos
   */
  async getONUs(query?: DeviceQuery): Promise<ONU[]> {
    try {
      // Usar endpoint que preserva dados salvos dos clientes
      const data = await httpClient.get<ONU[]>(
        '/api/provisioning/clients',
        query as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar ONUs provisionadas:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para ONUs');
        return this.getMockONUs();
      }

      throw error;
    }
  }

  /**
   * Buscar uma ONU específica por ID
   */
  async getONUById(id: string): Promise<ONU> {
    try {
      const data = await httpClient.get<ONU>(`/api/devices/onus/${id}`);
      return data;
    } catch (error) {
      console.error(`Erro ao buscar ONU ${id}:`, error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        const mockOnus = this.getMockONUs();
        const found = mockOnus.find((onu) => onu.id === id);
        if (found) return found;
      }

      throw error;
    }
  }

  /**
   * Buscar todas as OLTs com fallback para mock
   */
  async getOLTs(query?: DeviceQuery): Promise<OLT[]> {
    try {
      const data = await httpClient.get<OLT[]>(
        '/api/devices/olts',
        query as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar OLTs:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para OLTs');
        return this.getMockOLTs();
      }

      throw error;
    }
  }

  /**
   * Obter estatísticas de ONUs por OLT
   */
  async getOLTStats(
    oltId: string
  ): Promise<{ total: number; online: number; offline: number }> {
    try {
      const data = await httpClient.get<{
        total: number;
        online: number;
        offline: number;
      }>(`/api/devices/olts/${oltId}/stats`);
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas da OLT:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        return this.getMockOLTStats(oltId);
      }

      throw error;
    }
  }

  // ===== ALERTAS =====

  /**
   * Buscar alertas com fallback para mock
   */
  async getAlerts(query?: AlertQuery): Promise<Alert[]> {
    try {
      const data = await httpClient.get<Alert[]>(
        '/api/alerts',
        query as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para alertas');
        return this.getMockAlerts();
      }

      throw error;
    }
  }

  /**
   * Marcar alerta como reconhecido
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await httpClient.put(`/api/alerts/${alertId}/acknowledge`);
    } catch (error) {
      console.error(`Erro ao reconhecer alerta ${alertId}:`, error);
      throw error;
    }
  }

  // ===== ACTIVITY LOGS =====

  /**
   * Buscar logs de atividade com fallback para mock
   */
  async getActivityLogs(query?: {
    limit?: number;
    page?: number;
  }): Promise<ActivityLog[]> {
    try {
      const data = await httpClient.get<ActivityLog[]>(
        '/api/activity/logs',
        query as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar logs de atividade:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para activity logs');
        return this.getMockActivityLogs();
      }

      throw error;
    }
  }

  // ===== BANDWIDTH ANALYTICS =====

  /**
   * Buscar dados históricos de bandwidth
   */
  async getBandwidthStats(
    period: '24h' | '7d' | '30d' = '24h'
  ): Promise<BandwidthStats> {
    try {
      const data = await httpClient.get<BandwidthStats>(
        `/api/analytics/bandwidth`,
        { period } as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados de bandwidth:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para bandwidth stats');
        return this.getMockBandwidthStats(period);
      }

      throw error;
    }
  }

  // ===== DASHBOARD =====

  /**
   * Buscar métricas do dashboard com fallback para mock
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const data = await httpClient.get<DashboardMetrics>(
        '/api/dashboard/metrics'
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);

      // Fallback para dados mock em desenvolvimento
      if (devConfig.useMockData) {
        console.warn('Usando dados mock para dashboard metrics');
        return mockDashboardMetrics;
      }

      throw error;
    }
  }

  // ===== WIFI CONFIGURATION (TR-069) =====

  /**
   * Buscar todas as configurações WiFi
   */
  async getWiFiConfigs(): Promise<WiFiConfig[]> {
    try {
      const data = await httpClient.get<WiFiConfig[]>('/api/wifi/configs');
      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações WiFi:', error);
      throw error;
    }
  }

  /**
   * Buscar configuração WiFi de um dispositivo específico por banda
   */
  async getWiFiConfigByBand(
    deviceId: string,
    band: '2.4GHz' | '5GHz'
  ): Promise<WiFiConfig> {
    try {
      const data = await httpClient.get<WiFiConfig>(
        `/api/wifi/configs/${deviceId}?band=${encodeURIComponent(band)}`
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao buscar configuração WiFi ${band} do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Buscar configuração WiFi de um dispositivo específico (compatibilidade)
   */
  async getWiFiConfig(deviceId: string): Promise<WiFiConfig> {
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
    try {
      const url = `/api/wifi/configs/${deviceId}?band=${encodeURIComponent(
        band
      )}`;
      console.log(`CHAMANDO ENDPOINT WiFi: PUT ${url}`);
      console.log(`📤 DADOS ENVIADOS:`, config);

      const data = await httpClient.put<WiFiConfig>(url, config);

      console.log(`📥 DADOS RECEBIDOS:`, data);
      return data;
    } catch (error) {
      console.error(`ERRO no endpoint WiFi ${band} (${deviceId}):`, error);
      throw error;
    }
  }

  /**
   * Atualizar configuração WiFi de um dispositivo (via TR-069) - compatibilidade
   */
  async updateWiFiConfig(
    deviceId: string,
    config: WiFiConfigUpdate
  ): Promise<WiFiConfig> {
    // Por padrão atualiza a configuração 2.4GHz para compatibilidade
    const band = (config.band as '2.4GHz' | '5GHz') || '2.4GHz';
    return this.updateWiFiConfigByBand(deviceId, band, config);
  }

  /**
   * Forçar refresh das configurações WiFi via TR-069
   */
  async refreshWiFi(deviceId: string): Promise<void> {
    try {
      console.log('Fazendo refresh WiFi para dispositivo:', deviceId);
      await httpClient.post(`/api/device/refresh-wifi?device_id=${deviceId}`);
      console.log('Refresh WiFi realizado com sucesso');
    } catch (error) {
      console.error(
        `Erro ao fazer refresh WiFi do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Forçar refresh do IP de um dispositivo via TR-069
   */
  async refreshIP(deviceId: string): Promise<void> {
    try {
      await httpClient.post(`/api/wifi/refresh-ip/${deviceId}`);
    } catch (error) {
      console.error(
        `Erro ao fazer refresh IP do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  // ===== TR-069 SPECIFIC OPERATIONS =====

  /**
   * Executar connection request para um dispositivo
   */
  async executeConnectionRequest(deviceId: string): Promise<ConnectionRequest> {
    try {
      const data = await httpClient.post<ConnectionRequest>(
        `/api/tr069/connection-request/${deviceId}`
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao executar connection request para ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obter parâmetros específicos de um dispositivo via TR-069
   */
  async getDeviceParameters(
    deviceId: string,
    parameters: string[]
  ): Promise<DeviceParameter[]> {
    try {
      const data = await httpClient.post<DeviceParameter[]>(
        `/api/tr069/get-parameters/${deviceId}`,
        { parameters }
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao obter parâmetros do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Definir parâmetros específicos de um dispositivo via TR-069
   */
  async setDeviceParameters(
    deviceId: string,
    parameters: Record<string, unknown>
  ): Promise<GenieACSTask> {
    try {
      const data = await httpClient.post<GenieACSTask>(
        `/api/tr069/set-parameters/${deviceId}`,
        { parameters }
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao definir parâmetros do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Executar factory reset em um dispositivo via TR-069
   */
  async factoryReset(deviceId: string): Promise<GenieACSTask> {
    try {
      const data = await httpClient.post<GenieACSTask>(
        `/api/tr069/factory-reset/${deviceId}`
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao executar factory reset no dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Reiniciar um dispositivo via TR-069
   */
  async rebootDevice(deviceId: string): Promise<GenieACSTask> {
    try {
      const data = await httpClient.post<GenieACSTask>(
        `/api/tr069/reboot/${deviceId}`
      );
      return data;
    } catch (error) {
      console.error(`Erro ao reiniciar dispositivo ${deviceId}:`, error);
      throw error;
    }
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
    try {
      const data = await httpClient.get<ActivityLog[]>(
        '/api/activity-history',
        params as Record<string, unknown>
      );
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico de atividades:', error);
      throw error;
    }
  }

  /**
   * Buscar atividade específica por ID
   */
  async getActivityById(activityId: string): Promise<ActivityLog> {
    try {
      const data = await httpClient.get<ActivityLog>(
        `/api/activity-history/${activityId}`
      );
      return data;
    } catch (error) {
      console.error(`Erro ao buscar atividade ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar atividades de um dispositivo específico
   */
  async getActivityByDevice(deviceId: string): Promise<ActivityLog[]> {
    try {
      const data = await httpClient.get<ActivityLog[]>(
        `/api/activity-history/device/${deviceId}`
      );
      return data;
    } catch (error) {
      console.error(
        `Erro ao buscar atividades do dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
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
    try {
      const data = await httpClient.post<ActivityLog>(
        '/api/activity-history',
        activity
      );
      return data;
    } catch (error) {
      console.error('Erro ao criar entrada no histórico:', error);
      throw error;
    }
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
    try {
      const data = await httpClient.get<{
        total_activities: number;
        success_rate: number;
        recent_activities: number;
        top_actions: Array<{ action: string; count: number }>;
      }>('/api/activity-history/stats');
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de atividades:', error);
      throw error;
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Verificar status de conexão com o backend
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const data = await httpClient.get<{ status: string; message: string }>(
        '/'
      );
      return data;
    } catch (error) {
      console.error('Erro ao verificar saúde da API:', error);
      throw error;
    }
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

  // ===== MOCK DATA METHODS =====

  private getMockONUs(): ONU[] {
    return [
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
      // Adicionar mais dados mock conforme necessário
    ];
  }

  private getMockCPEs(): CPE[] {
    return [
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
    ];
  }

  private getMockOLTs(): OLT[] {
    return [
      {
        id: '1',
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
        id: '2',
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
        id: '3',
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
        id: '4',
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
  }

  private getMockOLTStats(oltId: string): {
    total: number;
    online: number;
    offline: number;
  } {
    // Dados mock baseados no ID da OLT
    const statsMap: Record<
      string,
      { total: number; online: number; offline: number }
    > = {
      '1': { total: 324, online: 298, offline: 26 },
      '2': { total: 256, online: 231, offline: 25 },
      '3': { total: 189, online: 175, offline: 14 },
      '4': { total: 412, online: 387, offline: 25 },
    };

    return statsMap[oltId] || { total: 0, online: 0, offline: 0 };
  }

  private getMockAlerts(): Alert[] {
    return [
      {
        id: '1',
        device_id: '1',
        severity: 'warning',
        title: 'Sinal Baixo',
        description: 'ONU com sinal abaixo do ideal (-25 dBm)',
        acknowledged: false,
        created_at: '2024-01-15T10:30:00Z',
        fault_code: 'LOW_SIGNAL',
      },
    ];
  }

  private getMockActivityLogs(): ActivityLog[] {
    return [
      {
        id: '1',
        action: 'Provisionou ONT',
        description: 'Cliente: Maria Santos - ONT: ZTE-F670L',
        user_name: 'João Silva',
        status: 'success',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
        task_name: 'provision_ont',
      },
      {
        id: '2',
        action: 'Alterou configuração WiFi',
        description: 'OLT-CENTRO-01 - Perfil de velocidade',
        user_name: 'Ana Costa',
        status: 'success',
        created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 min ago
        task_name: 'update_wifi_config',
      },
      {
        id: '3',
        action: 'Visualizou relatório',
        description: 'Relatório mensal de performance',
        user_name: 'Carlos Mendes',
        status: 'success',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        task_name: 'view_report',
      },
      {
        id: '4',
        action: 'Resetou ONT',
        description: 'Cliente: Pedro Oliveira - ONT: Huawei HG8245H',
        user_name: 'Lucia Pereira',
        status: 'success',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        task_name: 'reboot_ont',
      },
      {
        id: '5',
        action: 'Criou novo cliente',
        description: 'Cliente: Empresa TechCorp LTDA',
        user_name: 'Roberto Lima',
        status: 'success',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        task_name: 'create_customer',
      },
    ];
  }

  private getMockBandwidthStats(period: '24h' | '7d' | '30d'): BandwidthStats {
    // Gerar dados mock baseados no período
    const dataPoints = [];
    const now = new Date();
    const pointCount = period === '24h' ? 24 : period === '7d' ? 7 : 30;
    const intervalMs =
      period === '24h'
        ? 60 * 60 * 1000
        : period === '7d'
        ? 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

    for (let i = pointCount - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      const baseDownload = 800 + Math.sin(i * 0.5) * 200 + Math.random() * 100;
      const baseUpload = 400 + Math.sin(i * 0.3) * 100 + Math.random() * 50;

      dataPoints.push({
        timestamp: timestamp.toISOString(),
        download_mbps: Math.round(baseDownload * 10) / 10,
        upload_mbps: Math.round(baseUpload * 10) / 10,
        total_mbps: Math.round((baseDownload + baseUpload) * 10) / 10,
      });
    }

    const downloadValues = dataPoints.map((p) => p.download_mbps);
    const uploadValues = dataPoints.map((p) => p.upload_mbps);

    return {
      current_download: downloadValues[downloadValues.length - 1],
      current_upload: uploadValues[uploadValues.length - 1],
      peak_download: Math.max(...downloadValues),
      peak_upload: Math.max(...uploadValues),
      average_download:
        Math.round(
          (downloadValues.reduce((a, b) => a + b, 0) / downloadValues.length) *
            10
        ) / 10,
      average_upload:
        Math.round(
          (uploadValues.reduce((a, b) => a + b, 0) / uploadValues.length) * 10
        ) / 10,
      data_points: dataPoints,
    };
  }

  /**
   * Obter fontes de tráfego principais - Top Traffic Sources
   */
  async getTrafficSources(): Promise<TrafficSourcesStats> {
    try {
      // TODO: Implementar busca real no GenieACS
      return this.getMockTrafficSources();
    } catch (error) {
      console.error('Erro ao obter fontes de tráfego:', error);
      return this.getMockTrafficSources();
    }
  }

  private getMockTrafficSources(): TrafficSourcesStats {
    const sources = [
      {
        id: 'olt-central-01',
        name: 'OLT-Central-01',
        region: 'Centro',
        traffic_mbps: 2847,
        percentage: 32.5,
        trend: 'up' as const,
        trend_value: 12.3,
        device_type: 'OLT' as const,
        status: 'online' as const,
      },
      {
        id: 'olt-norte-03',
        name: 'OLT-Norte-03',
        region: 'Zona Norte',
        traffic_mbps: 2134,
        percentage: 24.3,
        trend: 'up' as const,
        trend_value: 8.7,
        device_type: 'OLT' as const,
        status: 'online' as const,
      },
      {
        id: 'router-backbone-01',
        name: 'Router-Backbone-01',
        region: 'Data Center',
        traffic_mbps: 1789,
        percentage: 20.4,
        trend: 'stable' as const,
        trend_value: 0.2,
        device_type: 'Router' as const,
        status: 'online' as const,
      },
      {
        id: 'olt-sul-02',
        name: 'OLT-Sul-02',
        region: 'Zona Sul',
        traffic_mbps: 1245,
        percentage: 14.2,
        trend: 'down' as const,
        trend_value: -5.1,
        device_type: 'OLT' as const,
        status: 'warning' as const,
      },
      {
        id: 'switch-agregacao-01',
        name: 'Switch-Agregacao-01',
        region: 'Centro',
        traffic_mbps: 758,
        percentage: 8.6,
        trend: 'up' as const,
        trend_value: 3.2,
        device_type: 'Switch' as const,
        status: 'online' as const,
      },
    ];

    const totalTraffic = sources.reduce(
      (sum, source) => sum + source.traffic_mbps,
      0
    );

    return {
      sources,
      total_traffic: totalTraffic,
      period: '24h',
    };
  }

  /**
   * Obter dados de performance dos OLTs
   */
  async getOLTPerformanceStats(): Promise<OLTPerformanceStats> {
    try {
      // TODO: Implementar busca real no GenieACS
      return this.getMockOLTPerformanceStats();
    } catch (error) {
      console.error('Erro ao obter dados de performance dos OLTs:', error);
      return this.getMockOLTPerformanceStats();
    }
  }

  private getMockOLTPerformanceStats(): OLTPerformanceStats {
    const performanceData = [
      {
        olt_id: 'olt-central-01',
        olt_name: 'OLT-Central-01',
        cpu_usage: 78.5,
        memory_usage: 65.2,
        temperature: 42.1,
        status: 'online' as const,
        location: 'Centro',
        timestamp: new Date().toISOString(),
      },
      {
        olt_id: 'olt-norte-03',
        olt_name: 'OLT-Norte-03',
        cpu_usage: 82.3,
        memory_usage: 71.8,
        temperature: 45.7,
        status: 'online' as const,
        location: 'Zona Norte',
        timestamp: new Date().toISOString(),
      },
      {
        olt_id: 'olt-sul-02',
        olt_name: 'OLT-Sul-02',
        cpu_usage: 94.1,
        memory_usage: 89.4,
        temperature: 51.3,
        status: 'warning' as const,
        location: 'Zona Sul',
        timestamp: new Date().toISOString(),
      },
      {
        olt_id: 'olt-oeste-01',
        olt_name: 'OLT-Oeste-01',
        cpu_usage: 56.7,
        memory_usage: 43.2,
        temperature: 38.9,
        status: 'online' as const,
        location: 'Zona Oeste',
        timestamp: new Date().toISOString(),
      },
      {
        olt_id: 'olt-leste-04',
        olt_name: 'OLT-Leste-04',
        cpu_usage: 69.8,
        memory_usage: 58.6,
        temperature: 41.2,
        status: 'online' as const,
        location: 'Zona Leste',
        timestamp: new Date().toISOString(),
      },
    ];

    return {
      performance_data: performanceData,
      period: 'current',
    };
  }

  private getMockPendingONUs(): Record<string, unknown>[] {
    return [
      {
        id: 'pending-demo-1',
        serial_number: 'PENDING001',
        olt_name: 'OLT-Central-01',
        board: 1,
        port: 1,
        discovered_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        distance: 1.2,
        onu_type: 'Huawei HG8310M',
        status: 'pending',
        rx_power: -18.5,
        temperature: 42.1,
      },
      {
        id: 'pending-demo-2',
        serial_number: 'PENDING002',
        olt_name: 'OLT-Norte-01',
        board: 1,
        port: 3,
        discovered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        distance: 1.8,
        onu_type: 'ZTE F601',
        status: 'pending',
        rx_power: -19.2,
        temperature: 40.5,
      },
      {
        id: 'pending-demo-3',
        serial_number: 'PENDING003',
        olt_name: 'OLT-Central-02',
        board: 2,
        port: 8,
        discovered_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        distance: 2.1,
        onu_type: 'Fiberhome AN5506',
        status: 'pending',
        rx_power: -20.1,
        temperature: 43.2,
      },
    ];
  }
}

// Instância global do serviço GenieACS
export const genieacsApi = new GenieACSApiService();
