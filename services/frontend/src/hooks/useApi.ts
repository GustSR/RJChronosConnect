import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// User hook
export function useAuth() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiService.getCurrentUser().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Dashboard metrics hook
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiService.getDashboardMetrics().then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Devices hooks
export function useCPEs() {
  return useQuery({
    queryKey: ['devices', 'cpes'],
    queryFn: () => apiService.getCPEs().then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useONUs() {
  return useQuery({
    queryKey: ['devices', 'onus'],
    queryFn: () => apiService.getONUs().then(res => res.data),
    refetchInterval: 60000,
  });
}

export function useOLTs() {
  return useQuery({
    queryKey: ['devices', 'olts'],
    queryFn: () => apiService.getOLTs().then(res => res.data),
    refetchInterval: 60000,
  });
}

// Alerts hooks
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiService.getAlerts().then(res => res.data),
    refetchInterval: 15000, // Refresh every 15 seconds for alerts
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => apiService.acknowledgeAlert(alertId),
    onSuccess: () => {
      // Invalidate alerts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck().then(res => res.data),
    refetchInterval: 30000,
    retry: 3,
  });
}
