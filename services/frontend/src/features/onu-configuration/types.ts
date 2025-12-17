export interface ONUDetails {
  id: string;
  serialNumber: string;
  model: string;
  customerName: string;
  oltName: string;
  board: string;
  port: string;
  status: 'online' | 'offline' | 'powered_off';
  authorizedAt: string;
  ip?: string;
  temperature?: number;
}

export type ConfigurationTabId =
  | 'general'
  | 'lan-dhcp'
  | 'wifi'
  | 'hosts'
  | 'lan-ports'
  | 'device-logs'
  | 'troubleshooting'
  | 'security';

export type LanDhcpConfig = {
  lanIpInterface: string;
  lanIpNetmask: string;
  dhcpServerActive: string;
  dhcpIpPoolMin: string;
  dhcpIpPoolMax: string;
  dhcpSubnetMask: string;
  dhcpGateway: string;
  dhcpDnsServers: string;
};

export type WifiNetwork = {
  name: string;
  band: string;
  ssid: string;
  password: string;
  authMode: string;
  status: string;
  enabled: boolean;
  rfBand: string;
  standard: string;
  radioEnabled: boolean;
  totalAssociations: number;
  ssidAdvertisement: boolean;
  wpaEncryption: string;
  channelWidth: string;
  autoChannel: boolean;
  channel: number;
  countryDomain: string;
  txPower: string;
};

export type WifiNetworkKey = 'wlan1' | 'wlan2' | 'wlan3' | 'wlan4';

export type WifiNetworks = Record<WifiNetworkKey, WifiNetwork>;

export type SecurityConfig = {
  tpAccessFromWan: string;
  ftpAccessFromLan: string;
  userInterfaceAccessFromWan: string;
  userInterfaceAccessFromLan: string;
  sshAccessFromWan: string;
  sshAccessFromLan: string;
  sambaAccessFromWan: string;
  sambaAccessFromLan: string;
  telnetAccessFromWan: string;
  telnetAccessFromLan: string;
  wanIcmpEchoReply: string;
  sshService: string;
  telnetService: string;
  cliUsername: string;
  cliPassword: string;
  webUserAccount: string;
  webUserName: string;
  webUserPassword: string;
  webAdminAccount: string;
  webAdminName: string;
  webAdminPassword: string;
};

export type ConnectedHost = {
  id: number;
  macAddress: string;
  ipAddress: string;
  addressSource: string;
  hostname: string;
  port: string;
  active: boolean;
};
