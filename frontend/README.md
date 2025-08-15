# RJChronos Frontend MVP

Sistema completo de gestão e monitoramento de equipamentos CPE e OLT - Frontend MVP

## 🚀 Funcionalidades Implementadas

### Dashboard Principal
- ✅ Visão geral com métricas em tempo real
- ✅ Total de dispositivos online/offline
- ✅ Alertas críticos em aberto
- ✅ Taxa de falhas nas últimas 24h
- ✅ SNR médio, latência e SLA
- ✅ Matriz de sinais ópticos
- ✅ IA Insights com previsões e anomalias

### Inventário Completo
- ✅ **CPEs**: Customer Premise Equipment
- ✅ **ONUs**: Optical Network Units  
- ✅ **OLTs**: Optical Line Terminals
- ✅ Filtros avançados e busca
- ✅ Status em tempo real
- ✅ Detalhes técnicos de cada dispositivo

### Monitoramento
- ✅ Tempo real com gráficos interativos
- ✅ Histórico de métricas
- ✅ Performance de rede por região
- ✅ Saúde dos CPEs e ONUs

### Sistema de Alertas
- ✅ Gerenciamento completo de alertas
- ✅ Classificação por severidade
- ✅ Reconhecimento e resolução
- ✅ Histórico de eventos
- ✅ Regras configuráveis

### Provisionamento Zero-Touch
- ✅ Configuração automática de dispositivos
- ✅ Perfis de configuração
- ✅ Firmware Manager com agendamento
- ✅ Templates de provisionamento
- ✅ Rollback automático

### Diagnósticos Remotos
- ✅ Ping, traceroute, testes de velocidade
- ✅ Análise de sinal óptico
- ✅ Testes de conectividade
- ✅ Relatórios automáticos

### IA & Automação
- ✅ Regras de automação configuráveis
- ✅ Detecção de anomalias
- ✅ Previsão de falhas
- ✅ Ações automáticas (reboot, configuração)
- ✅ Insights preditivos

### Relatórios e SLA
- ✅ KPIs de rede
- ✅ Qualidade de serviço
- ✅ SLA por cliente
- ✅ Relatórios PDF/Excel
- ✅ Dashboards customizáveis

### Funcionalidades Avançadas
- ✅ **Topologia Visual**: Visualização interativa da rede (OLT → PON → ONU → CPE)
- ✅ **Georreferenciamento**: Mapa com status por localização
- ✅ **Configuração Wi-Fi Remota**: SSID, senha, canal, segurança
- ✅ **Sistema de Usuários**: Permissões e controle de acesso
- ✅ **Integrações**: API/Webhook, configurações de sistema

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Radix UI + Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS + CSS Variables

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Verificar tipos TypeScript
npm run check
```

### Estrutura do Projeto
```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (Radix UI)
│   │   ├── layout/         # Layout (Header, Sidebar)
│   │   └── dashboard/      # Componentes específicos do dashboard
│   ├── pages/              # Páginas da aplicação
│   │   ├── inventory/      # Inventário (CPEs, ONUs, OLTs)
│   │   └── ...            # Outras páginas
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   └── styles/             # Estilos globais
├── public/                 # Assets estáticos
└── index.html             # HTML principal
```

## 🎨 Design System

### Cores Principais
- **Primary**: Azul (#3B82F6)
- **Success**: Verde (#10B981) 
- **Warning**: Amarelo (#F59E0B)
- **Error**: Vermelho (#EF4444)
- **Info**: Ciano (#06B6D4)

### Tema Dark
Interface otimizada para operação 24/7 com tema escuro por padrão.

## 📊 Dados Mock

Todos os dados são mockados para demonstração:
- 50+ CPEs simulados
- 20+ ONUs simulados  
- 5+ OLTs simulados
- Alertas em tempo real
- Métricas de performance
- Histórico de eventos
- Insights de IA

## 🔮 Próximos Passos (Backend Integration)

1. **Backend Python**: FastAPI + PostgreSQL + TimescaleDB
2. **ACS Server**: GenieACS para comunicação TR-069
3. **SmartOLT**: Integração com OLTs GPON/EPON
4. **Engine IA**: Modelos de ML para análise preditiva
5. **APIs REST**: Substituir dados mock por APIs reais
6. **WebSocket**: Atualizações em tempo real
7. **Autenticação**: JWT + OAuth2
8. **Monitoramento**: Prometheus + Grafana

## 📝 Licença

Proprietário - RJChronos System
