// Utilitário para formatar tempo de uptime
export const formatUptime = (uptimeString: string): string => {
  return uptimeString;
};

// Utilitário para determinar status de sinal
export const getSignalStatus = (
  rxPower: number
): 'good' | 'warning' | 'critical' => {
  if (rxPower >= -20) return 'good';
  if (rxPower >= -25) return 'warning';
  return 'critical';
};
