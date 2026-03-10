# ONUConfiguration Refactor — Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refatorar o componente monolitico ONUConfiguration.tsx (555 linhas) em hooks customizados, sub-componentes e paineis padronizados seguindo FSD.

**Architecture:** Extrair state management para hooks por dominio (useONUDetails, useLanDhcpConfig, useWifiConfig, useSecurityConfig). Quebrar a pagina em 3 sub-componentes (Header, Menu, Content). Padronizar paineis: cores do theme, mocks centralizados.

**Tech Stack:** React 18, TypeScript, MUI 5, React Router 6

---

### Task 1: Criar hooks de state management

**Files:**
- Create: `services/frontend/src/features/onu-configuration/hooks/useONUDetails.ts`
- Create: `services/frontend/src/features/onu-configuration/hooks/useLanDhcpConfig.ts`
- Create: `services/frontend/src/features/onu-configuration/hooks/useWifiConfig.ts`
- Create: `services/frontend/src/features/onu-configuration/hooks/useSecurityConfig.ts`
- Create: `services/frontend/src/features/onu-configuration/hooks/index.ts`

**Step 1: Criar useONUDetails.ts**

```typescript
// services/frontend/src/features/onu-configuration/hooks/useONUDetails.ts
import { useEffect, useState } from 'react';
import { useProvisioning } from '@features/onu-provisioning';
import type { ONUDetails } from '../types';

export function useONUDetails(id: string | undefined) {
  const { provisionedONUs } = useProvisioning();
  const [loading, setLoading] = useState(true);
  const [onuDetails, setOnuDetails] = useState<ONUDetails | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const onu = provisionedONUs.find((item) => item.id === id);

    if (onu) {
      setOnuDetails({
        id: onu.id,
        serialNumber: onu.serialNumber,
        model: onu.onuType,
        customerName: onu.clientName,
        oltName: onu.oltName,
        board: onu.board.toString(),
        port: onu.port.toString(),
        ontId: onu.onuId,
        status: onu.status,
        authorizedAt: onu.authorizedAt,
        ip: '192.168.2.1',
        temperature: 45,
      });
    } else {
      setOnuDetails(null);
    }

    setLoading(false);
  }, [id, provisionedONUs]);

  return { onuDetails, loading };
}
```

**Step 2: Criar useLanDhcpConfig.ts**

```typescript
// services/frontend/src/features/onu-configuration/hooks/useLanDhcpConfig.ts
import { useState } from 'react';
import type { LanDhcpConfig } from '../types';
import { initialLanDhcpConfig } from '../defaults';

export function useLanDhcpConfig() {
  const [config, setConfig] = useState<LanDhcpConfig>(initialLanDhcpConfig);
  const [originalConfig, setOriginalConfig] = useState<LanDhcpConfig>(initialLanDhcpConfig);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const save = () => {
    setOriginalConfig({ ...config });
  };

  return { config, setConfig, hasChanges, save };
}
```

**Step 3: Criar useWifiConfig.ts**

```typescript
// services/frontend/src/features/onu-configuration/hooks/useWifiConfig.ts
import { useState } from 'react';
import type { WifiNetworks } from '../types';
import { initialWifiNetworks } from '../defaults';

export function useWifiConfig() {
  const [networks, setNetworks] = useState<WifiNetworks>(initialWifiNetworks);
  const [originalNetworks, setOriginalNetworks] = useState<WifiNetworks>(initialWifiNetworks);

  const hasChanges = (networkKey: string) => {
    return (
      JSON.stringify(networks[networkKey as keyof WifiNetworks]) !==
      JSON.stringify(originalNetworks[networkKey as keyof WifiNetworks])
    );
  };

  const save = (networkKey: string) => {
    setOriginalNetworks((prev) => ({
      ...prev,
      [networkKey]: { ...networks[networkKey as keyof WifiNetworks] },
    }));
  };

  const updateNetwork = (networkKey: string, field: string, value: unknown) => {
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
```

**Step 4: Criar useSecurityConfig.ts**

```typescript
// services/frontend/src/features/onu-configuration/hooks/useSecurityConfig.ts
import { useState } from 'react';
import type { SecurityConfig } from '../types';
import { initialSecurityConfig } from '../defaults';

export function useSecurityConfig() {
  const [config, setConfig] = useState<SecurityConfig>(initialSecurityConfig);
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig>(initialSecurityConfig);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const save = () => {
    setOriginalConfig({ ...config });
  };

  return { config, setConfig, hasChanges, save };
}
```

**Step 5: Criar barrel export**

```typescript
// services/frontend/src/features/onu-configuration/hooks/index.ts
export { useONUDetails } from './useONUDetails';
export { useLanDhcpConfig } from './useLanDhcpConfig';
export { useWifiConfig } from './useWifiConfig';
export { useSecurityConfig } from './useSecurityConfig';
```

**Step 6: Atualizar barrel export da feature**

Modificar `services/frontend/src/features/onu-configuration/index.ts`:
```typescript
export * from './ui';
export * from './types';
export * from './defaults';
export * from './menuItems';
export * from './mockData';
export * from './hooks';
```

**Step 7: Verificar build**

Run: `cd services/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Sem erros nos novos arquivos

**Step 8: Commit**

```bash
git add services/frontend/src/features/onu-configuration/hooks/
git add services/frontend/src/features/onu-configuration/index.ts
git commit -m "refactor(frontend): cria hooks de state management para ONUConfiguration"
```

---

### Task 2: Criar sub-componentes ONUConfigHeader, ONUConfigMenu, ONUConfigContent

**Files:**
- Create: `services/frontend/src/features/onu-configuration/ui/ONUConfigHeader.tsx`
- Create: `services/frontend/src/features/onu-configuration/ui/ONUConfigMenu.tsx`
- Create: `services/frontend/src/features/onu-configuration/ui/ONUConfigContent.tsx`
- Modify: `services/frontend/src/features/onu-configuration/ui/index.ts`

**Step 1: Criar ONUConfigHeader.tsx**

Extrair linhas 239-425 do ONUConfiguration.tsx (header card com info do device e animacao 3D).

```typescript
// services/frontend/src/features/onu-configuration/ui/ONUConfigHeader.tsx
import { RouterOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Link, Stack, Typography } from '@mui/material';
import type { ONUDetails } from '../types';

type Props = {
  onuDetails: ONUDetails;
  onOpenHistorico: () => void;
};

export function ONUConfigHeader({ onuDetails, onOpenHistorico }: Props) {
  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <RouterOutlined
                  sx={{ mr: 1, color: 'primary.main', fontSize: 24 }}
                />
                Equipamento: {onuDetails.serialNumber}
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ maxWidth: 300 }}>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                Pertence a: {onuDetails.customerName}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                OLT: {onuDetails.oltName}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                SLOT: {onuDetails.board}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                PON: {onuDetails.port}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                TR-069
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                SN: {onuDetails.serialNumber}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500">
                Status: {onuDetails.status === 'online' ? 'Online' : 'Offline'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '12px' }}
              >
                Autorizado em:{' '}
                {new Date(onuDetails.authorizedAt).toLocaleDateString('pt-BR')}{' '}
                as{' '}
                {new Date(onuDetails.authorizedAt).toLocaleTimeString('pt-BR')}
              </Typography>
              <Link
                href="#"
                color="primary"
                underline="hover"
                sx={{ fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenHistorico();
                }}
              >
                Historico de alteracoes
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 150,
                  height: 100,
                  border: 2,
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  animation: 'rotate 4s linear infinite',
                  '@keyframes rotate': {
                    '0%': { transform: 'rotateY(0deg)' },
                    '100%': { transform: 'rotateY(360deg)' },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 25,
                    border: 1,
                    borderColor: 'text.disabled',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'common.black',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'info.main',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  >
                    0000
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Criar ONUConfigMenu.tsx**

Extrair linhas 427-520 (menu lateral de configuracao).

```typescript
// services/frontend/src/features/onu-configuration/ui/ONUConfigMenu.tsx
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { menuItems } from '../menuItems';
import type { ConfigurationTabId } from '../types';

type Props = {
  selectedItem: ConfigurationTabId | '';
  onSelect: (id: ConfigurationTabId) => void;
};

export function ONUConfigMenu({ selectedItem, onSelect }: Props) {
  return (
    <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
          Opcoes de Configuracao
        </Typography>

        <Grid container spacing={2}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedItem === item.id;
            return (
              <Grid item xs={12} sm={6} key={item.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => onSelect(item.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <IconComponent
                        color={isSelected ? 'primary' : 'action'}
                        fontSize="medium"
                      />
                      <Typography
                        variant="body1"
                        fontWeight={isSelected ? 600 : 500}
                        color={isSelected ? 'primary.main' : 'text.primary'}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Criar ONUConfigContent.tsx**

Extrair renderContent + card wrapper. Os hooks sao consumidos aqui.

```typescript
// services/frontend/src/features/onu-configuration/ui/ONUConfigContent.tsx
import { Card, CardContent, Typography } from '@mui/material';
import { menuItems } from '../menuItems';
import { useLanDhcpConfig } from '../hooks/useLanDhcpConfig';
import { useWifiConfig } from '../hooks/useWifiConfig';
import { useSecurityConfig } from '../hooks/useSecurityConfig';
import { connectedHosts } from '../mockData';
import type { ConfigurationTabId, ONUDetails } from '../types';
import { GeneralPanel } from './panels/GeneralPanel';
import { LanDhcpPanel } from './panels/LanDhcpPanel';
import { WifiPanel } from './panels/WifiPanel';
import { HostsPanel } from './panels/HostsPanel';
import { LanPortsPanel } from './panels/LanPortsPanel';
import { DeviceLogsPanel } from './panels/DeviceLogsPanel';
import { TroubleshootingPanel } from './panels/TroubleshootingPanel';
import { SecurityPanel } from './panels/SecurityPanel';
import WanTr069Panel from './WanTr069Panel';
import { useState } from 'react';

type Props = {
  selectedItem: ConfigurationTabId;
  onuDetails: ONUDetails;
};

export function ONUConfigContent({ selectedItem, onuDetails }: Props) {
  const lanDhcp = useLanDhcpConfig();
  const wifi = useWifiConfig();
  const security = useSecurityConfig();

  const [selectedWifiLan, setSelectedWifiLan] = useState('');
  const [selectedTroubleshootingTest, setSelectedTroubleshootingTest] = useState('');

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

  return (
    <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
          {menuItems.find((item) => item.id === selectedItem)?.label}
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Atualizar ui/index.ts**

```typescript
// services/frontend/src/features/onu-configuration/ui/index.ts
export * from './panels';
export * from './ONUConfigurationStatusPage';
export * from './modals';
export { default as WanTr069Panel } from './WanTr069Panel';
export { ONUConfigHeader } from './ONUConfigHeader';
export { ONUConfigMenu } from './ONUConfigMenu';
export { ONUConfigContent } from './ONUConfigContent';
```

**Step 5: Verificar build**

Run: `cd services/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Sem erros

**Step 6: Commit**

```bash
git add services/frontend/src/features/onu-configuration/ui/ONUConfigHeader.tsx
git add services/frontend/src/features/onu-configuration/ui/ONUConfigMenu.tsx
git add services/frontend/src/features/onu-configuration/ui/ONUConfigContent.tsx
git add services/frontend/src/features/onu-configuration/ui/index.ts
git commit -m "refactor(frontend): cria sub-componentes Header, Menu e Content para ONUConfiguration"
```

---

### Task 3: Reescrever ONUConfiguration.tsx usando os novos componentes

**Files:**
- Modify: `services/frontend/src/pages/ONUConfiguration.tsx`

**Step 1: Reescrever o componente**

```typescript
// services/frontend/src/pages/ONUConfiguration.tsx
import type { ConfigurationTabId } from '@features/onu-configuration';
import { ONUConfigHeader, ONUConfigMenu, ONUConfigContent, HistoricoAlteracoesModal, historicoAlteracoes } from '@features/onu-configuration';
import { useONUDetails } from '@features/onu-configuration/hooks';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, Grid, IconButton, Typography } from '@mui/material';
import { useTitle } from '@shared/lib/hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ONUConfiguration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useTitle('Configuracao ONU');

  const { onuDetails, loading } = useONUDetails(id);
  const [selectedMenuItem, setSelectedMenuItem] = useState<ConfigurationTabId | ''>('');
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            Carregando...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!onuDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/clientes')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="600">
            ONU nao encontrada
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/clientes')}
          sx={{ mr: 2, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ONUConfigHeader
            onuDetails={onuDetails}
            onOpenHistorico={() => setHistoricoModalOpen(true)}
          />
        </Grid>

        <Grid item xs={12} lg={6}>
          <ONUConfigMenu
            selectedItem={selectedMenuItem}
            onSelect={setSelectedMenuItem}
          />
        </Grid>

        {selectedMenuItem && (
          <Grid item xs={12} lg={6}>
            <ONUConfigContent
              selectedItem={selectedMenuItem}
              onuDetails={onuDetails}
            />
          </Grid>
        )}
      </Grid>

      <HistoricoAlteracoesModal
        open={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        equipamentoId={onuDetails.id}
        equipamentoNome={onuDetails.serialNumber}
        historico={historicoAlteracoes}
      />
    </Container>
  );
}
```

**Step 2: Verificar build**

Run: `cd services/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Sem erros

**Step 3: Commit**

```bash
git add services/frontend/src/pages/ONUConfiguration.tsx
git commit -m "refactor(frontend): reescreve ONUConfiguration usando sub-componentes e hooks"
```

---

### Task 4: Padronizar paineis — cores do theme e mocks centralizados

**Files:**
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/HostsPanel.tsx`
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/DeviceLogsPanel.tsx`
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/GeneralPanel.tsx`
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/LanPortsPanel.tsx`
- Modify: `services/frontend/src/features/onu-configuration/mockData.ts`

**Step 1: HostsPanel — substituir cores hardcoded**

Substituicoes em `HostsPanel.tsx`:
- `border: '1px solid #e0e0e0'` → `border: 1, borderColor: 'divider'`
- `backgroundColor: '#f8f9fa'` → `bgcolor: 'action.hover'`

**Step 2: DeviceLogsPanel — substituir cor hardcoded**

Substituicao em `DeviceLogsPanel.tsx`:
- `backgroundColor: '#f5f5f5'` → `bgcolor: 'action.hover'`

**Step 3: GeneralPanel — mover dados mock para mockData.ts**

Adicionar ao `mockData.ts`:

```typescript
export const mockGeneralInfo = {
  manufacturer: 'ZTE Corporation',
  softwareVersion: 'V2.1.3_220825',
  hardwareVersion: 'V1.0',
  cpuUsage: '12%',
  totalRam: '128 MB',
  freeRam: '95 MB',
  uptime: '15 dias, 8 horas, 23 minutos',
};

export const mockDeviceLogs = [
  { timestamp: '2024-01-15 16:30:25', message: 'Sistema iniciado' },
  { timestamp: '2024-01-15 16:30:45', message: 'WiFi configurado' },
  { timestamp: '2024-01-15 16:31:00', message: 'DHCP ativo' },
  { timestamp: '2024-01-15 16:31:15', message: 'Primeira conexao de cliente' },
];

export const mockLanPorts = [
  { name: 'LAN1', active: true, connected: true, speed: '1000 Mbps', duplex: 'Full' },
  { name: 'LAN2', active: false, connected: false, speed: '-', duplex: '-' },
  { name: 'LAN3', active: true, connected: true, speed: '100 Mbps', duplex: 'Full' },
  { name: 'LAN4', active: false, connected: false, speed: '-', duplex: '-' },
];
```

**Step 4: Atualizar GeneralPanel para usar mockData**

```typescript
// services/frontend/src/features/onu-configuration/ui/panels/GeneralPanel.tsx
import { Grid, Typography } from '@mui/material';
import type { ONUDetails } from '../../types';
import { mockGeneralInfo } from '../../mockData';

type Props = {
  onuDetails: ONUDetails;
};

export function GeneralPanel({ onuDetails }: Props) {
  const info = mockGeneralInfo;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Fabricante
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.manufacturer}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Nome do modelo
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.model}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Versao do Software
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.softwareVersion}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Versao do hardware
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.hardwareVersion}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Numero de serie
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.serialNumber}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Temperatura do transceptor GPON
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {onuDetails.temperature}°C
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Uso da CPU
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.cpuUsage}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total de RAM
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.totalRam}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          RAM livre
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.freeRam}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tempo de atividade
        </Typography>
        <Typography variant="body1" fontWeight="500">
          {info.uptime}
        </Typography>
      </Grid>
    </Grid>
  );
}
```

**Step 5: Atualizar DeviceLogsPanel para usar mockData**

```typescript
// services/frontend/src/features/onu-configuration/ui/panels/DeviceLogsPanel.tsx
import { Box, Stack, Typography } from '@mui/material';
import { mockDeviceLogs } from '../../mockData';

export function DeviceLogsPanel() {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Ultimos eventos do sistema
      </Typography>
      <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
        <Stack spacing={1}>
          {mockDeviceLogs.map((log) => (
            <Typography
              key={log.timestamp}
              variant="body2"
              sx={{ fontFamily: 'monospace', fontSize: '12px' }}
            >
              <strong>{log.timestamp}</strong> - {log.message}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
```

**Step 6: Atualizar LanPortsPanel para usar mockData**

```typescript
// services/frontend/src/features/onu-configuration/ui/panels/LanPortsPanel.tsx
import { Box, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { OutlinedCard } from '@shared/ui/components';
import { mockLanPorts } from '../../mockData';

export function LanPortsPanel() {
  return (
    <Box>
      <Stack spacing={3}>
        {mockLanPorts.map((port, index) => (
          <OutlinedCard key={port.name}>
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, color: 'primary.main' }}
              >
                Porta {index + 1} - LAN
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nome
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {port.name}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ativo
                  </Typography>
                  <Chip
                    label={port.active ? 'Sim' : 'Nao'}
                    color={port.active ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={port.connected ? 'Conectado' : 'Desconectado'}
                    color={port.connected ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Velocidade
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="500"
                    color={port.connected ? 'text.primary' : 'text.secondary'}
                  >
                    {port.speed}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Duplex
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="500"
                    color={port.connected ? 'text.primary' : 'text.secondary'}
                  >
                    {port.duplex}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </OutlinedCard>
        ))}
      </Stack>
    </Box>
  );
}
```

**Step 7: Verificar build**

Run: `cd services/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: Sem erros

**Step 8: Commit**

```bash
git add services/frontend/src/features/onu-configuration/
git commit -m "refactor(frontend): padroniza paineis com cores do theme e mocks centralizados"
```

---

### Task 5: Remover transition/transform overrides desnecessarios

**Files:**
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/GeneralPanel.tsx`
- Modify: `services/frontend/src/features/onu-configuration/ui/panels/HostsPanel.tsx`

**Step 1: Remover overrides de transition/transform**

Em todos os paineis que tenham:
```typescript
'& .MuiGrid-item': {
  transition: 'none !important',
  transform: 'none !important',
},
```

Remover esses blocos. Se o tema global causa animacoes indesejadas, isso deve ser corrigido no theme, nao em cada componente.

Arquivos afetados:
- `GeneralPanel.tsx` — remover sx do Grid container (linhas 13-17)
- `HostsPanel.tsx` — remover transition overrides das TableRow e Chip

**Step 2: Verificar build**

Run: `cd services/frontend && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add services/frontend/src/features/onu-configuration/ui/panels/
git commit -m "refactor(frontend): remove transition/transform overrides dos paineis"
```

---

### Task 6: Verificacao final e build completo

**Step 1: TypeScript check**

Run: `cd services/frontend && npx tsc --noEmit`
Expected: Sem erros

**Step 2: Build de producao**

Run: `cd services/frontend && npx vite build 2>&1 | tail -20`
Expected: Build com sucesso

**Step 3: Commit final se necessario**

Se houver ajustes, commitar.

**Step 4: Verificar reducao de linhas**

Run: `wc -l services/frontend/src/pages/ONUConfiguration.tsx`
Expected: ~80 linhas (antes: 555)

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `features/onu-configuration/hooks/useONUDetails.ts` | Criar |
| `features/onu-configuration/hooks/useLanDhcpConfig.ts` | Criar |
| `features/onu-configuration/hooks/useWifiConfig.ts` | Criar |
| `features/onu-configuration/hooks/useSecurityConfig.ts` | Criar |
| `features/onu-configuration/hooks/index.ts` | Criar |
| `features/onu-configuration/ui/ONUConfigHeader.tsx` | Criar |
| `features/onu-configuration/ui/ONUConfigMenu.tsx` | Criar |
| `features/onu-configuration/ui/ONUConfigContent.tsx` | Criar |
| `features/onu-configuration/ui/index.ts` | Modificar |
| `features/onu-configuration/index.ts` | Modificar |
| `features/onu-configuration/mockData.ts` | Modificar |
| `features/onu-configuration/ui/panels/GeneralPanel.tsx` | Modificar |
| `features/onu-configuration/ui/panels/DeviceLogsPanel.tsx` | Modificar |
| `features/onu-configuration/ui/panels/LanPortsPanel.tsx` | Modificar |
| `features/onu-configuration/ui/panels/HostsPanel.tsx` | Modificar |
| `pages/ONUConfiguration.tsx` | Modificar (555→~80 linhas) |
