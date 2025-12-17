import { genieacsApi } from '@shared/api/genieacsApi';
import type { OLT } from '@shared/api/types';
import { useCallback, useEffect, useState } from 'react';

export interface OLTGridData {
  id: string;
  oltName: string;
  totalOnts: number;
  onlineOnts: number;
  offlineOnts: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
  lastIssue: string;
  uptime: string;
  model: string;
  location: string;
}

type State = {
  oltData: OLTGridData[];
  loading: boolean;
  error: string | null;
};

const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

const getOLTStatus = (
  olt: OLT,
  onlineCount: number,
  totalCount: number
): 'online' | 'offline' | 'warning' | 'critical' => {
  if (olt.status === 'offline') return 'offline';

  const onlinePercentage = totalCount > 0 ? (onlineCount / totalCount) * 100 : 0;

  if (onlinePercentage < 70) return 'critical';
  if (onlinePercentage < 90) return 'warning';
  return 'online';
};

const getLastIssue = (status: string): string => {
  switch (status) {
    case 'offline':
      return 'OLT desconectada';
    case 'critical':
      return 'Muitas ONUs offline';
    case 'warning':
      return 'Algumas ONUs com problema';
    case 'online':
      return 'Nenhum problema';
    default:
      return 'Status desconhecido';
  }
};

export function useOltGridData() {
  const [state, setState] = useState<State>({
    oltData: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const olts = await genieacsApi.getOLTs();

      const oltGridData: OLTGridData[] = await Promise.all(
        olts.map(async (olt) => {
          try {
            const stats = await genieacsApi.getOLTStats(olt.id);
            const status = getOLTStatus(olt, stats.online, stats.total);

            return {
              id: olt.id,
              oltName: `OLT-${olt.location.split(' - ')[0].toUpperCase()}-${olt.id.padStart(2, '0')}`,
              totalOnts: stats.total,
              onlineOnts: stats.online,
              offlineOnts: stats.offline,
              status,
              lastIssue: getLastIssue(status),
              uptime: formatUptime(olt.uptime || 0),
              model: olt.model,
              location: olt.location,
            };
          } catch (statError) {
            console.error(`Erro ao buscar stats da OLT ${olt.id}:`, statError);
            return {
              id: olt.id,
              oltName: `OLT-${olt.location.split(' - ')[0].toUpperCase()}-${olt.id.padStart(2, '0')}`,
              totalOnts: 0,
              onlineOnts: 0,
              offlineOnts: 0,
              status: 'offline',
              lastIssue: 'Erro ao carregar dados',
              uptime: '0d 0h',
              model: olt.model,
              location: olt.location,
            };
          }
        })
      );

      setState({ oltData: oltGridData, loading: false, error: null });
    } catch (err) {
      console.error('Erro ao carregar dados das OLTs:', err);
      setState((prev) => ({ ...prev, loading: false, error: 'Erro ao carregar dados das OLTs' }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

