import { genieacsApi } from '@shared/api/genieacsApi';
import type { OLT } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

type State = {
  olt: OLT | null;
  loading: boolean;
  error: string | null;
};

export function useOltDetails(oltId?: string) {
  const [state, setState] = useState<State>({
    olt: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!oltId) {
      setState({ olt: null, loading: false, error: 'OLT não encontrada' });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const olts = await genieacsApi.getOLTs();
      const found = olts.find((o) => o.id === oltId) || null;

      if (!found) {
        setState({ olt: null, loading: false, error: 'OLT não encontrada' });
        return;
      }

      setState({ olt: found, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar detalhes da OLT:', err);
      setState({ olt: null, loading: false, error: 'Erro ao carregar detalhes da OLT' });
    }
  }, [oltId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

