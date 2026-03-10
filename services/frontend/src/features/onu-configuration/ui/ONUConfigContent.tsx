import { Card, CardContent, Typography } from '@mui/material';
import { useState } from 'react';

import { useLanDhcpConfig, useSecurityConfig, useWifiConfig } from '../hooks';
import { menuItems } from '../menuItems';
import { connectedHosts } from '../mockData';
import type { ConfigurationTabId, ONUDetails } from '../types';
import {
  DeviceLogsPanel,
  GeneralPanel,
  HostsPanel,
  LanDhcpPanel,
  LanPortsPanel,
  SecurityPanel,
  TroubleshootingPanel,
  WifiPanel,
} from './panels';
import WanTr069Panel from './WanTr069Panel';

type Props = {
  selectedItem: ConfigurationTabId;
  onuDetails: ONUDetails;
};

export function ONUConfigContent({ selectedItem, onuDetails }: Props) {
  const lanDhcp = useLanDhcpConfig();
  const wifi = useWifiConfig();
  const security = useSecurityConfig();

  const [selectedWifiLan, setSelectedWifiLan] = useState('');
  const [selectedTroubleshootingTest, setSelectedTroubleshootingTest] =
    useState('');

  const renderContent = () => {
    switch (selectedItem) {
      case 'general':
        return <GeneralPanel onuDetails={onuDetails} />;
      case 'wan-tr069':
        return <WanTr069Panel onuDetails={onuDetails} />;
      case 'lan-dhcp':
        return (
          <LanDhcpPanel
            config={lanDhcp.config}
            setConfig={lanDhcp.setConfig}
            hasChanges={lanDhcp.hasChanges}
            onSave={lanDhcp.save}
          />
        );
      case 'wifi':
        return (
          <WifiPanel
            wifiNetworks={wifi.networks}
            selectedWifiLan={selectedWifiLan}
            setSelectedWifiLan={setSelectedWifiLan}
            updateWifiNetwork={wifi.updateNetwork}
            hasWifiChanges={wifi.hasChanges}
            onSaveWifi={wifi.save}
          />
        );
      case 'hosts':
        return <HostsPanel hosts={connectedHosts} />;
      case 'lan-ports':
        return <LanPortsPanel />;
      case 'device-logs':
        return <DeviceLogsPanel />;
      case 'troubleshooting':
        return (
          <TroubleshootingPanel
            selectedTest={selectedTroubleshootingTest}
            setSelectedTest={setSelectedTroubleshootingTest}
          />
        );
      case 'security':
        return (
          <SecurityPanel
            config={security.config}
            setConfig={security.setConfig}
            hasChanges={security.hasChanges}
            onSave={security.save}
          />
        );
      default:
        return null;
    }
  };

  const panelLabel = menuItems.find((item) => item.id === selectedItem)?.label;

  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
        transition: 'none !important',
        '&:hover': {
          boxShadow: 'none !important',
          transform: 'none !important',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
          {panelLabel}
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
