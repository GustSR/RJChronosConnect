import { genieacsApi } from '@shared/api/genieacsApi';
import type { BandwidthStats } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  bandwidthStats: BandwidthStats | null;
  loading: boolean;
  error: string | null;
};

export function useBandwidthStats(range: '1h' | '6h' | '24h' | '7d' = '24h') {
  const [state, setState] = useState<State>({
    bandwidthStats: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const stats = await genieacsApi.getBandwidthStats(range);
      setState({ bandwidthStats: stats, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar dados de bandwidth:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados' }));
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

