import type { SvgIconComponent } from '@mui/icons-material';
import { Assignment, BugReport, Cable, Computer, DeviceHub, NetworkWifi, Security, Settings } from '@mui/icons-material';
import type { ConfigurationTabId } from './types';

export type ConfigurationMenuItem = {
  id: ConfigurationTabId;
  label: string;
  icon: SvgIconComponent;
};

export const menuItems: ConfigurationMenuItem[] = [
  { id: 'general', label: 'Geral', icon: Settings },
  { id: 'lan-dhcp', label: 'LAN DHCP', icon: Cable },
  { id: 'wifi', label: 'WI-FI', icon: NetworkWifi },
  { id: 'hosts', label: 'Hosts', icon: Computer },
  { id: 'lan-ports', label: 'Lan Ports', icon: DeviceHub },
  { id: 'device-logs', label: 'Device Logs', icon: Assignment },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: BugReport },
  { id: 'security', label: 'Security', icon: Security },
];
