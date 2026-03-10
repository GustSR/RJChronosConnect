# Design: Refatoracao ONUConfiguration.tsx

## Objetivo

Refatorar o componente monolitico ONUConfiguration.tsx (555 linhas) em componentes menores, hooks customizados e paineis padronizados, seguindo FSD.

## Decisoes

- **Foco:** Estrutura e componentizacao (sem integracao API nesta fase)
- **State management:** Hooks customizados por painel (nao Context)
- **Mock data:** Consolidar em mockData.ts centralizado, controlado por VITE_USE_MOCK

## Arquitetura

3 camadas:

1. **Pagina** (ONUConfiguration.tsx) — Layout e composicao. ~80 linhas.
2. **Hooks** — Um hook por dominio (useONUDetails, useLanDhcpConfig, useWifiConfig, useSecurityConfig). Encapsulam estado, dirty tracking e save.
3. **Paineis** — Recebem dados e handlers do seu hook. Sem prop drilling.

## Estrutura de arquivos

```
features/onu-configuration/
├── index.ts
├── types.ts (sem mudancas)
├── defaults.ts (sem mudancas)
├── menuItems.ts (sem mudancas)
├── mockData.ts (consolidar TODOS os mocks, controlado por VITE_USE_MOCK)
├── hooks/
│   ├── index.ts
│   ├── useONUDetails.ts      (carregamento + transformacao, sem delay artificial)
│   ├── useLanDhcpConfig.ts   (estado + dirty tracking + save)
│   ├── useWifiConfig.ts      (estado + dirty tracking + save por rede)
│   └── useSecurityConfig.ts  (estado + dirty tracking + save)
├── ui/
│   ├── index.ts
│   ├── ONUConfigHeader.tsx    (extraido do topo)
│   ├── ONUConfigMenu.tsx      (menu lateral com selecao)
│   ├── ONUConfigContent.tsx   (switch de paineis, consome hooks)
│   ├── WanTr069Panel.tsx (revisado)
│   ├── modals/ (sem mudancas)
│   └── panels/ (revisados: cores do theme, mocks centralizados)
```

## Fluxo de dados

```
ONUConfiguration (pagina)
  ├── useONUDetails(id) → onuDetails, loading
  ├── ONUConfigHeader (recebe onuDetails)
  ├── ONUConfigMenu (recebe selectedItem, onSelect)
  └── ONUConfigContent (recebe selectedItem, onuDetails)
        ├── GeneralPanel ← dados de onuDetails
        ├── LanDhcpPanel ← useLanDhcpConfig()
        ├── WifiPanel ← useWifiConfig()
        ├── SecurityPanel ← useSecurityConfig()
        └── demais paineis ← props diretas de onuDetails
```

## Mudancas nos paineis

- Cores hardcoded (#e0e0e0, #f5f5f5) → theme.palette
- Mock data inline → importar de mockData.ts (flag VITE_USE_MOCK)
- Props vindas do hook, nao do componente pai
- Interface de props padronizada

## O que NAO muda

- Tipos (types.ts), defaults (defaults.ts), menu items (menuItems.ts)
- Modal de historico (ja isolado)
- Nenhuma funcionalidade removida
