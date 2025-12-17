import { genieacsApi } from '@shared/api/genieacsApi';
import type { TrafficSourcesStats } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  trafficStats: TrafficSourcesStats | null;
  loading: boolean;
  error: string | null;
};

export function useTrafficSources() {
  const [state, setState] = useState<State>({
    trafficStats: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const stats = await genieacsApi.getTrafficSources();
      setState({ trafficStats: stats, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar fontes de tráfego:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados' }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

