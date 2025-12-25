import { oltManagementApi } from '@shared/api/oltManagementApi';
import type { ManagedOLT, OltLiveInfo } from '@shared/api/oltManagementTypes';
import { useCallback, useEffect, useState } from 'react';

type State = {
  olt: ManagedOLT | null;
  liveInfo: OltLiveInfo | null;
  loading: boolean;
  error: string | null;
  liveError: string | null;
};

export function useOltDetails(oltId?: string) {
  const [state, setState] = useState<State>({
    olt: null,
    liveInfo: null,
    loading: false,
    error: null,
    liveError: null,
  });

  const load = useCallback(async () => {
    if (!oltId) {
      setState({
        olt: null,
        liveInfo: null,
        loading: false,
        error: 'OLT não encontrada',
        liveError: null,
      });
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        liveError: null,
      }));
      const [olt, liveInfo] = await Promise.all([
        oltManagementApi.getOltById(oltId),
        oltManagementApi.getOltLiveInfo(oltId).catch(() => null),
      ]);

      if (!olt) {
        setState({
          olt: null,
          liveInfo: null,
          loading: false,
          error: 'OLT não encontrada',
          liveError: null,
        });
        return;
      }

      setState({
        olt,
        liveInfo,
        loading: false,
        error: null,
        liveError: liveInfo ? null : 'Dados ao vivo indisponíveis',
      });
    } catch (err) {
      console.error('Erro ao carregar detalhes da OLT:', err);
      setState({
        olt: null,
        liveInfo: null,
        loading: false,
        error: 'Erro ao carregar detalhes da OLT',
        liveError: null,
      });
    }
  }, [oltId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
