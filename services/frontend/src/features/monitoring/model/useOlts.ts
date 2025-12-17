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
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const oltList = await genieacsApi.getOLTs();
      setState({ olts: oltList, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar dados dos OLTs:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados' }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

