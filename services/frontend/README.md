# RJChronosConnect - Frontend

[![CI](https://github.com/Gustavo-RJ/RJChronosConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/Gustavo-RJ/RJChronosConnect/actions/workflows/ci.yml)

## 1. Visão Geral

Este é o projeto do frontend para a plataforma **RJChronosConnect**. O objetivo é criar uma interface de usuário moderna, reativa e intuitiva para monitoramento e gestão de redes, consumindo os dados fornecidos pelo nosso [backend em FastAPI](./../backend-api/README.md).

---

## 2. Estado Atual do Projeto

**Desenvolvimento Ativo**

O projeto já possui sua fundação de UI implementada a partir do template **Berry (Material-UI)**. A estrutura de pastas está populada com dezenas de componentes, hooks e páginas, e as principais dependências de UI, gráficos e gerenciamento de estado estão instaladas e salvas no `package.json`.

O foco atual é conectar os componentes existentes à API real do backend e refinar as funcionalidades.

---

## 3. Estrutura de Pastas

A estrutura de pastas foi pensada para organizar o código de forma lógica e escalável.

```
src/
├── components/         # Componentes React reutilizáveis.
│   ├── common/         # Componentes genéricos (botões, modais, etc.).
│   ├── layout/         # Componentes de estrutura (Sidebar, Header, Footer).
│   └── ui/             # Componentes de UI base (ex: Berry/MUI).
├── hooks/              # Hooks customizados para lógica compartilhada (ex: useApi, useAuth).
├── lib/                # Utilitários, instâncias de clientes (axios, queryClient) e configs.
├── pages/              # Componentes que representam as páginas completas da aplicação.
├── services/           # Funções para realizar chamadas à API backend.
├── theme/              # Configurações de tema (cores, fontes, etc.).
├── types/              # Definições de tipos e interfaces TypeScript globais.
├── App.tsx             # Componente raiz da aplicação.
└── main.tsx            # Ponto de entrada da aplicação no DOM.
```

---

## 4. Tecnologias

### Stack Principal

-   **Framework:** React 18 + TypeScript
-   **Build Tool:** Vite
-   **UI Framework:** Material-UI (MUI)
-   **Template Base:** [Berry - React Material Admin (Free)](https://mui.com/store/items/berry-react-material-admin-free/)
-   **Gerenciamento de Estado/Cache:** React Query (TanStack Query)
-   **Roteamento:** React Router

---

## 5. Como Executar Localmente

O ambiente de desenvolvimento é gerenciado via Docker. Para instruções, consulte o guia principal do projeto:

**[>> Guia do Ambiente de Desenvolvimento <<](../../DEVELOPMENT.md)**

---

## 6. Roadmap de Desenvolvimento

-   [x] **Fase 1: Fundação e UI**
    -   [x] Inicializar projeto com Vite + React + TS.
    -   [x] Definir a arquitetura e estrutura de pastas.
    -   [x] Integrar o template Berry MUI e seus componentes.
    -   [x] Configurar React Query, React Router e outras dependências principais.
    -   [x] Corrigir e declarar todas as dependências no `package.json`.

-   [ ] **Fase 2: Conexão com Backend e Funcionalidades**
    -   [ ] Substituir dados mock por chamadas reais à API para o Dashboard.
    -   [ ] Conectar a página de Inventário de CPEs à API.
    -   [ ] Implementar a lógica de busca e filtros do inventário com o backend.
    -   [ ] Desenvolver a funcionalidade de atualização de Wi-Fi na interface, conectada à API.
    -   [ ] Conectar a página de Alertas aos dados da API.

-   [ ] **Fase 3: Funcionalidades Avançadas e Polimento**
    -   [ ] Implementar o fluxo de autenticação de usuário com JWT.
    -   [ ] Adicionar atualizações em tempo real com WebSockets.
    -   [ ] Aumentar a cobertura de testes (unitários e de integração).