import { format, formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Date and Time Utilities
export const formatDate = (date: Date | string, pattern: string = 'dd/MM/yyyy HH:mm'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValid(dateObj) ? format(dateObj, pattern, { locale: ptBR }) : 'Data inválida';
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isValid(dateObj) ? formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR }) : 'Data inválida';
};

// Number and Metric Utilities
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatBandwidth = (bps: number): string => {
  if (bps === 0) return '0 bps';
  const k = 1000;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  return parseFloat((bps / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPercentage = (value: number, total: number, decimals: number = 1): string => {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(decimals) + '%';
};

export const formatLatency = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Status and Health Utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    online: '#4caf50',
    offline: '#f44336',
    warning: '#ff9800',
    error: '#f44336',
    maintenance: '#2196f3',
    active: '#4caf50',
    inactive: '#9e9e9e',
    critical: '#d32f2f',
    healthy: '#4caf50',
    degraded: '#ff9800'
  };
  return statusColors[status.toLowerCase()] || '#9e9e9e';
};

export const getHealthScore = (metrics: Record<string, number>): number => {
  const weights = {
    signalStrength: 0.25,
    snr: 0.20,
    packetLoss: 0.20,
    latency: 0.15,
    errorRate: 0.10,
    uptime: 0.10
  };

  let score = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([metric, weight]) => {
    if (metrics[metric] !== undefined) {
      let normalizedValue = 0;
      
      switch (metric) {
        case 'signalStrength':
          normalizedValue = Math.max(0, Math.min(100, (metrics[metric] + 100) * 2));
          break;
        case 'snr':
          normalizedValue = Math.max(0, Math.min(100, metrics[metric] * 3.33));
          break;
        case 'packetLoss':
          normalizedValue = Math.max(0, 100 - (metrics[metric] * 10));
          break;
        case 'latency':
          normalizedValue = Math.max(0, 100 - (metrics[metric] / 10));
          break;
        case 'errorRate':
          normalizedValue = Math.max(0, 100 - (metrics[metric] * 100));
          break;
        case 'uptime':
          normalizedValue = Math.min(100, (metrics[metric] / 86400) * 100);
          break;
      }
      
      score += normalizedValue * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
};

// Data Processing Utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterBy = <T>(array: T[], filters: Record<string, any>): T[] => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      const itemValue = (item as any)[key];
      
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      
      if (typeof value === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }
      
      return itemValue === value;
    });
  });
};

// Validation Utilities
export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

export const isValidMAC = (mac: string): boolean => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Color and Theme Utilities
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getGradient = (color1: string, color2: string, angle: number = 45): string => {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
};

// Chart Data Utilities
export const generateTimeSeriesData = (
  startDate: Date,
  endDate: Date,
  interval: number,
  generator: (timestamp: Date) => number
): Array<{ timestamp: Date; value: number }> => {
  const data = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    data.push({
      timestamp: new Date(current),
      value: generator(current)
    });
    current.setTime(current.getTime() + interval);
  }
  
  return data;
};

export const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }
  return result;
};

// Local Storage Utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};

// Debounce and Throttle Utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Error Handling Utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ocorreu um erro inesperado';
};

// Export Utilities
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Device Utilities
export const getDeviceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    cpe: 'router',
    olt: 'hub',
    ont: 'device_hub',
    router: 'router',
    switch: 'switch_access_shortcut',
    server: 'dns',
    modem: 'modem'
  };
  
  return icons[type.toLowerCase()] || 'device_unknown';
};

export const calculateSignalQuality = (signalStrength: number): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  percentage: number;
  color: string;
} => {
  const percentage = Math.max(0, Math.min(100, (signalStrength + 100) * 2));
  
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  let color: string;
  
  if (percentage >= 80) {
    quality = 'excellent';
    color = '#4caf50';
  } else if (percentage >= 60) {
    quality = 'good';
    color = '#8bc34a';
  } else if (percentage >= 40) {
    quality = 'fair';
    color = '#ff9800';
  } else {
    quality = 'poor';
    color = '#f44336';
  }
  
  return { quality, percentage, color };
};
