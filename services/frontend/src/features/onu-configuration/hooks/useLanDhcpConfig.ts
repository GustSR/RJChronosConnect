import { useState } from 'react';
import type { LanDhcpConfig } from '../types';
import { initialLanDhcpConfig } from '../defaults';

export function useLanDhcpConfig() {
  const [config, setConfig] = useState<LanDhcpConfig>(initialLanDhcpConfig);
  const [originalConfig, setOriginalConfig] =
    useState<LanDhcpConfig>(initialLanDhcpConfig);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const save = () => {
    setOriginalConfig({ ...config });
  };

  return { config, setConfig, hasChanges, save };
}
