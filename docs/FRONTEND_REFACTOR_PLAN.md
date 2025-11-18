# 🎨 Plano de Refatoração do Frontend - RJChronosConnect

**Autor**: Claude (Análise Automatizada)
**Data**: 2025-11-18
**Branch**: `feature/frontend-refactor`
**Status**: 📋 Planejamento

---

## 📊 Situação Atual

### Métricas do Projeto
- **Total de arquivos**: 193 (113 TSX + 80 TS)
- **Arquitetura**: Feature-Sliced Design (FSD) - 40% implementado
- **Stack**: React 18 + TypeScript + Material-UI v5 + Vite
- **Problemas principais**: Componentes gigantes (3.608 linhas), violação de FSD, estado mal gerenciado

### Componentes Críticos Identificados

| Arquivo | Linhas | Complexidade | Prioridade |
|---------|--------|--------------|------------|
| ONUConfiguration.tsx | 3.608 | 🔴 Crítica | P0 - Urgente |
| Clientes.tsx | 1.476 | 🔴 Alta | P0 - Urgente |
| DashboardClientes.tsx | 715 | 🟡 Média | P1 - Alta |
| DashboardOLTs.tsx | 707 | 🟡 Média | P1 - Alta |
| ClienteDetalhes.tsx | 475 | 🟡 Média | P2 - Normal |
| ProvisioningContext.tsx | 268 | 🟡 Média | P1 - Alta |

---

## 🎯 Objetivos da Refatoração

### Objetivos Principais
1. ✅ **Quebrar componentes gigantes** em componentes menores e focados (< 300 linhas)
2. ✅ **Implementar Feature-Sliced Design** completamente
3. ✅ **Melhorar gerenciamento de estado** com TanStack Query
4. ✅ **Criar biblioteca de componentes reutilizáveis**
5. ✅ **Adicionar tipagem forte** (eliminar `any` e `Record<string, unknown>`)
6. ✅ **Melhorar testabilidade** do código

### Objetivos Secundários
7. ⚪ Implementar testes unitários (Vitest + RTL)
8. ⚪ Adicionar Storybook para componentes
9. ⚪ Documentar componentes com TSDoc
10. ⚪ Melhorar performance com memoization

---

## 🏗️ Arquitetura Alvo (Feature-Sliced Design)

### Estrutura de Diretórios Proposta

```
services/frontend/src/
├── app/                           # ✅ Configuração global
│   ├── providers/
│   │   ├── QueryProvider.tsx     # TanStack Query
│   │   ├── ThemeProvider.tsx     # MUI Theme
│   │   └── AuthProvider.tsx      # Autenticação
│   └── App.tsx
│
├── pages/                         # 🔄 Páginas (orquestradores)
│   ├── Dashboard/
│   │   └── index.tsx             # < 150 linhas
│   ├── Clientes/
│   │   ├── index.tsx             # Orquestrador (100 linhas)
│   │   ├── components/
│   │   │   ├── ClientesTableView.tsx
│   │   │   ├── ClientesGridView.tsx
│   │   │   └── ClienteFormModal.tsx
│   │   └── hooks/
│   │       └── useClientes.ts
│   ├── ONUConfiguration/
│   │   ├── index.tsx             # Orquestrador (150 linhas)
│   │   ├── components/
│   │   │   ├── ONUGeneralTab.tsx
│   │   │   ├── ONUWiFiTab.tsx
│   │   │   ├── ONULanDhcpTab.tsx
│   │   │   ├── ONUHostsTab.tsx
│   │   │   ├── ONULanPortsTab.tsx
│   │   │   ├── ONUDeviceLogsTab.tsx
│   │   │   ├── ONUTroubleshootingTab.tsx
│   │   │   └── ONUSecurityTab.tsx
│   │   └── hooks/
│   │       ├── useONUConfiguration.ts
│   │       └── useONUTabs.ts
│   └── ... (outras páginas)
│
├── features/                      # 🔄 Features de negócio
│   ├── customer/
│   │   ├── api/
│   │   │   └── useCustomers.ts   # React Query hooks
│   │   ├── ui/
│   │   │   ├── CustomerHistoryModal.tsx
│   │   │   └── CustomerStatusBadge.tsx
│   │   └── model/
│   │       └── customerTypes.ts
│   ├── monitoring/
│   │   ├── api/
│   │   │   └── useMonitoring.ts
│   │   └── ui/
│   │       ├── NetworkStatsCards.tsx
│   │       ├── BandwidthAreaChart.tsx
│   │       └── OLTPerformanceChart.tsx
│   └── onu-provisioning/
│       ├── api/
│       │   ├── useProvisionONU.ts
│       │   └── useRejectONU.ts
│       └── ui/
│           └── ProvisioningWizard.tsx
│
├── entities/                      # ✅ Entidades de domínio
│   ├── customer/
│   │   ├── api/
│   │   │   ├── useCustomers.ts
│   │   │   └── mappers.ts
│   │   ├── ui/
│   │   │   └── CustomerCard.tsx
│   │   └── model/
│   │       └── types.ts
│   ├── device/
│   │   ├── api/
│   │   ├── ui/
│   │   └── model/
│   ├── onu/
│   │   ├── api/
│   │   │   ├── usePendingONUs.ts
│   │   │   ├── useProvisionedONUs.ts
│   │   │   └── mappers.ts
│   │   ├── ui/
│   │   │   ├── ONUCard.tsx
│   │   │   └── ONUStatusBadge.tsx
│   │   └── model/
│   │       └── types.ts
│   └── olt/
│       ├── api/
│       ├── ui/
│       └── model/
│
├── shared/                        # ✅ Código compartilhado
│   ├── api/
│   │   ├── client.ts             # HttpClient base
│   │   ├── endpoints.ts          # Constantes
│   │   ├── types.ts              # Tipos de API
│   │   └── services/
│   │       ├── devices.service.ts
│   │       ├── dashboard.service.ts
│   │       └── provisioning.service.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── FormField/
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── FormField.test.tsx
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   └── DataTable.test.tsx
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Button/
│   │   │   └── ... (outros)
│   │   ├── layouts/
│   │   └── authentication/
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useQuery.ts
│   │   │   ├── useMutation.ts
│   │   │   └── useApiClient.ts
│   │   ├── utils/
│   │   └── contexts/
│   └── config/
│
├── __fakeData__/                  # ✅ Mantido conforme está
│   ├── fakeApiSimulator.ts
│   └── data/
│
└── routes/                        # ✅ Mantido conforme está
    └── index.tsx
```

---

## 📋 Plano de Execução (7 Fases)

### **Fase 1: Preparação e Setup** ⏱️ 1 dia
**Prioridade**: P0 - Urgente

#### Tarefas:
1. ✅ Criar branch `feature/frontend-refactor`
2. ✅ Instalar dependências necessárias:
   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   npm install zod react-hook-form @hookform/resolvers
   ```
3. ✅ Criar estrutura de diretórios base
4. ✅ Configurar TanStack Query no `App.tsx`
5. ✅ Criar documentação de convenções de código

#### Entregáveis:
- Estrutura de diretórios criada
- QueryClient configurado
- Documento de convenções

---

### **Fase 2: Criar Biblioteca Shared/UI** ⏱️ 2-3 dias
**Prioridade**: P0 - Urgente (necessário para outras fases)

#### Componentes a Criar:

##### **FormField** (shared/ui/components/FormField/)
```typescript
// FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'password' | 'email';
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}
```

##### **DataTable** (shared/ui/components/DataTable/)
```typescript
// DataTable.tsx
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  sortable?: boolean;
}
```

##### **Modal** (shared/ui/components/Modal/)
```typescript
// Modal.tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

##### **Card** (shared/ui/components/Card/)
##### **Button** (shared/ui/components/Button/)
##### **StatusBadge** (shared/ui/components/StatusBadge/)
##### **SearchBar** (shared/ui/components/SearchBar/)
##### **LoadingSpinner** (shared/ui/components/LoadingSpinner/)

#### Entregáveis:
- 8 componentes reutilizáveis testados
- Documentação de cada componente
- Storybook stories (opcional)

---

### **Fase 3: Implementar TanStack Query** ⏱️ 2-3 dias
**Prioridade**: P0 - Urgente

#### Tarefas:

##### 3.1. Configurar QueryClient
```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

##### 3.2. Criar Hooks de API (entities/onu/api/)

**usePendingONUs.ts**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fakeDataService } from '@__fakeData__';

export const usePendingONUs = () => {
  return useQuery({
    queryKey: ['pending-onus'],
    queryFn: () => fakeDataService.getPendingONUs(),
    staleTime: 30000, // 30 segundos
  });
};
```

**useProvisionONU.ts**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fakeDataService } from '@__fakeData__';

export const useProvisionONU = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ onuId, clientData }) =>
      fakeDataService.authorizeONU(onuId, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-onus']);
      queryClient.invalidateQueries(['provisioned-onus']);
    },
  });
};
```

##### 3.3. Criar hooks para todas as entidades:
- **entities/onu/api/**:
  - `usePendingONUs.ts`
  - `useProvisionedONUs.ts`
  - `useProvisionONU.ts` (mutation)
  - `useRejectONU.ts` (mutation)
  - `useONUById.ts`

- **entities/device/api/**:
  - `useDevices.ts`
  - `useCPEs.ts`
  - `useOLTs.ts`

- **entities/customer/api/**:
  - `useCustomers.ts`
  - `useCustomerById.ts`

- **features/monitoring/api/**:
  - `useDashboardMetrics.ts`
  - `useAlerts.ts`
  - `useBandwidthStats.ts`

##### 3.4. Remover ProvisioningContext.tsx
- Migrar todos os componentes que usam o context
- Remover arquivo `ProvisioningContext.tsx`
- Atualizar imports

#### Entregáveis:
- QueryClient configurado
- 15+ hooks de React Query criados
- ProvisioningContext removido
- Performance melhorada com cache

---

### **Fase 4: Refatorar ONUConfiguration.tsx** ⏱️ 3-4 dias
**Prioridade**: P0 - Crítico (3.608 linhas!)

#### Estrutura Final:
```
pages/ONUConfiguration/
├── index.tsx                        # Orquestrador (150 linhas)
├── components/
│   ├── ONUGeneralTab.tsx            # ~250 linhas
│   ├── ONUWiFiTab/
│   │   ├── index.tsx                # ~200 linhas
│   │   ├── WiFiNetworkCard.tsx      # ~150 linhas
│   │   └── WiFiForm.tsx             # ~200 linhas (com React Hook Form)
│   ├── ONULanDhcpTab.tsx            # ~250 linhas
│   ├── ONUHostsTab.tsx              # ~200 linhas
│   ├── ONULanPortsTab.tsx           # ~150 linhas
│   ├── ONUDeviceLogsTab.tsx         # ~200 linhas
│   ├── ONUTroubleshootingTab.tsx    # ~250 linhas
│   └── ONUSecurityTab.tsx           # ~300 linhas
├── hooks/
│   ├── useONUConfiguration.ts       # Estado e lógica (200 linhas)
│   └── useONUTabs.ts                # Navegação de tabs
└── schemas/
    ├── wifiSchema.ts                # Validação Zod para WiFi
    ├── lanDhcpSchema.ts             # Validação Zod para LAN DHCP
    └── securitySchema.ts            # Validação Zod para Security
```

#### Exemplo de Implementação:

**index.tsx** (Orquestrador):
```typescript
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';
import { useONUConfiguration } from './hooks/useONUConfiguration';
import { ONUGeneralTab } from './components/ONUGeneralTab';
import { ONUWiFiTab } from './components/ONUWiFiTab';
// ... outros imports

const ONUConfiguration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState(0);
  const { onuDetails, loading } = useONUConfiguration(id);

  if (loading) return <LoadingSpinner />;
  if (!onuDetails) return <NotFound />;

  return (
    <Box>
      <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
        <Tab label="Geral" />
        <Tab label="WiFi" />
        <Tab label="LAN DHCP" />
        {/* ... outros tabs */}
      </Tabs>

      {selectedTab === 0 && <ONUGeneralTab onuId={id} />}
      {selectedTab === 1 && <ONUWiFiTab onuId={id} />}
      {selectedTab === 2 && <ONULanDhcpTab onuId={id} />}
      {/* ... outros tabs */}
    </Box>
  );
};

export default ONUConfiguration;
```

**hooks/useONUConfiguration.ts**:
```typescript
import { useState, useEffect } from 'react';
import { useProvisionedONUs } from '@entities/onu/api';

export const useONUConfiguration = (onuId: string) => {
  const { data: onus, isLoading } = useProvisionedONUs();
  const [onuDetails, setOnuDetails] = useState(null);

  useEffect(() => {
    if (onus) {
      const onu = onus.find(o => o.id === onuId);
      setOnuDetails(onu);
    }
  }, [onus, onuId]);

  return {
    onuDetails,
    loading: isLoading,
  };
};
```

**components/ONUWiFiTab/index.tsx**:
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wifiSchema } from '../../schemas/wifiSchema';
import { WiFiNetworkCard } from './WiFiNetworkCard';
import { useUpdateWiFi } from '@entities/onu/api';

export const ONUWiFiTab = ({ onuId }) => {
  const { data: wifiConfig, isLoading } = useWiFiConfig(onuId);
  const updateWiFi = useUpdateWiFi();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(wifiSchema),
    defaultValues: wifiConfig,
  });

  const onSubmit = (data) => {
    updateWiFi.mutate({ onuId, data });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <WiFiNetworkCard
        control={control}
        network="wlan1"
        title="WiFi 2.4GHz"
      />
      <WiFiNetworkCard
        control={control}
        network="wlan2"
        title="WiFi 5GHz"
      />
      <Button type="submit">Salvar</Button>
    </form>
  );
};
```

**schemas/wifiSchema.ts**:
```typescript
import { z } from 'zod';

export const wifiSchema = z.object({
  wlan1: z.object({
    ssid: z.string().min(1, 'SSID obrigatório').max(32),
    password: z.string().min(8, 'Senha mínima de 8 caracteres'),
    enabled: z.boolean(),
    channel: z.number().min(1).max(11),
    // ... outros campos
  }),
  wlan2: z.object({
    // ... mesma estrutura
  }),
});
```

#### Entregáveis:
- ONUConfiguration.tsx reduzido de 3.608 para ~150 linhas
- 8 componentes de tab independentes
- React Hook Form + Zod implementados
- Código testável e manutenível

---

### **Fase 5: Refatorar Clientes.tsx** ⏱️ 2-3 dias
**Prioridade**: P0 - Crítico (1.476 linhas)

#### Estrutura Final:
```
pages/Clientes/
├── index.tsx                      # Orquestrador (100 linhas)
├── components/
│   ├── ClientesTableView.tsx      # ~300 linhas
│   ├── ClientesGridView.tsx       # ~250 linhas
│   ├── ClienteFormModal.tsx       # ~250 linhas
│   ├── ClienteFilters.tsx         # ~150 linhas
│   └── ClienteSearchBar.tsx       # ~80 linhas
└── hooks/
    ├── useClientes.ts             # Lógica de negócio (150 linhas)
    └── useClienteModal.ts         # Lógica do modal
```

#### Exemplo de Implementação:

**index.tsx**:
```typescript
import React, { useState } from 'react';
import { Box, Button, ToggleButtonGroup } from '@mui/material';
import { ClientesTableView } from './components/ClientesTableView';
import { ClientesGridView } from './components/ClientesGridView';
import { ClienteFormModal } from './components/ClienteFormModal';
import { useClientes } from './hooks/useClientes';

const Clientes: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { clientes, loading, searchValue, setSearchValue } = useClientes();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <SearchBar value={searchValue} onChange={setSearchValue} />
        <ToggleButtonGroup value={viewMode} onChange={setViewMode}>
          <ToggleButton value="grid">Grid</ToggleButton>
          <ToggleButton value="table">Tabela</ToggleButton>
        </ToggleButtonGroup>
        <Button onClick={() => setModalOpen(true)}>Novo Cliente</Button>
      </Box>

      {viewMode === 'grid' ? (
        <ClientesGridView clientes={clientes} loading={loading} />
      ) : (
        <ClientesTableView clientes={clientes} loading={loading} />
      )}

      <ClienteFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Box>
  );
};
```

**hooks/useClientes.ts**:
```typescript
import { useState, useMemo } from 'react';
import { useProvisionedONUs } from '@entities/onu/api';

export const useClientes = () => {
  const { data: onus, isLoading } = useProvisionedONUs();
  const [searchValue, setSearchValue] = useState('');

  const clientes = useMemo(() => {
    if (!onus) return [];

    return onus
      .filter(onu =>
        onu.clientName.toLowerCase().includes(searchValue.toLowerCase()) ||
        onu.serialNumber.includes(searchValue)
      )
      .map(onu => ({
        id: onu.id,
        name: onu.clientName,
        serialNumber: onu.serialNumber,
        status: onu.status,
        oltName: onu.oltName,
        // ... outros campos
      }));
  }, [onus, searchValue]);

  return {
    clientes,
    loading: isLoading,
    searchValue,
    setSearchValue,
  };
};
```

#### Entregáveis:
- Clientes.tsx reduzido de 1.476 para ~100 linhas
- 5 componentes independentes
- Lógica de negócio separada da apresentação
- Duas visualizações (grid/table) em arquivos separados

---

### **Fase 6: Refatorar DashboardClientes.tsx e DashboardOLTs.tsx** ⏱️ 2 dias
**Prioridade**: P1 - Alta

#### Tarefas Similares para Ambos:
1. Extrair gráficos em componentes separados
2. Criar hooks customizados para lógica de negócio
3. Usar componentes shared/ui
4. Implementar React Query para dados

#### Entregáveis:
- DashboardClientes.tsx reduzido de 715 para ~200 linhas
- DashboardOLTs.tsx reduzido de 707 para ~200 linhas

---

### **Fase 7: Melhorar Tipagens** ⏱️ 2 dias
**Prioridade**: P2 - Normal

#### Tarefas:

##### 7.1. Criar DTOs
```typescript
// shared/api/types.ts

export interface PendingONUDTO {
  id: string;
  serial_number: string;
  olt_name: string;
  board: number;
  port: number;
  discovered_at: string;
  distance: number;
  onu_type: string;
  status: string;
  rx_power: number;
  temperature: number;
}

export interface ProvisionedONUDTO {
  id: string;
  serial_number: string;
  customer_name: string;
  customer_address: string;
  olt_id: string;
  status: 'online' | 'offline';
  created_at: string;
  // ... outros campos
}
```

##### 7.2. Criar Mappers
```typescript
// entities/onu/api/mappers.ts

export const mapPendingONUFromDTO = (dto: PendingONUDTO): PendingONU => ({
  id: dto.id,
  serialNumber: dto.serial_number,
  oltName: dto.olt_name,
  board: dto.board,
  port: dto.port,
  discoveredAt: new Date(dto.discovered_at),
  distance: dto.distance,
  onuType: dto.onu_type,
  status: dto.status as ONUStatus,
  rxPower: dto.rx_power,
  temperature: dto.temperature,
});
```

##### 7.3. Atualizar fakeApiSimulator.ts
- Adicionar tipos de retorno explícitos
- Eliminar `any` e `Record<string, unknown>`

##### 7.4. Ativar TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

#### Entregáveis:
- DTOs criados para todas as entidades
- Mappers implementados
- 100% type safety
- Strict mode ativado

---

## 🧪 Estratégia de Testes (Opcional - Fase Futura)

### Ferramentas
- **Vitest**: Test runner
- **React Testing Library**: Testes de componentes
- **MSW (Mock Service Worker)**: Mock de APIs

### Cobertura Mínima
- Componentes shared/ui: 80%
- Hooks customizados: 90%
- Páginas principais: 60%

### Exemplo de Teste:
```typescript
// shared/ui/components/FormField/FormField.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders label correctly', () => {
    render(<FormField label="Nome" name="name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<FormField label="Nome" name="name" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Nome');
    fireEvent.change(input, { target: { value: 'Teste' } });

    expect(handleChange).toHaveBeenCalledWith('Teste');
  });

  it('shows error message when provided', () => {
    render(
      <FormField
        label="Nome"
        name="name"
        value=""
        onChange={() => {}}
        error="Campo obrigatório"
      />
    );
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });
});
```

---

## 📝 Convenções de Código

### Nomenclatura

#### Componentes
- **PascalCase**: `CustomerCard.tsx`, `ONUWiFiTab.tsx`
- **Sufixos**:
  - Pages: `Clientes`, `Dashboard`
  - Components: `CustomerCard`, `FormField`
  - Modals: `ClienteFormModal`
  - Tabs: `ONUWiFiTab`

#### Hooks
- **camelCase** com prefixo `use`: `useClientes`, `useONUConfiguration`
- Queries: `usePendingONUs`, `useDashboardMetrics`
- Mutations: `useProvisionONU`, `useUpdateWiFi`

#### Tipos e Interfaces
- **PascalCase**: `Customer`, `PendingONU`, `DashboardMetrics`
- DTOs: Sufixo `DTO` - `PendingONUDTO`
- Props: Sufixo `Props` - `FormFieldProps`

#### Arquivos
- Componentes: `CustomerCard.tsx`
- Hooks: `useCustomers.ts`
- Tipos: `types.ts`
- Mappers: `mappers.ts`
- Schemas (Zod): `wifiSchema.ts`
- Testes: `CustomerCard.test.tsx`

### Estrutura de Componente

```typescript
// 1. Imports externos
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

// 2. Imports internos (shared)
import { FormField } from '@shared/ui/components/FormField';
import { useToast } from '@shared/lib/hooks';

// 3. Imports de features/entities
import { useCustomers } from '@entities/customer/api';

// 4. Tipos e Interfaces
interface CustomerCardProps {
  customerId: string;
  onEdit?: (id: string) => void;
  variant?: 'compact' | 'detailed';
}

// 5. Constantes locais
const DEFAULT_VARIANT = 'detailed';

// 6. Componente principal
export const CustomerCard: React.FC<CustomerCardProps> = ({
  customerId,
  onEdit,
  variant = DEFAULT_VARIANT,
}) => {
  // 6.1. Hooks de estado
  const [expanded, setExpanded] = useState(false);

  // 6.2. Hooks de API
  const { data: customer, isLoading } = useCustomerById(customerId);

  // 6.3. Hooks customizados
  const { showToast } = useToast();

  // 6.4. useEffect
  useEffect(() => {
    // lógica
  }, [customerId]);

  // 6.5. Handlers
  const handleEdit = () => {
    onEdit?.(customerId);
  };

  // 6.6. Early returns
  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <NotFound />;

  // 6.7. Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};

// 7. Exports nomeados (se necessário)
export type { CustomerCardProps };
```

### Regras de Importação

```typescript
// Ordem de imports:
// 1. React e bibliotecas externas
import React, { useState } from 'react';
import { Box, Button } from '@mui/material';

// 2. Shared (alias @shared)
import { FormField } from '@shared/ui/components/FormField';
import { useToast } from '@shared/lib/hooks';

// 3. Features (alias @features)
import { useMonitoring } from '@features/monitoring/api';

// 4. Entities (alias @entities)
import { useCustomers } from '@entities/customer/api';
import type { Customer } from '@entities/customer/model/types';

// 5. Fake Data (alias @__fakeData__)
import { fakeDataService } from '@__fakeData__';

// 6. Imports relativos
import { CustomerCard } from './CustomerCard';
import { useCustomerModal } from '../hooks/useCustomerModal';
```

### Regras de Componentes

#### ✅ Boas Práticas:
- **< 300 linhas** por arquivo
- **Props interface** sempre definida
- **PropTypes ou TypeScript** para validação
- **Memoização** quando necessário (`React.memo`)
- **Callbacks memoizados** em listas (`useCallback`)
- **useEffect** apenas quando necessário
- **Destructuring** de props
- **Early returns** para loading e error states

#### ❌ Evitar:
- Componentes > 300 linhas
- Lógica de negócio no componente
- Estados globais desnecessários
- Props drilling excessivo (> 3 níveis)
- Inline functions em loops
- useEffect sem array de dependências
- `any` ou `Record<string, unknown>`

---

## 🎯 Checklist de Qualidade

### Para Cada Componente:
- [ ] Menos de 300 linhas
- [ ] Props interface definida
- [ ] TypeScript strict mode compatível
- [ ] Sem `any` ou `unknown`
- [ ] Loading e error states tratados
- [ ] Acessibilidade (aria-labels, semantic HTML)
- [ ] Responsivo (mobile-first)
- [ ] Testes unitários (quando aplicável)
- [ ] Documentação JSDoc (para componentes shared)

### Para Cada Hook:
- [ ] Nomenclatura `use*`
- [ ] Retorno tipado
- [ ] Documentação de parâmetros
- [ ] Tratamento de erros
- [ ] Memoização quando necessário
- [ ] Testes unitários

### Para Cada Página:
- [ ] < 200 linhas (apenas orquestração)
- [ ] Usa hooks customizados para lógica
- [ ] Usa componentes shared/ui
- [ ] Lazy loading implementado
- [ ] SEO (title, meta tags)
- [ ] Loading states
- [ ] Error boundaries

---

## 📊 Métricas de Sucesso

### Antes da Refatoração:
- ❌ ONUConfiguration.tsx: 3.608 linhas
- ❌ Clientes.tsx: 1.476 linhas
- ❌ 0 testes unitários
- ❌ Type safety: ~60%
- ❌ Componentes reutilizáveis: 5
- ❌ Context API com 268 linhas

### Após Refatoração (Meta):
- ✅ ONUConfiguration/index.tsx: ~150 linhas
- ✅ Clientes/index.tsx: ~100 linhas
- ✅ 50+ testes unitários
- ✅ Type safety: 100%
- ✅ Componentes reutilizáveis: 20+
- ✅ TanStack Query (cache automático)

### KPIs:
- **Redução de código**: -40%
- **Componentes reutilizáveis**: +300%
- **Cobertura de testes**: 0% → 70%
- **Type safety**: 60% → 100%
- **Performance**: +25% (cache do React Query)
- **Manutenibilidade**: +60% (componentes pequenos)

---

## 🚀 Cronograma

| Fase | Duração | Sprint | Status |
|------|---------|--------|--------|
| 1. Setup | 1 dia | Sprint 1 | 📋 Planejado |
| 2. Shared/UI | 2-3 dias | Sprint 1 | 📋 Planejado |
| 3. TanStack Query | 2-3 dias | Sprint 2 | 📋 Planejado |
| 4. ONUConfiguration | 3-4 dias | Sprint 2-3 | 📋 Planejado |
| 5. Clientes | 2-3 dias | Sprint 3 | 📋 Planejado |
| 6. Dashboards | 2 dias | Sprint 4 | 📋 Planejado |
| 7. Tipagens | 2 dias | Sprint 4 | 📋 Planejado |
| **TOTAL** | **14-18 dias** | **~4 Sprints** | |

---

## 📚 Recursos e Referências

### Documentação Oficial:
- [Feature-Sliced Design](https://feature-sliced.design/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Material-UI](https://mui.com/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

### Artigos Importantes:
- [Clean Code React](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices 2024](https://www.robinwieruch.de/react-best-practices/)
- [Component Composition](https://kentcdodds.com/blog/compound-components-with-react-hooks)

### Ferramentas:
- **ESLint**: Linting
- **Prettier**: Formatação
- **TypeScript**: Type checking
- **Vite**: Build tool
- **React DevTools**: Debug
- **React Query DevTools**: Cache inspection

---

## 💡 Notas Finais

### Princípios a Seguir:
1. **KISS**: Keep It Simple, Stupid
2. **DRY**: Don't Repeat Yourself
3. **SOLID**: Especialmente SRP (Single Responsibility)
4. **YAGNI**: You Aren't Gonna Need It
5. **Composition over Inheritance**

### Lembretes:
- ⚠️ **Não** remover `__fakeData__/` - mantemos a fake API
- ⚠️ **Sempre** testar localmente antes de commit
- ⚠️ **Commits pequenos** e frequentes
- ⚠️ **Code review** obrigatório antes de merge
- ⚠️ **Documentar** mudanças significativas

### Próximos Passos Após Refatoração:
1. Implementar testes E2E com Playwright
2. Adicionar Storybook para componentes
3. Implementar CI/CD com GitHub Actions
4. Configurar análise de bundle size
5. Adicionar documentação com Docusaurus

---

**Última atualização**: 2025-11-18
**Responsável**: Time de Frontend
**Branch**: `feature/frontend-refactor`
