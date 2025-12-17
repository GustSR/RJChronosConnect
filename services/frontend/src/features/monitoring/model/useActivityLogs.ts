import { genieacsApi } from '@shared/api/genieacsApi';
import type { ActivityLog } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;
};

export function useActivityLogs(params?: { limit?: number }) {
  const limit = params?.limit ?? 5;
  const [state, setState] = useState<State>({
    activities: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const logs = await genieacsApi.getActivityLogs({ limit });
      setState({ activities: logs, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados' }));
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

