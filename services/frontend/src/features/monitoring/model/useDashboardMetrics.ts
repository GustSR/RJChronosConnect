import { genieacsApi } from '@shared/api/genieacsApi';
import type { DashboardMetrics } from '@shared/api/types';
import { useCallback, useEffect, useRef, useState } from 'react';

type State = {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
};

export function useDashboardMetrics(params?: { pollIntervalMs?: number }) {
  const pollIntervalMs = params?.pollIntervalMs ?? 0;
  const pollIntervalRef = useRef<number | null>(null);

  const [state, setState] = useState<State>({
    metrics: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await genieacsApi.getDashboardMetrics();
      setState({ metrics: data, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Não foi possível carregar as métricas' }));
    }
  }, []);

  useEffect(() => {
    void load();

    if (pollIntervalMs > 0) {
      pollIntervalRef.current = window.setInterval(() => {
        void load();
      }, pollIntervalMs);
    }

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [load, pollIntervalMs]);

  return { ...state, reload: load };
}

