import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ActivityHistoryFilter } from '../types';

// User hook
export function useAuth() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiService.getCurrentUser().then((res: any) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Dashboard metrics hook
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiService.getDashboardMetrics().then((res: any) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Activity History hooks
export function useActivityHistory(filters?: ActivityHistoryFilter) {
  return useQuery({
    queryKey: ['activity-history', filters],
    queryFn: () => apiService.getActivityHistory(filters).then((res: any) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Cache for 10 seconds
  });
}

export function useRecentActivities(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: () => apiService.getActivityHistory({ limit }).then((res: any) => res.data),
    refetchInterval: 15000, // Refresh every 15 seconds for recent activities
    staleTime: 5000,
  });
}

// Devices hooks
export function useCPEs() {
  return useQuery({
    queryKey: ['devices', 'cpes'],
    queryFn: () => apiService.getCPEs().then((res: any) => res.data),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useONUs() {
  return useQuery({
    queryKey: ['devices', 'onus'],
    queryFn: () => apiService.getONUs().then((res: any) => res.data),
    refetchInterval: 60000,
  });
}

export function useOLTs() {
  return useQuery({
    queryKey: ['devices', 'olts'],
    queryFn: () => apiService.getOLTs().then((res: any) => res.data),
    refetchInterval: 60000,
  });
}

// Alerts hooks
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiService.getAlerts().then((res: any) => res.data),
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
    queryFn: () => apiService.healthCheck().then((res: any) => res.data),
    refetchInterval: 30000,
    retry: 3,
  });
}
