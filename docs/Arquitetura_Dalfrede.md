# 🏗️ RJChronosConnect — Arquitetura e Especificação Técnica

**Sistema Inteligente de Gerenciamento de Rede para ISPs**  
**Versão:** 2.0  
**Data:** 20 de Fevereiro de 2026  
**Autor:** RJSoluções

---

## Índice

1. [Sumário Executivo](#1-sumário-executivo)
2. [Análise Comparativa de Mercado](#2-análise-comparativa)
3. [Arquitetura do Sistema](#3-arquitetura)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Funcionalidades — Dashboard & Visão Geral](#5-dashboard)
6. [Funcionalidades — Gerenciamento de OLTs (Nível SmartOLT)](#6-olts)
7. [Funcionalidades — Gerenciamento de CPEs (Nível Anlix)](#7-cpes)
8. [Funcionalidades — Monitoramento & Alertas](#8-monitoramento)
9. [Funcionalidades — Inteligência Artificial](#9-ia)
10. [Funcionalidades — Relatórios & BI](#10-relatorios)
11. [Funcionalidades — Automação & Workflows](#11-automacao)
12. [Funcionalidades — Integrações & API](#12-integracoes)
13. [Funcionalidades — Inovações Exclusivas](#13-inovacoes)
14. [Sistema de Notificações Inteligentes](#14-notificacoes)
15. [Segurança](#15-seguranca)
16. [Roadmap de Implementação](#16-roadmap)

---

## 1. Sumário Executivo

Este documento apresenta a especificação técnica e arquitetural do **RJChronosConnect** — um Sistema de Gerenciamento de Rede de Próxima Geração para ISPs. A solução unifica:

- **Gerenciamento de OLTs** (todo o poder do SmartOLT)
- **Gerenciamento de CPEs/Wi-Fi** (todas as funcionalidades da Anlix/Flashbox)
- **Inteligência Artificial Preditiva** (inovação exclusiva — nenhum concorrente oferece)

O diferencial competitivo é a combinação das 3 camadas em uma única plataforma **Open Source**, eliminando custos em dólar por dispositivo e oferecendo funcionalidades que nenhum concorrente disponibiliza atualmente.

---

## 2. Análise Comparativa de Mercado

### Matriz Completa de Funcionalidades

| Funcionalidade | SmartOLT | Anlix/Flashbox | RJChronosConnect |
|---|:---:|:---:|:---:|
| **GESTÃO DE OLTs** | | | |
| Gerência OLT Huawei (MA5600T/MA5608T/MA5800/MA5801) | ✅ Nativo | ❌ | ✅ Nativo |
| Gerência OLT ZTE (C300/C320/C600/C610) | ✅ Nativo | ❌ | ✅ Nativo |
| Gerência OLT Datacom/FiberHome | ✅ Parcial | ❌ | ✅ Planejado |
| Provisionamento Zero-Touch de ONUs | ✅ | ❌ | ✅ |
| Monitoramento Rx/Tx Power por ONU | ✅ | ❌ | ✅ |
| Histórico de potência óptica (gráficos) | ✅ | ❌ | ✅ + Predição ML |
| Gestão de VLANs e Service Profiles | ✅ | ❌ | ✅ |
| Auto-discovery de ONUs não autorizadas | ✅ | ❌ | ✅ |
| Firmware ONU (upgrade/rollback) | ✅ | ✅ | ✅ + Rollback Inteligente |
| Mapa de localização por GPS/StreetView | ✅ | ✅ | ✅ + Heatmap de saúde |
| Multi-OLT management centralizado | ✅ | N/A | ✅ |
| **GESTÃO DE CPEs** | | | |
| TR-069 (CWMP) completo | Básico | ✅ Nativo | ✅ GenieACS |
| Configuração Wi-Fi remota (SSID/senha) | ❌ | ✅ | ✅ |
| Configuração WAN/PPPoE remota | ❌ | ✅ | ✅ |
| Mapa de calor Wi-Fi por CPE | ❌ | ✅ | ✅ |
| Diagnóstico Wi-Fi (interferência/canal) | ❌ | ✅ | ✅ + ML Optimizer |
| Teste de velocidade remoto (no CPE) | ❌ | ✅ | ✅ |
| Reboot/Reset remoto de CPE | Parcial | ✅ | ✅ |
| Listagem de dispositivos conectados ao CPE | ❌ | ✅ | ✅ |
| Configuração em massa (bulk) | ❌ | ✅ | ✅ |
| Perfis de configuração (templates) | ❌ | ✅ | ✅ |
| App para técnico de campo | ❌ | ✅ | ✅ PWA |
| Portal self-service para cliente final | ❌ | ✅ App | ✅ PWA White-Label |
| Wi-Fi Score por cliente | ❌ | ✅ | ✅ + Integrado com Churn |
| **DASHBOARD & ANALYTICS** | | | |
| Dashboard operacional NOC | ✅ | ✅ | ✅ + Customizável |
| Gráficos de séries temporais | ✅ Básico | ✅ Básico | ✅ TimescaleDB |
| Relatórios PDF/Excel/CSV | ✅ | ✅ | ✅ + Agendamento |
| Dashboard executivo com KPIs | ❌ | ❌ | ✅ |
| **IA & PREDIÇÃO** | | | |
| Detecção de anomalias automática | ❌ | ❌ | ✅ Isolation Forest |
| Predição de churn por cliente | ❌ | ❌ | ✅ Gradient Boosting |
| Previsão de degradação de sinal | ❌ | ❌ | ✅ LSTM |
| Diagnóstico automático por IA | ❌ | ❌ | ✅ Agent |
| Clusterização geográfica de falhas | ❌ | ❌ | ✅ |
| Network Weather Map™ | ❌ | ❌ | ✅ |
| Digital Twin de Rede | ❌ | ❌ | ✅ |
| ISP Copilot (chat IA) | ❌ | ❌ | ✅ |
| **INFRAESTRUTURA** | | | |
| SaaS (Cloud) | ✅ | ✅ | ✅ + Self-hosted |
| API REST pública | ✅ | ✅ | ✅ OpenAPI 3.1 |
| Webhooks | ✅ | ✅ | ✅ |
| Integração ERP (IXCSoft, SGP) | ✅ | ✅ | ✅ |
| Open Source | ❌ | ❌ | ✅ |
| Custo | USD/dispositivo | Recorrente | OPEX reduzido |

---

## 3. Arquitetura do Sistema

### 3.1 Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                 CAMADA DE APRESENTAÇÃO                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Dashboard │  │  Portal  │  │  App Técnico (PWA)   │  │
│  │   NOC     │  │ Cliente  │  │  + Telegram Bot      │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       └──────────────┴──────────────────┘               │
│                       │                                  │
├───────────────────────┼──────────────────────────────────┤
│              API GATEWAY (Nginx)                         │
│         TLS 1.3 + Rate Limiting + CORS                  │
├───────────────────────┼──────────────────────────────────┤
│                       │                                  │
│  ┌────────────────────┼─────────────────────────────┐   │
│  │           BACKEND API (FastAPI)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐  │   │
│  │  │  Auth   │ │ Devices │ │  Alerts  │ │ WiFi │  │   │
│  │  │ Router  │ │ Router  │ │  Router  │ │Router│  │   │
│  │  └────┬────┘ └────┬────┘ └────┬─────┘ └──┬───┘  │   │
│  │       └───────────┴───────────┴──────────┘       │   │
│  │                    │                              │   │
│  │           ┌────────┴────────┐                     │   │
│  │           │  Service Layer  │                     │   │
│  │           └────────┬────────┘                     │   │
│  │                    │                              │   │
│  │           ┌────────┴────────┐                     │   │
│  │           │ Repository Layer│                     │   │
│  │           └────────┬────────┘                     │   │
│  └────────────────────┼─────────────────────────────┘   │
│                       │                                  │
├───────────────────────┼──────────────────────────────────┤
│              CAMADA DE INTEGRAÇÃO                        │
│                       │                                  │
│  ┌──────────┐  ┌──────┴─────┐  ┌──────────────────┐    │
│  │ GenieACS │  │   SNMP/SSH │  │   Celery Workers  │    │
│  │(TR-069)  │  │  OLT Mgmt  │  │   (RabbitMQ)      │    │
│  │CWMP+NBI  │  │            │  │                    │    │
│  └──────────┘  └────────────┘  └──────────────────┘     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│              CAMADA DE DADOS                             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌──────────┐   │
│  │PostgreSQL│  │ MongoDB  │  │ Redis │  │TimescaleDB│   │
│  │ (App DB) │  │(GenieACS)│  │(Cache)│  │(Métricas) │   │
│  └──────────┘  └──────────┘  └───────┘  └──────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│              CAMADA DE INTELIGÊNCIA                      │
│                                                          │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Agente       │  │   Agente    │  │   Agente      │  │
│  │ Anomalias    │  │   Churn     │  │   Diagnóstico │  │
│  │(IsolForest)  │  │(GradBoost)  │  │  (Rules+ML)   │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Camada de Gerenciamento de Dispositivos

**GenieACS como motor TR-069:**
- Solução open source mais madura do mercado (v1.2.13)
- Scriptável via JavaScript (provisions e presets)
- Escalável para 50.000+ dispositivos com tuning adequado
- Opera invisível — nosso backend orquestra via API REST (NBI)

**SNMP/SSH para OLTs:**
- `pysnmp` para leitura de métricas (Rx/Tx, PON status, temperatura)
- `paramiko` para comandos de provisionamento via SSH/Telnet
- Drivers abstratos por fabricante (`HuaweiDriver`, `ZTEDriver`)

### 3.3 Sistema de Filas e Eventos

**RabbitMQ (Filas Transacionais):**
- Tarefas garantidas e ordenadas: reboot, provisionamento, firmware update
- Filas prioritárias: `critical`, `normal`, `low`
- Retry com exponential backoff + dead letter queue
- Se a OLT demorar, o worker aguarda sem travar a API

**Apache Kafka (Streaming — Fase 3):**
- Ingestão massiva de métricas: milhares de ONUs enviando sinal a cada 5min
- Buffer para agentes de IA consumirem no ritmo que suportarem
- Desacoplamento total entre coleta e processamento

### 3.4 Agentes de IA

| Agente | Função | Algoritmo | Input |
|---|---|---|---|
| **Anomaly Detection** | Detecta métricas fora do padrão histó | Isolation Forest | Rx/Tx, latência, uptime |
| **Churn Predictor** | Score 0-100 de risco de cancelamento | Gradient Boosting | Quedas, reclamações, sinal |
| **Auto-Diagnostics** | Cruza dados OLT+CPE para sugestão | Rules + ML | Sinal, WiFi, CPU, PPPoE |
| **Network Weather** | Previsão de degradação por região | LSTM | Séries temporais geoespaciais |

---

## 4. Stack Tecnológico

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| **Backend** | Python + FastAPI | 3.12+ | Async nativo, Pydantic, 65k req/s |
| **Frontend** | React 19 + TypeScript | 19.x | Server Components, Actions |
| **UI Framework** | Material-UI v6 | 6.x | Design system completo |
| **Build Tool** | Vite | 6.x | HMR em <100ms |
| **ACS / TR-069** | GenieACS | 1.2.13 | Padrão de mercado open source |
| **DB Relacional** | PostgreSQL | 16 | ACID, extensível, robusto |
| **DB Séries Temporais** | TimescaleDB | 2.x | Extensão PG para métricas |
| **DB Documentos** | MongoDB | 8.0 | Requerido pelo GenieACS |
| **Cache / Sessões** | Redis | 7.x | Sub-ms latency, pub/sub |
| **Mensageria** | RabbitMQ | 3.x | Filas duráveis, retry, DLQ |
| **Streaming** | Apache Kafka | 3.x | Telemetria de alto volume |
| **IA/ML** | scikit-learn, TensorFlow | Latest | Anomalias, predição, clustering |
| **Monitoramento** | Prometheus + Grafana | Latest | Métricas de infraestrutura |
| **Proxy** | Nginx | Stable | TLS 1.3, rate limiting, proxy |
| **Contêineres** | Docker + Compose | Latest | Orquestração local |
| **Gráficos** | Recharts + D3.js | Latest | Séries temporais + topologia |
| **Mapas** | Leaflet | Latest | Geolocalização + heatmaps |
| **Topologia** | React Flow | Latest | Digital Twin visual |

---

## 5. Funcionalidades — Dashboard & Visão Geral

### 5.1 Dashboard Principal (NOC)
- **KPIs em tempo real:** Total de dispositivos, online/offline, alertas críticos, uptime %, SLA compliance
- **Gráfico de tendência:** Dispositivos online nas últimas 24h/7d/30d
- **Mapa geográfico:** Dispositivos por região com heatmap de saúde
- **Top 10 problemas:** Dispositivos com mais incidentes na semana
- **Últimos alertas:** Feed em tempo real via WebSocket
- **Widgets configuráveis:** O operador monta seu próprio dashboard (drag & drop)
- **Dark mode / Light mode** com tema customizável

### 5.2 Dashboard Executivo
- **Resumo financeiro:** Custo operacional por dispositivo, saving por automação
- **SLA compliance:** % de cumprimento por OLT/região/cliente
- **Tendências:** Churn risk, crescimento de base, MTTR evolução
- **Comparativo mensal:** Incidentes, tempo de resolução, satisfação

---

## 6. Funcionalidades — Gerenciamento de OLTs (Nível SmartOLT)

### 6.1 Cadastro e Gestão de OLTs
- [ ] Cadastro de OLT com dados: IP, porta SNMP, community, modelo, localização, coordenadas GPS
- [ ] Suporte multi-vendor: Huawei (MA5600T/MA5608T/MA5800/MA5801), ZTE (C300/C320/C600/C610)
- [ ] Detecção automática de modelo e versão de firmware
- [ ] Dashboard individual por OLT com métricas em tempo real
- [ ] Agrupamento de OLTs por localidade/POP/região

### 6.2 Gerenciamento de PON Ports
- [ ] Listagem de todas as portas PON com status (up/down)
- [ ] Contagem de ONUs por porta PON
- [ ] Gráfico de utilização de cada PON (% de capacidade)
- [ ] Alertas de PON com mais de 80% de ocupação
- [ ] Histórico de throughput por PON port

### 6.3 Gerenciamento de ONUs/ONTs
- [ ] **Auto-discovery:** Listagem de ONUs não autorizadas (descobertas mas não provisionadas)
- [ ] **Provisionamento Zero-Touch:** Ao detectar nova ONU → provisionar automaticamente baseado em regras
- [ ] **Status em tempo real:** Online/Offline com timestamp da última comunicação
- [ ] **Potência óptica:** Rx Power (dBm), Tx Power (dBm), com gráfico histórico
- [ ] **Distância:** Cálculo automático da distância OLT ↔ ONU baseado na atenuação
- [ ] **Temperatura:** Monitoramento de temperatura da ONU (quando suportado)
- [ ] **SN/MAC Address:** Serial number e MAC address com busca
- [ ] **Informações do equipamento:** Modelo, versão de firmware, vendor
- [ ] **Reboot remoto:** Reiniciar ONU sem visita técnica
- [ ] **Firmware update:** Upload e atualização de firmware com rollback automático
- [ ] **Configuração de VLAN:** Criar/editar/remover VLANs na ONU
- [ ] **Service Profiles:** Aplicar perfis de serviço (dados, VoIP, IPTV)
- [ ] **Desabilitar/Habilitar ONU:** Bloquear/desbloquear porta PON da ONU
- [ ] **Histórico de eventos:** Log de tudo que aconteceu com a ONU (connects, disconnects, config changes)

### 6.4 Monitoramento de Sinal Óptico
- [ ] Gráfico de potência Rx/Tx em tempo real por ONU
- [ ] Thresholds configuráveis: alerta quando sinal < -25 dBm ou > -8 dBm
- [ ] Histórico de sinal com período selecionável (1h, 6h, 24h, 7d, 30d)
- [ ] Comparação de sinal entre ONUs da mesma PON
- [ ] **Previsão de degradação:** ML que prevê queda de sinal dias antes
- [ ] Relatório de ONUs com sinal degradando

### 6.5 Topologia Óptica
- [ ] Visualização árvore: OLT → PON → Splitter → ONU
- [ ] Cálculo de atenuação por trecho
- [ ] Identificação de splitters com base na distância
- [ ] Exportação da topologia como diagrama

---

## 7. Funcionalidades — Gerenciamento de CPEs (Nível Anlix)

### 7.1 Gestão via TR-069 (GenieACS)
- [ ] **Inventário completo:** Listagem de todos os CPEs com modelo, firmware, status, sinal
- [ ] **Árvore de parâmetros TR-069:** Navegação e edição de todos os parâmetros do CPE
- [ ] **Busca avançada:** Por serial number, MAC, IP, SSID, modelo, status, localidade
- [ ] **Filtros rápidos:** Online, Offline, Com alerta, Por modelo, Por OLT
- [ ] **Soft delete:** Dispositivos removidos vão para "lixeira" com possibilidade de restaurar

### 7.2 Configuração Wi-Fi Remota
- [ ] **SSID e Senha:** Alterar nome da rede e senha remotamente
- [ ] **Segurança:** Configurar tipo de criptografia (WPA2/WPA3)
- [ ] **Canal:** Selecionar canal manualmente ou habilitar auto-channel
- [ ] **Potência de transmissão:** Ajustar potência do rádio Wi-Fi
- [ ] **Band steering:** Configurar preferência 2.4GHz/5GHz
- [ ] **SSID oculto:** Habilitar/desabilitar broadcast do SSID
- [ ] **Wi-Fi 5GHz:** Configuração separada para banda de 5GHz
- [ ] **Guest Network:** Criar rede de visitantes isolada
- [ ] **Configuração em massa:** Aplicar perfil Wi-Fi a N dispositivos simultaneamente
- [ ] **Perfis de Wi-Fi:** Templates pré-definidos (Residencial, Comercial, Custom)

### 7.3 Configuração de Rede
- [ ] **WAN/PPPoE:** Configurar conexão WAN (DHCP, PPPoE, IP estático)
- [ ] **LAN/DHCP:** Configurar range DHCP, gateway, DNS
- [ ] **DNS personalizado:** Configurar servidores DNS (Google, Cloudflare, custom)
- [ ] **Port forwarding:** Criar regras de redirecionamento de porta
- [ ] **UPnP:** Habilitar/desabilitar UPnP
- [ ] **DMZ:** Configurar host DMZ
- [ ] **Firewall:** Configurar nível de firewall

### 7.4 Diagnóstico Remoto
- [ ] **Ping:** Disparar ping do CPE para qualquer destino
- [ ] **Traceroute:** Traçar rota do CPE
- [ ] **Wi-Fi Scan:** Escanear redes vizinhas e detectar interferência
- [ ] **Speed Test:** Teste de velocidade disparado no CPE (não no celular)
- [ ] **Dispositivos conectados:** Listagem de todos os devices conectados ao CPE com MAC/IP/nome
- [ ] **Consumo de banda por device:** Tráfego up/down por dispositivo conectado
- [ ] **Status PPPoE:** Verificar status da conexão PPPoE (conectado, nego, erro)
- [ ] **Uptime do CPE:** Tempo desde o último reboot
- [ ] **CPU e Memória:** Uso de recursos do CPE

### 7.5 Ações Remotas
- [ ] **Reboot:** Reiniciar o CPE remotamente
- [ ] **Factory Reset:** Reset de fábrica (com confirmação dupla)
- [ ] **Firmware Update:** Atualizar firmware com opção de agendamento
- [ ] **Rollback de firmware:** Se degradar após update, reverter automaticamente
- [ ] **Backup de configuração:** Salvar config atual antes de alterações
- [ ] **Restaurar configuração:** Aplicar backup anterior

### 7.6 Dispositivos Conectados ao CPE
- [ ] Listagem de todos os dispositivos conectados (Wi-Fi e cabo)
- [ ] MAC Address, IP, Nome do dispositivo, Banda (2.4/5GHz)
- [ ] Intensidade do sinal Wi-Fi por dispositivo
- [ ] Histórico de conexão/desconexão
- [ ] Bloqueio de dispositivo (MAC filter)
- [ ] Controle parental básico (bloquear por horário)

### 7.7 Wi-Fi Score
- [ ] Score 0-100 por CPE baseado em: interferência, canal, potência, nº de clientes, retransmissões
- [ ] Classificação: Excelente (80-100), Bom (60-80), Regular (40-60), Ruim (0-40)
- [ ] Sugestões automáticas: "Trocar para canal 11", "Reduzir potência", "Habilitar 5GHz"
- [ ] Ranking de piores CPEs por região
- [ ] Histórico de Wi-Fi Score

---

## 8. Funcionalidades — Monitoramento & Alertas

### 8.1 Monitoramento em Tempo Real
- [ ] Status online/offline de todos os dispositivos com atualização WebSocket
- [ ] Métricas de sinal óptico (Rx/Tx) com refresh a cada 5 minutos
- [ ] Latência, jitter e perda de pacotes por CPE
- [ ] Throughput por OLT/PON/ONU
- [ ] Temperatura das OLTs
- [ ] Utilização de CPU e memória das OLTs

### 8.2 Motor de Alertas Inteligente
- [ ] **Agregação:** Se OLT cair → 1 alerta "OLT Down", não 2000 alertas de cliente
- [ ] **Anti-flapping:** Link oscila 10x em 1min → 1 alerta de instabilidade
- [ ] **Priorização automática:** Crítico (OLT down) > Major (sinal degradando) > Info
- [ ] **Escalação:** Se não reconhecido em 15min → escalar para o próximo nível
- [ ] **Regras configuráveis:** Condições + ações customizáveis
- [ ] **Histórico:** Todos os alertas com timestamps de criação, ack, resolução

### 8.3 Séries Temporais (TimescaleDB)
- [ ] Retenção: dados brutos 30d, agregação horária 1y, agregação diária 3y
- [ ] Gráficos interativos com zoom, pan e seleção de período
- [ ] Continuous aggregates para consultas rápidas em períodos longos
- [ ] Alertas baseados em tendência (sinal caindo X dB/semana)

---

## 9. Funcionalidades — Inteligência Artificial

### 9.1 Agente de Detecção de Anomalias
- [ ] Isolation Forest para métricas de potência óptica
- [ ] Baseline automático por dispositivo/horário/dia da semana
- [ ] Detecção de degradação gradual (tendência ao longo de dias)
- [ ] Alertas automáticos com nível de confiança

### 9.2 Agente de Predição de Churn
- [ ] Score 0-100 por cliente baseado em: quedas, reclamações, sinal, latência
- [ ] "Cliente X tem 78% de chance de cancelar nos próximos 30 dias"
- [ ] Ranking dos clientes com maior risco
- [ ] Sugestões de ação preventiva

### 9.3 Agente de Diagnóstico Automático
- [ ] Cruza dados OLT + CPE para diagnóstico instantâneo
- [ ] "Sinal óptico OK, Wi-Fi com interferência severa no canal 6. Sugestão: canal 11"
- [ ] Histórico de diagnósticos por cliente

### 9.4 Clusterização de Falhas
- [ ] "30 clientes caíram no bairro X → Provável rompimento de fibra"
- [ ] Agrupamento geográfico de incidentes
- [ ] Correlação temporal de eventos

### 9.5 Network Weather Map™
- [ ] Mapa visual: verde (saudável), amarelo (degradando), vermelho (crítico)
- [ ] Previsão de 6h usando LSTM
- [ ] Alertas proativos: "Bairro X terá degradação nas próximas 4h"

---

## 10. Funcionalidades — Relatórios & BI

### 10.1 Relatórios Operacionais
- [ ] Disponibilidade (uptime por dispositivo/OLT/região)
- [ ] Incidentes (MTTR, MTBF, top problemas)
- [ ] SLA compliance por cliente
- [ ] Inventário (por modelo, firmware, status)
- [ ] Qualidade de sinal (heatmap de dBm por região)

### 10.2 Exportação
- [ ] PDF (ReportLab) com logo e formatação profissional
- [ ] Excel (openpyxl) com dados brutos e gráficos
- [ ] CSV para integração com outros sistemas
- [ ] Agendamento: diário/semanal/mensal via Celery beat

### 10.3 Dashboard Executivo
- [ ] KPIs consolidados com comparativo mensal
- [ ] Gráficos de evolução (base, incidentes, MTTR, churn)
- [ ] Filtros por período, OLT, região, plano

---

## 11. Funcionalidades — Automação & Workflows

### 11.1 Provisionamento Automático
- [ ] Nova ONU detectada → provisionar baseado em regras de plano/contrato
- [ ] Aplicar perfil Wi-Fi baseado no plano do cliente
- [ ] Configurar VLAN e Service Profile automaticamente

### 11.2 Self-Healing
- [ ] Se CPE não responde há 10min → enviar connection request
- [ ] Se sinal óptico degradou > 5dB → alertar e abrir chamado
- [ ] Se firmware outdated → agendar update para madrugada

### 11.3 Tarefas em Lote
- [ ] Reboot em massa por OLT/PON/região
- [ ] Atualização de firmware em lote com janela de manutenção
- [ ] Alteração de Wi-Fi em massa para todos os CPEs de um plano

---

## 12. Funcionalidades — Integrações & API

### 12.1 API REST (OpenAPI 3.1)
- [ ] Endpoints documentados com Swagger UI
- [ ] Autenticação via API Key ou JWT
- [ ] Rate limiting configurável
- [ ] Versionamento (v1, v2)

### 12.2 Webhooks
- [ ] Eventos: device.online, device.offline, alert.created, alert.resolved
- [ ] Configuração de URL destino + headers + retry policy
- [ ] Log de entregas com status

### 12.3 Integrações Nativas
- [ ] **IXCSoft:** Sync de clientes, planos, contratos
- [ ] **SGP (MK Solutions):** Importação de dados cadastrais
- [ ] **MikroTik RouterOS:** Integração com concentradores PPPoE
- [ ] **Zabbix:** Exportar métricas via SNMP traps
- [ ] **Grafana:** Dashboards customizados via Prometheus

### 12.4 Notificações Multi-Canal
- [ ] Email (SMTP)
- [ ] Telegram Bot
- [ ] WhatsApp Business API
- [ ] SMS (via gateway)

---

## 13. Funcionalidades — Inovações Exclusivas

### 13.1 Digital Twin de Rede
- [ ] Réplica virtual de toda a topologia em React Flow
- [ ] Simular mudanças antes de executar
- [ ] Zoom semântico: zoom out = OLTs, zoom in = CPEs

### 13.2 ISP Copilot (Chat IA)
- [ ] "Qual OLT tem mais reclamações neste mês?" → gráfico instantâneo
- [ ] "Reboota a ONU do cliente João Silva" → executa via NLP
- [ ] Interface de chat integrada ao dashboard

### 13.3 Portal do Cliente (White Label)
- [ ] Login via CPF/CNPJ + código SMS
- [ ] "Minha Conexão" — status, velocidade, sinal
- [ ] Troca de senha Wi-Fi pelo próprio cliente
- [ ] Abertura de chamado com diagnóstico automático
- [ ] PWA instalável no celular

### 13.4 SLA Meter com Compensação
- [ ] Medição automática de SLA por cliente
- [ ] Quando excede threshold → gerar desconto automático

### 13.5 Firmware Rollback Inteligente
- [ ] Após update, monitorar métricas por 24h
- [ ] Se degradação > threshold → rollback automático

---

## 14. Sistema de Notificações Inteligentes

O sistema evita a **"fadiga de alertas"** comum em NOCs:

| Tipo | Prioridade | Canal | Exemplo |
|---|---|---|---|
| **OLT Down** | 🔴 Crítico | Telegram + SMS + Voice | "OLT-01 caiu às 14:30" |
| **PON saturada** | 🔴 Crítico | Telegram + Email | "PON 1/1 com 95% ocupação" |
| **Sinal degradando** | 🟡 Major | Email + Dashboard | "ONU-123: Rx caiu 3dB em 7d" |
| **Flapping** | 🟡 Major | Dashboard | "ONU-456 oscilou 15x em 5min" |
| **Firmware outdated** | 🔵 Info | Dashboard | "32 ONUs com firmware antigo" |
| **Provisionamento** | 🔵 Info | Log | "ONU-789 provisionada com sucesso" |

---

## 15. Segurança

| Aspecto | Implementação |
|---|---|
| **Autenticação** | JWT com access (15min) + refresh token (7d) |
| **Autorização** | RBAC: admin, noc_manager, operator, reader |
| **Criptografia** | TLS 1.3 em todas as comunicações |
| **Auditoria** | Log imutável de todas as ações |
| **Rate Limiting** | slowapi/Redis no backend |
| **CSRF** | Token CSRF no frontend |
| **CSP** | Content Security Policy headers |
| **Input** | Validação Pydantic + sanitização |
| **Rede** | GenieACS e DB não expostos publicamente |
| **Senhas** | bcrypt hash, policy de complexidade |
| **Brute-force** | Lock após 5 tentativas falhas |

---

## 16. Roadmap de Implementação

| Fase | Período | Entregas |
|---|---|---|
| **Fase 1: Fundação** | Meses 1-2 | PostgreSQL real, JWT, Clean Architecture |
| **Fase 2: Core** | Meses 2-4 | GenieACS completo, OLTs SNMP, Alertas, Relatórios |
| **Fase 3: Inteligência** | Meses 4-6 | TimescaleDB, IA, Kafka/RabbitMQ |
| **Fase 4: Segurança** | Meses 6-7 | TLS, Hardening, Prometheus+Grafana |
| **Fase 5: Inovação** | Meses 7-9 | Digital Twin, Churn, Portal Cliente |
| **Fase 6: Go-Live** | Mês 9 | Deploy prod, CI/CD, primeiro cliente |

> **Detalhamento completo das sprints:** ver `CRONOGRAMA_PRODUCAO.md`

---

> **Este documento é referência viva.** Todas as funcionalidades listadas com `- [ ]` devem ser marcadas como `- [x]` conforme forem implementadas.
