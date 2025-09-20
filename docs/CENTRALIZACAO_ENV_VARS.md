# 📋 Centralização de Variáveis de Ambiente - Concluída

## ✅ O que foi feito

### 1. **Atualizado .env.example**
Adicionadas todas as variáveis de ambiente faltantes organizadas por seção:

#### **Principais**
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`
- `REDIS_PASSWORD`, `UI_JWT_SECRET`

#### **Infraestrutura**
- `RABBITMQ_HOST`, `RABBITMQ_PORT`, `REDIS_HOST`
- `DATABASE_URL`, `RABBITMQ_URL`, `GENIACS_API_URL`

#### **Sistema de Logging (NOVO)**
- `CLICKHOUSE_HOST`, `CLICKHOUSE_PORT`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE`
- `CLICKHOUSE_BATCH_SIZE`, `CLICKHOUSE_BATCH_TIMEOUT`
- `RABBITMQ_EXCHANGE`, `RABBITMQ_CRITICAL_QUEUE`, `RABBITMQ_OPERATIONAL_QUEUE`
- `RABBITMQ_PREFETCH_COUNT`, `RABBITMQ_TIMEOUT`
- `DB_ECHO`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`
- `LOGGING_CONFIG_PATH`, `LOG_DIR`

#### **OLT Manager**
- `SNMP_COMMUNITY`, `TEST_OLT_IP`, `TEST_OLT_MODEL`, `OLT_IP_MODEL_MAPPING`

### 2. **Removidas URLs hardcoded**
Corrigidos os serviços de logging para usar variáveis de ambiente:

#### **services/log-consumer-postgresql/main.py**
- ❌ `"postgresql+asyncpg://user:password@localhost:5432/rjchronos"`
- ✅ `os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/rjchronos")`

#### **services/log-consumer-clickhouse/main.py**
- ❌ `"host": "localhost"`
- ✅ `"host": os.getenv("CLICKHOUSE_HOST", "localhost")`

#### **services/log-monitor/main.py**
- ❌ `"url": "amqp://localhost:5672"`
- ✅ `"url": os.getenv("RABBITMQ_URL", "amqp://localhost:5672")`

### 3. **Atualizado docker-compose.yml**
Adicionadas variáveis de ambiente detalhadas para os serviços de logging:

#### **log-consumer-postgresql**
```yaml
environment:
  - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db-app:5432/${POSTGRES_DB}
  - RABBITMQ_URL=amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672
  - RABBITMQ_EXCHANGE=system.logs
  - RABBITMQ_CRITICAL_QUEUE=logs.postgresql.critical
  - RABBITMQ_PREFETCH_COUNT=10
  - RABBITMQ_TIMEOUT=30
  - DB_ECHO=false
  - DB_POOL_SIZE=10
  - DB_MAX_OVERFLOW=20
```

#### **log-consumer-clickhouse**
```yaml
environment:
  - CLICKHOUSE_HOST=clickhouse
  - CLICKHOUSE_PORT=8123
  - CLICKHOUSE_USER=default
  - CLICKHOUSE_PASSWORD=
  - CLICKHOUSE_DATABASE=logs
  - RABBITMQ_URL=amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672
  - RABBITMQ_EXCHANGE=system.logs
  - RABBITMQ_OPERATIONAL_QUEUE=logs.clickhouse.operational
  - RABBITMQ_PREFETCH_COUNT=100
  - RABBITMQ_TIMEOUT=30
  - CLICKHOUSE_BATCH_SIZE=1000
  - CLICKHOUSE_BATCH_TIMEOUT=30
```

## ✅ **Resultado final**

### **Centralização completa** ✅
- ✅ Todas as configurações no `.env.example`
- ✅ Todos os serviços usando variáveis de ambiente
- ✅ Nenhuma URL hardcoded (exceto defaults seguros)
- ✅ Docker-compose totalmente configurado

### **Flexibilidade** ✅
- ✅ Fácil mudança entre ambientes (dev/prod)
- ✅ Configuração por variáveis de ambiente
- ✅ Defaults funcionais se variáveis não definidas
- ✅ Documentação clara no .env.example

### **Manutenibilidade** ✅
- ✅ Configurações organizadas por seção
- ✅ Comentários explicativos
- ✅ Padrão consistente em todos os serviços
- ✅ Fácil troubleshooting

## 📂 **Arquivos modificados**

1. **/.env.example** - Adicionadas 20+ variáveis novas
2. **services/log-consumer-postgresql/main.py** - Configuração via env vars
3. **services/log-consumer-clickhouse/main.py** - Configuração via env vars
4. **services/log-monitor/main.py** - Configuração via env vars
5. **docker-compose.yml** - Environment detalhado para serviços de logging

## 🎯 **Como usar**

### Para desenvolvimento:
```bash
# Copiar exemplo
cp .env.example .env

# Editar valores conforme necessário
nano .env

# Usar com Docker
docker-compose up
```

### Para produção:
```bash
# Definir variáveis específicas do ambiente
export POSTGRES_PASSWORD=senha-super-segura
export RABBITMQ_DEFAULT_PASS=rabbit-senha-forte
export CLICKHOUSE_PASSWORD=clickhouse-senha

# Ou usar .env específico
cp .env.example .env.prod
# editar .env.prod com valores de produção
```

---

**Status**: ✅ **CONCLUÍDO** - Todas as variáveis de ambiente estão centralizadas e organizadas corretamente!