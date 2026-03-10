import { useState } from 'react';
import type { WifiNetworks } from '../types';
import { initialWifiNetworks } from '../defaults';

export function useWifiConfig() {
  const [networks, setNetworks] = useState<WifiNetworks>(initialWifiNetworks);
  const [originalNetworks, setOriginalNetworks] =
    useState<WifiNetworks>(initialWifiNetworks);

  const hasChanges = (networkKey: string) =>
    JSON.stringify(networks[networkKey as keyof WifiNetworks]) !==
    JSON.stringify(originalNetworks[networkKey as keyof WifiNetworks]);

  const save = (networkKey: string) => {
    setOriginalNetworks((prev) => ({
      ...prev,
      [networkKey]: { ...networks[networkKey as keyof WifiNetworks] },
    }));
  };

  const updateNetwork = (
    networkKey: string,
    field: string,
    value: unknown
  ) => {
    setNetworks((prev) => ({
      ...prev,
      [networkKey]: {
        ...prev[networkKey as keyof WifiNetworks],
        [field]: value,
      },
    }));
  };

  return { networks, setNetworks, hasChanges, save, updateNetwork };
}
