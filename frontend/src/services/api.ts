import axios from 'axios';

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
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
