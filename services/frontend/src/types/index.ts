// Core Types for RJChronos System
export interface Device {
  id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  ipAddress: string;
  macAddress: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  metrics: DeviceMetrics;
  configuration: DeviceConfiguration;
}

export interface DeviceMetrics {
  signalStrength: number;
  snr: number;
  temperature: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  throughput: {
    download: number;
    upload: number;
  };
  errorRate: number;
  packetLoss: number;
}

export interface DeviceConfiguration {
  wifiSettings: {
    ssid: string;
    channel: number;
    bandwidth: string;
    security: string;
  };
  networkSettings: {
    dhcp: boolean;
    staticIp?: string;
    gateway: string;
    dns: string[];
  };
  managementSettings: {
    tr069Enabled: boolean;
    autoUpdate: boolean;
    remoteDiagnostics: boolean;
  };
}

export interface Alert {
  id: string;
  deviceId?: string;
  type: 'critical' | 'warning' | 'info';
  category: 'connectivity' | 'performance' | 'security' | 'maintenance';
  title: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  severity: 1 | 2 | 3 | 4 | 5;
  assignedTo?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface NetworkNode {
  id: string;
  type: 'olt' | 'cpe' | 'router' | 'switch' | 'server';
  label: string;
  position: { x: number; y: number };
  status: 'active' | 'inactive' | 'warning' | 'error';
  metrics: {
    connections: number;
    throughput: number;
    latency: number;
  };
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  type: 'fiber' | 'ethernet' | 'wireless';
  bandwidth: number;
  utilization: number;
  status: 'active' | 'inactive' | 'degraded';
}

export interface ProvisioningTemplate {
  id: string;
  name: string;
  description: string;
  deviceType: string;
  configuration: Record<string, any>;
  parameters: TemplateParameter[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface TemplateParameter {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface DiagnosticTest {
  id: string;
  deviceId: string;
  type: 'ping' | 'traceroute' | 'speedtest' | 'signal' | 'connectivity';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results?: DiagnosticResult;
  parameters: Record<string, any>;
}

export interface DiagnosticResult {
  success: boolean;
  data: Record<string, any>;
  metrics: {
    duration: number;
    latency?: number;
    throughput?: {
      download: number;
      upload: number;
    };
    packetLoss?: number;
    jitter?: number;
  };
  recommendations?: string[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'metric' | 'alert' | 'schedule' | 'event';
    conditions: RuleCondition[];
  };
  actions: RuleAction[];
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface RuleAction {
  type: 'reboot' | 'notification' | 'configuration' | 'diagnostic' | 'escalation';
  parameters: Record<string, any>;
  delay?: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'sla' | 'performance' | 'inventory' | 'alerts' | 'custom';
  parameters: ReportParameters;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    enabled: boolean;
  };
  lastGenerated?: Date;
  format: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface ReportParameters {
  dateRange: {
    start: Date;
    end: Date;
  };
  devices?: string[];
  metrics?: string[];
  groupBy?: string;
  filters?: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'operator' | 'viewer' | 'technician';
  permissions: Permission[];
  lastLogin?: Date;
  active: boolean;
  preferences: UserPreferences;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

export interface SystemSettings {
  general: {
    systemName: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  notifications: {
    email: {
      enabled: boolean;
      smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
    };
    sms: {
      enabled: boolean;
      provider: string;
      apiKey: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
      secret?: string;
    };
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
  };
  integrations: {
    tr069: {
      enabled: boolean;
      port: number;
      ssl: boolean;
    };
    snmp: {
      enabled: boolean;
      community: string;
      version: '1' | '2c' | '3';
    };
    api: {
      enabled: boolean;
      rateLimit: number;
      authentication: 'api-key' | 'oauth' | 'jwt';
    };
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  category?: string;
}

export interface MetricSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  unit?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'status' | 'custom';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  configuration: Record<string, any>;
  dataSource: string;
  refreshInterval?: number;
}

// Real-time Data Types
export interface RealtimeMetrics {
  deviceId: string;
  timestamp: Date;
  metrics: Record<string, number>;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime: number;
  }[];
  metrics: {
    devicesOnline: number;
    totalDevices: number;
    activeAlerts: number;
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
  };
}
