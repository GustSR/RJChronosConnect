import { genieacsApi } from '@shared/api/genieacsApi';
import type { OLTPerformanceStats } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  performanceStats: OLTPerformanceStats | null;
  loading: boolean;
  error: string | null;
};

export function useOltPerformanceStats() {
  const [state, setState] = useState<State>({
    performanceStats: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const stats = await genieacsApi.getOLTPerformanceStats();
      setState({ performanceStats: stats, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar dados de performance:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados' }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

