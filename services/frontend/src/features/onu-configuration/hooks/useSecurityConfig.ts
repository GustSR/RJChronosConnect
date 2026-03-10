import { useState } from 'react';
import type { SecurityConfig } from '../types';
import { initialSecurityConfig } from '../defaults';

export function useSecurityConfig() {
  const [config, setConfig] = useState<SecurityConfig>(initialSecurityConfig);
  const [originalConfig, setOriginalConfig] =
    useState<SecurityConfig>(initialSecurityConfig);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const save = () => {
    setOriginalConfig({ ...config });
  };

  return { config, setConfig, hasChanges, save };
}
