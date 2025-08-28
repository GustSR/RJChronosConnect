import axios from 'axios';
import type { ActivityHistoryFilter } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Proxy configured in vite.config.ts
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config: any) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Auth
  getCurrentUser: () => api.get('/auth/user'),
  
  // Dashboard
  getDashboardMetrics: () => api.get('/dashboard/metrics'),
  
  // Activity History
  getActivityHistory: (filters?: ActivityHistoryFilter) => {
    const params = new URLSearchParams();
    if (filters?.deviceId) params.append('deviceId', filters.deviceId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.executedBy) params.append('executedBy', filters.executedBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    return api.get(`/activity-history${params.toString() ? '?' + params.toString() : ''}`);
  },
  
  // Devices
  getCPEs: () => api.get('/devices/cpes'),
  getONUs: () => api.get('/devices/onus'),
  getOLTs: () => api.get('/devices/olts'),
  
  // Alerts
  getAlerts: () => api.get('/alerts'),
  acknowledgeAlert: (alertId: string) => api.patch(`/alerts/${alertId}/acknowledge`),
  
  // Health check
  healthCheck: () => api.get('/'),
};

export default api;
