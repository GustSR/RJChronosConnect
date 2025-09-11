# 🏗️ Arquitetura Oficial - RJChronosConnect

**Versão:** 1.0  
**Data:** 2025-09-11  
**Autor:** Equipe de Arquitetura  
**Status:** Ativo  

---

## 📋 Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Objetivos e Requisitos](#2-objetivos-e-requisitos)
- [3. Arquitetura de Soluções](#3-arquitetura-de-soluções)
- [4. Catálogo de Microserviços](#4-catálogo-de-microserviços)
- [5. Integrações e Comunicação](#5-integrações-e-comunicação)
- [6. Infraestrutura e Deployment](#6-infraestrutura-e-deployment)
- [7. Segurança](#7-segurança)
- [8. Observabilidade](#8-observabilidade)
- [9. Qualidade e Testes](#9-qualidade-e-testes)
- [10. Estratégia de Evolução](#10-estratégia-de-evolução)
- [11. Decisões Arquiteturais](#11-decisões-arquiteturais)

---

## 1. Visão Geral

### 1.1 Propósito do Sistema

O **RJChronosConnect** é uma plataforma completa para gestão e monitoramento de equipamentos de rede, com foco em:
- **Dispositivos TR-069**: CPEs, ONUs e modems via protocolo TR-069
- **OLTs (Optical Line Terminals)**: Equipamentos de fibra óptica via SSH/SNMP
- **Gestão Centralizada**: Interface única para provisionamento e diagnósticos

### 1.2 Domínio de Negócio

**Setor**: Telecomunicações e Provedores de Internet (ISPs)  
**Usuários**: Técnicos, operadores de rede, gestores de NOC  
**Casos de Uso Principais**:
- Provisionamento automático de equipamentos
- Monitoramento em tempo real
- Diagnóstico remoto e troubleshooting
- Gestão de configurações em massa
- Alertas e notificações proativas

### 1.3 Princípios Arquiteturais

- **Microserviços**: Serviços pequenos, focados e independentes
- **Event-Driven**: Comunicação assíncrona via mensageria
- **API-First**: Todas as funcionalidades expostas via API REST
- **Cloud-Native**: Preparado para containerização e orquestração
- **Observability**: Logs, métricas e traces para operação
- **Resilience**: Circuit breakers, retries e graceful degradation

---

## 2. Objetivos e Requisitos

### 2.1 Requisitos Funcionais

| ID | Requisito | Descrição | Prioridade |
|----|-----------|-----------|------------|
| RF-001 | Gestão TR-069 | Comunicação bidirecional com dispositivos TR-069 | Alta |
| RF-002 | Gestão OLTs | Controle de OLTs via SSH/SNMP | Alta |
| RF-003 | Interface Web | Dashboard moderno e responsivo | Alta |
| RF-004 | Provisionamento | Configuração automática em massa | Média |
| RF-005 | Monitoramento | Coleta e visualização de métricas | Média |
| RF-006 | Alertas | Sistema de notificações proativas | Baixa |

### 2.2 Requisitos Não-Funcionais

| Categoria | Requisito | Meta | Medição |
|-----------|-----------|------|---------|
| **Performance** | Latência API | < 200ms P95 | APM tools |
| **Escalabilidade** | Throughput | 1000 req/s | Load testing |
| **Disponibilidade** | Uptime | 99.9% | Monitoring |
| **Segurança** | Autenticação | JWT + RBAC | Security audit |
| **Manutenibilidade** | Code coverage | > 80% | CI/CD pipeline |
| **Observabilidade** | Logs estruturados | 100% services | Centralized logging |

---

## 3. Arquitetura de Soluções

### 3.1 Padrão Arquitetural

**Microserviços com Event-Driven Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                           │
│                       (Nginx Proxy)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                     Frontend (React)                           │
│                   SPA + TypeScript                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ REST APIs
┌─────────────────────┴───────────────────────────────────────────┐
│                   Backend API (FastAPI)                        │
│              JWT Auth + Business Logic                         │
└─────┬─────────────────────────┬─────────────────────────────────┘
      │                         │
      │ HTTP                    │ Events
      ▼                         ▼
┌─────────────┐           ┌─────────────────┐
│  GenieACS   │           │   RabbitMQ      │
│ (TR-069)    │           │   Message       │
│             │           │   Broker        │
└─────────────┘           └─────────┬───────┘
                                    │ Events
                          ┌─────────▼───────┐
                          │  OLT Manager    │
                          │   (Huawei)      │
                          │  SSH + SNMP     │
                          └─────────────────┘
                          ┌─────────────────┐
                          │   Works         │
                          │  (Worker)       │
                          │                 │
                          └─────────────────┘
```

### 3.2 Camadas da Arquitetura

| Camada | Responsabilidade | Tecnologias |
|--------|------------------|-------------|
| **Presentation** | Interface de usuário | React, TypeScript, Material-UI |
| **API Gateway** | Roteamento, autenticação | Nginx, JWT |
| **Business Logic** | Regras de negócio | FastAPI, Python |
| **Integration** | Comunicação externa | HTTP, SSH, SNMP |
| **Message Bus** | Eventos assíncronos | RabbitMQ, Redis |
| **Data** | Persistência | PostgreSQL, MongoDB |

---

## 4. Catálogo de Microserviços

### 4.1 Frontend Service

**Responsabilidade**: Interface de usuário web  
**Tecnologia**: React 18 + TypeScript + Vite  
**Padrões**: Feature-Sliced Design (FSD)

**Características**:
- SPA (Single Page Application)
- State management: TanStack Query + Zustand
- Forms: React Hook Form + Zod validation
- Testing: Vitest + React Testing Library
- Build: Vite com code-splitting

**APIs Consumidas**:
- Backend API (REST)
- WebSocket para atualizações em tempo real

### 4.2 Backend API Service

**Responsabilidade**: API central, autenticação, orquestração  
**Tecnologia**: FastAPI + Python 3.11  
**Database**: PostgreSQL com SQLAlchemy ORM

**Características**:
- Autenticação JWT com refresh tokens
- Migrations com Alembic
- Cache Redis para sessões
- Tasks assíncronas via Celery
- OpenAPI documentation automática

**Endpoints Principais**:
```
GET    /api/v1/health              # Health check
POST   /api/v1/auth/login          # Autenticação
GET    /api/v1/devices             # Listar dispositivos
POST   /api/v1/devices/provision   # Provisionamento
GET    /api/v1/metrics             # Métricas do sistema
```

### 4.3 GenieACS Service

**Responsabilidade**: Servidor ACS para protocolo TR-069  
**Tecnologia**: Node.js (GenieACS v1.2.13)  
**Database**: MongoDB

**Características**:
- ACS (Auto Configuration Server) compliant
- Preset management para configurações
- Real-time device monitoring
- RESTful API para integração

**Protocolos**:
- TR-069 (CWMP) - porta 7547
- REST API - porta 7557
- WebSocket - porta 7567

### 4.4 OLT Manager Huawei Service

**Responsabilidade**: Gestão específica de OLTs Huawei  
**Tecnologia**: FastAPI + Netmiko + PySNMP  
**Protocolos**: SSH, SNMP

**Características**:
- Connection pooling para SSH
- SNMP trap listener
- Command abstraction layer
- Circuit breaker pattern

**APIs Principais**:
```
GET    /api/v1/olts/{id}/autofind-onts/all    # ONUs pendentes
POST   /api/v1/olts/{id}/onts                 # Provisionar ONU
GET    /api/v1/olts/{id}/board-info           # Info das placas
POST   /api/v1/olts/{id}/ports/{port}/enable  # Habilitar porta
```

### 4.5 Works Service

**Responsabilidade**: Worker para processamento assíncrono  
**Tecnologia**: Python + RabbitMQ + Redis  
**Padrão**: Consumer pattern

**Características**:
- Message queue consumer
- Task processing distribuído
- Redis para state management
- Retry logic com backoff

**Filas Processadas**:
- `device.provision` - Provisionamento
- `device.monitor` - Monitoramento
- `notification.send` - Notificações

### 4.6 Monitoring Service

**Responsabilidade**: Observabilidade e métricas  
**Tecnologia**: Prometheus + Grafana  

**Características**:
- Metrics collection
- Alerting rules
- Dashboard visualization
- Log aggregation

---

## 5. Integrações e Comunicação

### 5.1 Padrões de Comunicação

| Tipo | Padrão | Uso | Protocolo |
|------|--------|-----|-----------|
| **Síncrona** | Request-Response | Frontend ↔ Backend | HTTP/REST |
| **Síncrona** | Command | Backend ↔ OLT Manager | HTTP/REST |
| **Assíncrona** | Event-Driven | Backend → Workers | RabbitMQ |
| **Assíncrona** | Pub/Sub | Notifications | RabbitMQ |
| **Device** | Protocol-Specific | System ↔ Devices | TR-069, SSH, SNMP |

### 5.2 Message Broker (RabbitMQ)

**Exchanges e Filas**:

```yaml
exchanges:
  device.events:
    type: topic
    routes:
      - device.connected
      - device.disconnected
      - device.alarm

  system.commands:
    type: direct
    routes:
      - provision.request
      - config.update
      - diagnostic.run

queues:
  device.provision:
    durable: true
    max_retries: 3
    
  notification.send:
    durable: true
    ttl: 3600000  # 1 hour
```

### 5.3 API Design Standards

**REST Conventions**:
- Versionamento: `/api/v1/`
- Recursos em plural: `/devices`, `/olts`
- HTTP methods semânticos: GET, POST, PUT, DELETE
- Status codes padrão HTTP
- JSON como formato de troca

**Error Handling**:
```json
{
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with ID 123 not found",
    "details": {
      "device_id": 123,
      "timestamp": "2025-09-11T10:00:00Z"
    }
  }
}
```

---

## 6. Infraestrutura e Deployment

### 6.1 Containerização

**Docker Strategy**:
- Base images: Python 3.11-slim, Node.js Alpine
- Multi-stage builds para otimização
- Non-root users para segurança
- Health checks implementados

**Dockerfile Patterns**:
```dockerfile
# Production
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
USER appuser
CMD ["uvicorn", "app:app", "--workers", "4"]

# Development  
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "app:app", "--reload", "--log-level", "debug"]
```

### 6.2 Orquestração

**Docker Compose (Development)**:
```yaml
version: '3.8'
services:
  frontend:
    build: ./services/frontend
    ports: ["3000:3000"]
    
  backend:
    build: ./services/backend-api
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on: [db-app]
    
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
```

**Kubernetes (Production)**:
- Deployments com rolling updates
- Services para load balancing
- ConfigMaps e Secrets para configuração
- Persistent Volumes para dados
- Horizontal Pod Autoscaler

### 6.3 Networking

**Rede Docker**:
- Bridge network: `rjchronos-net`
- Service discovery por nome
- Port mapping controlado

**Kubernetes Network**:
- CNI: Flannel ou Calico
- Network Policies para isolamento
- Ingress Controller (nginx-ingress)

---

## 7. Segurança

### 7.1 Autenticação e Autorização

**JWT Authentication**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**RBAC (Role-Based Access Control)**:
- **admin**: Acesso total
- **operator**: Gestão operacional
- **viewer**: Apenas leitura

### 7.2 Secrets Management

**Desenvolvimento**:
- `.env` files (não commitados)
- Docker secrets via compose

**Produção**:
- Kubernetes Secrets
- HashiCorp Vault (recomendado)
- AWS Secrets Manager

### 7.3 Network Security

- HTTPS everywhere (TLS 1.3)
- mTLS entre serviços internos
- Network policies para isolamento
- Rate limiting nos endpoints públicos

### 7.4 Security Scanning

- **SAST**: SonarQube para código
- **Container**: Trivy para images
- **Dependencies**: Snyk para bibliotecas
- **Runtime**: Falco para comportamento

---

## 8. Observabilidade

### 8.1 Logging

**Padrão de Logs Estruturados**:
```json
{
  "timestamp": "2025-09-11T10:00:00.000Z",
  "level": "INFO",
  "service": "olt-manager",
  "trace_id": "abc123def456",
  "span_id": "789ghi",
  "message": "ONU provisioned successfully",
  "context": {
    "olt_id": 1,
    "ont_id": 42,
    "serial_number": "ALCL12345678"
  }
}
```

**Stack de Logging**:
- **Collection**: Fluentd ou Vector
- **Storage**: Elasticsearch ou Loki
- **Visualization**: Kibana ou Grafana

### 8.2 Metrics

**Prometheus Metrics**:
```python
# Application metrics
http_requests_total = Counter('http_requests_total', 'HTTP requests', ['method', 'endpoint', 'status'])
response_duration = Histogram('http_response_duration_seconds', 'HTTP response duration')

# Business metrics  
devices_connected = Gauge('devices_connected_total', 'Connected devices')
provisioning_success_rate = Gauge('provisioning_success_rate', 'Success rate')
```

**Dashboards Grafana**:
- System overview
- Service-specific metrics
- Business KPIs
- SLA monitoring

### 8.3 Distributed Tracing

**Jaeger Integration**:
- Trace propagation entre serviços
- Request correlation
- Performance bottleneck identification
- Error root cause analysis

### 8.4 Health Checks

**Kubernetes Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 9. Qualidade e Testes

### 9.1 Estratégia de Testes

**Pirâmide de Testes**:
```
        E2E (10%)
       Integration (20%)
      Unit Tests (70%)
```

### 9.2 Testes por Serviço

| Serviço | Framework | Coverage | CI Integration |
|---------|-----------|----------|----------------|
| Frontend | Vitest + RTL | 80%+ | ✅ |
| Backend API | Pytest | 85%+ | ✅ |
| OLT Manager | Pytest | 70%+ | ⚠️ Em implementação |
| Works | Pytest | 60%+ | ❌ Pendente |

### 9.3 Quality Gates

**CI/CD Pipeline**:
1. **Linting**: ESLint, Black, isort
2. **Unit Tests**: Coverage > 70%
3. **Integration Tests**: Core flows
4. **Security Scan**: Vulnerabilities
5. **Build**: Docker images
6. **Deploy**: Staging environment

### 9.4 Performance Testing

**Load Testing**:
- **Tool**: k6 ou Artillery
- **Target**: 1000 RPS @ P95 < 200ms
- **Scenarios**: Peak traffic simulation

---

## 10. Estratégia de Evolução

### 10.1 Roadmap Arquitetural

**Fase 1: Fundamentação (1-2 meses)**
- ✅ Implementar testes faltantes
- ✅ Configurar CI/CD básico
- ✅ Observabilidade básica (logs + metrics)
- ✅ Security hardening

**Fase 2: Robustez (2-3 meses)**
- Circuit breakers e retry policies
- Secrets management robusto
- Performance optimization
- Advanced monitoring

**Fase 3: Escalabilidade (3-4 meses)**
- Kubernetes migration
- Service mesh (Istio)
- Multi-tenancy
- Auto-scaling

### 10.2 Technical Debt

**Prioridades de Refatoração**:
1. **Works Service**: Reestruturar completamente
2. **OLT Manager**: Adicionar testes e observabilidade
3. **Backend**: Otimizar queries de banco
4. **Frontend**: Implementar lazy loading

### 10.3 Modernização Contínua

- **Dependency Updates**: Automated via Renovate
- **Security Patches**: Monthly security reviews
- **Performance Reviews**: Quarterly optimization
- **Architecture Reviews**: Semi-annual assessments

---

## 11. Decisões Arquiteturais

### ADR-001: Microserviços vs Monolito
**Status**: Aceita  
**Decisão**: Arquitetura de microserviços  
**Rationale**: Múltiplos protocolos (TR-069, SSH, SNMP) requerem especialização

### ADR-002: Message Broker
**Status**: Aceita  
**Decisão**: RabbitMQ  
**Rationale**: Confiabilidade, features avançadas, suporte robusto

### ADR-003: Database Strategy
**Status**: Aceita  
**Decisão**: Database per Service  
**Rationale**: PostgreSQL (transacional) + MongoDB (documento)

### ADR-004: Frontend Framework
**Status**: Aceita  
**Decisão**: React + TypeScript  
**Rationale**: Ecossistema maduro, type safety, performance

### ADR-005: API Framework
**Status**: Aceita  
**Decisão**: FastAPI  
**Rationale**: Performance, async support, automatic documentation

---

## 📚 Referências

- [Microservices Patterns - Chris Richardson](https://microservices.io/)
- [Building Event-Driven Microservices](https://www.oreilly.com/library/view/building-event-driven-microservices/9781492057888/)
- [Cloud Native Patterns - Cornelia Davis](https://www.manning.com/books/cloud-native-patterns)
- [Observability Engineering - Honeycomb](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)

---

**Última Atualização**: 2025-09-11  
**Próxima Revisão**: 2025-12-11  
**Aprovado por**: Arquitetura de Software