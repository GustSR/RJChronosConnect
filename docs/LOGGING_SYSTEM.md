# Sistema de Logging Avançado - RJChronosConnect

Sistema de logging event-driven com routing inteligente para compliance LGPD/ANATEL e alta performance.

## 📊 Visão Geral

O sistema implementa uma arquitetura de logging híbrida que separa automaticamente logs críticos (PostgreSQL) de logs operacionais (ClickHouse) baseado em tipos de evento, compliance e volume.

### Arquitetura

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Microserviços │───▶│   RabbitMQ   │───▶│    Consumers    │
│                 │    │   (Routing)  │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                      │
                              ▼                      ▼
                       ┌─────────────┐    ┌─────────────────┐
                       │ PostgreSQL  │    │   ClickHouse    │
                       │ (Críticos)  │    │ (Operacionais)  │
                       └─────────────┘    └─────────────────┘
```

## 🎯 Características Principais

### ✅ Event-Driven Architecture
- **Desacoplamento total** entre microserviços
- **RabbitMQ** como message broker
- **Routing inteligente** baseado em padrões
- **Dead Letter Queues** para falhas

### ✅ Routing Inteligente
- **PostgreSQL**: Logs críticos, compliance, auditoria
- **ClickHouse**: Logs operacionais, métricas, alto volume
- **Arquivo Local**: Logs de debug e fallback

### ✅ Compliance LGPD/ANATEL
- **Classificação automática** de dados PII
- **Períodos de retenção** configuráveis
- **Base legal** para cada tipo de evento
- **Redação automática** de dados sensíveis

### ✅ High Performance
- **Batch processing** para ClickHouse (1000 logs/batch)
- **Rate limiting** configurável
- **Fallback local** em caso de falhas
- **TTL automático** das mensagens

### ✅ Monitoring & Health Checks
- **Prometheus metrics** integrado
- **Health check API** em tempo real
- **Alertas automáticos** para componentes críticos
- **Análise de integridade** dos dados

## 📁 Estrutura do Sistema

```
RJChronosConnect/
├── shared/logging/                     # Biblioteca compartilhada
│   ├── __init__.py                    # Setup function
│   ├── config.py                      # Configurações YAML
│   ├── routing.py                     # Routing inteligente
│   └── microservice_logger.py         # Logger principal
├── services/
│   ├── log-consumer-postgresql/        # Consumer para logs críticos
│   ├── log-consumer-clickhouse/       # Consumer para logs operacionais
│   ├── log-monitor/                   # Sistema de monitoramento
│   └── backend-api/config/            # Configuração de exemplo
├── infrastructure/
│   ├── rabbitmq/                      # Configurações RabbitMQ
│   └── clickhouse/                    # Configurações ClickHouse
└── scripts/setup_logging_system.sh   # Script de instalação
```

## 🚀 Instalação e Setup

### 1. Setup Automático (Recomendado)

```bash
# Tornar script executável
chmod +x scripts/setup_logging_system.sh

# Executar setup completo
./scripts/setup_logging_system.sh
```

### 2. Setup Manual

#### Pré-requisitos
- Docker & Docker Compose
- Arquivo `.env` configurado

#### Passo a passo

```bash
# 1. Iniciar serviços base
docker-compose up -d db-app rabbitmq clickhouse

# 2. Configurar ClickHouse
cd services/log-consumer-clickhouse/
chmod +x setup_clickhouse.sh
./setup_clickhouse.sh
cd ../..

# 3. Executar migrações PostgreSQL (automático com backend-api)

# 4. Iniciar consumers
docker-compose up -d log-consumer-postgresql log-consumer-clickhouse

# 5. Iniciar monitor
docker-compose up -d log-monitor
```

## 📋 Configuração

### Arquivo de Configuração (YAML)

```yaml
service:
  name: "meu-servico"
  version: "1.0.0"

logging:
  transport:
    type: "rabbitmq"
    url: "amqp://localhost:5672"
    exchange: "system.logs"

  fallback:
    path: "/var/log/meu-servico.log"
    max_size_mb: 100

  rate_limit:
    max_per_second: 100
    burst_size: 500

  event_types:
    - name: "user_login"
      destination: "postgresql"
      level: "info"
      compliance: ["LGPD"]
      pii_fields: ["user_id", "ip_address"]
      retention: "5 years"
```

### Integração em Microserviços

```python
import sys
from pathlib import Path

# Adicionar shared ao path
sys.path.insert(0, str(Path(__file__).parent.parent / "shared"))

from logging import setup_logging

# Inicializar logger
logger = setup_logging("meu-servico", "config/logging.yml")

# Usar em endpoints
await logger.info("user_login", "Login realizado", user_id=123)
await logger.error("api_error", "Erro na API", error_details=details)
```

## 📊 Tipos de Logs e Routing

### PostgreSQL (Logs Críticos)
- ✅ Autenticação (login, logout, mudança senha)
- ✅ Acesso a dados de clientes
- ✅ Configurações críticas de equipamentos
- ✅ Eventos de segurança
- ✅ Compliance LGPD/ANATEL

**Características:**
- Durabilidade garantida
- Backup automático
- Retenção: 3-10 anos
- ACID compliance

### ClickHouse (Logs Operacionais)
- ✅ Monitoramento de ONTs/OLTs (800K+ logs/dia)
- ✅ Métricas de performance
- ✅ Requisições de API
- ✅ Comandos de automação
- ✅ Traps SNMP

**Características:**
- Otimizado para time-series
- Agregações automáticas
- Particionamento por mês
- TTL: 3-12 meses

### Arquivo Local (Debug/Fallback)
- ✅ Logs de debug
- ✅ Fallback quando RabbitMQ indisponível
- ✅ Logs de desenvolvimento
- ✅ Rate limited logs

## 🔧 Endpoints e Monitoramento

### Health Check API (Porta 8083)
```bash
# Status geral
curl http://localhost:8083/health

# Métricas detalhadas
curl http://localhost:8083/metrics/detailed
```

### Prometheus Metrics (Porta 8000)
```bash
# Métricas para Grafana/Prometheus
curl http://localhost:8000/metrics
```

### RabbitMQ Management (Porta 15672)
- URL: http://localhost:15672
- Usuário: rjchronos / rjchronos123

### ClickHouse (Porta 8123)
```bash
# Query de exemplo
curl "http://localhost:8123/" --data "SELECT count() FROM logs.operational_logs WHERE event_date = today()"
```

## 📈 Métricas e Alertas

### Métricas Prometheus
- `log_messages_total`: Total de mensagens processadas
- `log_processing_seconds`: Tempo de processamento
- `rabbitmq_queue_depth`: Profundidade das filas
- `consumer_health_status`: Status dos consumers
- `database_health_status`: Status dos bancos

### Alertas Automáticos
- 🚨 RabbitMQ indisponível
- 🚨 PostgreSQL indisponível
- ⚠️ ClickHouse indisponível
- ⚠️ Filas com >10k mensagens
- ⚠️ Lag de processamento >5min

## 🛡️ Compliance e Segurança

### LGPD
- ✅ Identificação automática de dados PII
- ✅ Base legal para cada evento
- ✅ Períodos de retenção configuráveis
- ✅ Redação automática em logs operacionais

### ANATEL
- ✅ Logs de configuração de equipamentos
- ✅ Ativação/desativação de ONTs
- ✅ Mudanças em infraestrutura crítica
- ✅ Retenção: 3-5 anos

### Segurança
- ✅ Logs de tentativas de acesso
- ✅ Mudanças de configuração auditadas
- ✅ Classificação automática (confidential/internal)
- ✅ Dead Letter Queues para investigação

## 🔍 Consultas e Análises

### PostgreSQL (Logs Críticos)
```sql
-- Logins nas últimas 24h
SELECT user_id, event_timestamp, ip_address
FROM activity_logs
WHERE event_type = 'user_login'
  AND event_timestamp >= NOW() - INTERVAL '24 hours';

-- Mudanças de configuração por usuário
SELECT user_id, COUNT(*) as changes
FROM activity_logs
WHERE event_type LIKE '%configuration_change'
  AND event_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_id;
```

### ClickHouse (Logs Operacionais)
```sql
-- ONTs com problemas nas últimas 24h
SELECT ont_id, COUNT() as issues
FROM logs.operational_logs
WHERE event_type = 'ont_status_monitoring'
  AND level = 'ERROR'
  AND event_datetime >= now() - INTERVAL 24 HOUR
GROUP BY ont_id
ORDER BY issues DESC;

-- Métricas agregadas por hora
SELECT
    toStartOfHour(event_datetime) as hour,
    service_name,
    avg(metric_value) as avg_value
FROM logs.operational_logs
WHERE metric_name = 'ont_power_level'
  AND event_date >= today() - INTERVAL 7 DAY
GROUP BY hour, service_name
ORDER BY hour DESC;
```

## 🚨 Troubleshooting

### Verificar Status dos Componentes
```bash
# Docker containers
docker-compose ps

# Logs dos consumers
docker-compose logs -f log-consumer-postgresql
docker-compose logs -f log-consumer-clickhouse

# Health check completo
curl http://localhost:8083/metrics/detailed | jq
```

### Problemas Comuns

#### 1. RabbitMQ com filas cheias
```bash
# Verificar filas
curl -u rjchronos:rjchronos123 http://localhost:15672/api/queues

# Purgar fila (CUIDADO!)
curl -u rjchronos:rjchronos123 -X DELETE \
  http://localhost:15672/api/queues/%2F/logs.clickhouse.operational/contents
```

#### 2. ClickHouse com lag alto
```sql
-- Verificar lag de processamento
SELECT
    avg(dateDiff('second', event_datetime, processed_at)) as avg_lag,
    max(dateDiff('second', event_datetime, processed_at)) as max_lag
FROM logs.operational_logs
WHERE processed_at >= now() - INTERVAL 1 HOUR;
```

#### 3. PostgreSQL com logs duplicados
```sql
-- Verificar duplicatas por trace_id
SELECT trace_id, COUNT(*) as duplicates
FROM activity_logs
WHERE event_timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY trace_id
HAVING COUNT(*) > 1;
```

## 📚 Exemplos de Uso

### Backend API
```python
from app.core.logging import log_user_action, log_equipment_access

# Log de ação crítica do usuário
await log_user_action(
    user_id=123,
    action="user_password_change",
    details={"method": "self_service"},
    ip_address="192.168.1.100"
)

# Log de acesso a equipamento
await log_equipment_access(
    user_id=123,
    customer_id=456,
    equipment_type="olt",
    equipment_id=789,
    action="configuration_view"
)
```

### OLT Manager
```python
from shared.logging import setup_logging

logger = setup_logging("olt-manager-huawei")

# Log operacional (ClickHouse)
await logger.info(
    "ont_status_monitoring",
    "Status ONT verificado",
    olt_id=123,
    ont_id=456789,
    status="online",
    power_level=-15.2,
    metric_name="ont_power_level",
    metric_value=-15.2,
    metric_unit="dBm"
)

# Log crítico (PostgreSQL)
await logger.warning(
    "ont_activation",
    "ONT ativada para cliente",
    customer_id=789,
    ont_serial="HWTC12345678",
    olt_id=123,
    user_id=456
)
```

## 📞 Suporte

Para dúvidas ou problemas:

1. **Health Check**: http://localhost:8083/health
2. **Logs**: `docker-compose logs -f [serviço]`
3. **Métricas**: http://localhost:8083/metrics/detailed
4. **RabbitMQ**: http://localhost:15672

---

**Implementado com compliance LGPD/ANATEL e otimizado para alto volume de ONTs** 🚀
