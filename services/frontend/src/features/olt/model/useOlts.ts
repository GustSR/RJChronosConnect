import { genieacsApi } from '@shared/api/genieacsApi';
import type { OLT } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  olts: OLT[];
  loading: boolean;
  error: string | null;
};

export function useOlts() {
  const [state, setState] = useState<State>({
    olts: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await genieacsApi.getOLTs();
      setState({ olts: data, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar OLTs:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar lista de OLTs',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

