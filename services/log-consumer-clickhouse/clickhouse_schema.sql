-- Schema ClickHouse otimizado para logs operacionais time-series
-- Projetado para alto volume (~800K logs/dia) e consultas analíticas

-- Criar database se não existe
CREATE DATABASE IF NOT EXISTS logs;

-- Usar database logs
USE logs;

-- Tabela principal para logs operacionais
CREATE TABLE IF NOT EXISTS operational_logs (
    -- Particionamento por data
    event_date Date,
    event_datetime DateTime64(3),

    -- Identificadores únicos
    trace_id String,
    message_id String,

    -- Metadados do serviço (LowCardinality para otimização)
    service_name LowCardinality(String),
    service_version LowCardinality(String),

    -- Informações do evento
    event_type LowCardinality(String),
    level LowCardinality(String),
    message String,
    category LowCardinality(String),

    -- Equipamentos e infraestrutura
    olt_id Nullable(UInt32),
    ont_id Nullable(UInt64),
    port_id Nullable(UInt16),
    equipment_type LowCardinality(Nullable(String)),

    -- Métricas operacionais
    metric_name LowCardinality(Nullable(String)),
    metric_value Nullable(Float64),
    metric_unit LowCardinality(Nullable(String)),

    -- Status e performance
    status LowCardinality(Nullable(String)),
    response_time_ms Nullable(UInt32),
    error_code Nullable(String),

    -- Localização e cliente
    customer_id Nullable(UInt32),
    region LowCardinality(Nullable(String)),
    city LowCardinality(Nullable(String)),

    -- Contexto adicional (JSON como string)
    context_json String,

    -- Timestamps de processamento
    processed_at DateTime64(3),

    -- Metadados de roteamento
    routing_key String,
    queue_name LowCardinality(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, service_name, event_type, event_datetime)
TTL event_date + INTERVAL 6 MONTH
SETTINGS index_granularity = 8192;

-- Índices especializados para consultas frequentes

-- Índice para consultas por equipamento
ALTER TABLE operational_logs ADD INDEX IF NOT EXISTS idx_olt_id olt_id TYPE minmax GRANULARITY 4;
ALTER TABLE operational_logs ADD INDEX IF NOT EXISTS idx_ont_id ont_id TYPE minmax GRANULARITY 4;

-- Índice para métricas
ALTER TABLE operational_logs ADD INDEX IF NOT EXISTS idx_metric_name metric_name TYPE set(100) GRANULARITY 1;

-- Índice para status e erros
ALTER TABLE operational_logs ADD INDEX IF NOT EXISTS idx_error_code error_code TYPE set(50) GRANULARITY 1;

-- Índice para localização
ALTER TABLE operational_logs ADD INDEX IF NOT EXISTS idx_region region TYPE set(20) GRANULARITY 1;

-- Tabela agregada para métricas por hora (para dashboards)
CREATE TABLE IF NOT EXISTS operational_metrics_hourly (
    date_hour DateTime,
    service_name LowCardinality(String),
    event_type LowCardinality(String),
    metric_name LowCardinality(String),

    -- Agregações estatísticas
    count UInt64,
    avg_value Float64,
    min_value Float64,
    max_value Float64,
    p95_value Float64,

    -- Performance
    avg_response_time Float64,
    error_count UInt64,

    -- Equipamentos únicos
    unique_olts UInt32,
    unique_onts UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date_hour)
ORDER BY (date_hour, service_name, event_type, metric_name)
TTL date_hour + INTERVAL 1 YEAR;

-- Materialized View para popular agregações automaticamente
CREATE MATERIALIZED VIEW IF NOT EXISTS operational_metrics_hourly_mv TO operational_metrics_hourly AS
SELECT
    toStartOfHour(event_datetime) as date_hour,
    service_name,
    event_type,
    metric_name,

    count() as count,
    avg(metric_value) as avg_value,
    min(metric_value) as min_value,
    max(metric_value) as max_value,
    quantile(0.95)(metric_value) as p95_value,

    avg(response_time_ms) as avg_response_time,
    countIf(level = 'ERROR') as error_count,

    uniq(olt_id) as unique_olts,
    uniq(ont_id) as unique_onts
FROM operational_logs
WHERE metric_name IS NOT NULL AND metric_value IS NOT NULL
GROUP BY date_hour, service_name, event_type, metric_name;

-- Tabela para logs de erro crítico (replicação seletiva)
CREATE TABLE IF NOT EXISTS operational_errors (
    event_date Date,
    event_datetime DateTime64(3),
    trace_id String,
    service_name LowCardinality(String),
    event_type LowCardinality(String),
    level LowCardinality(String),
    message String,
    error_code String,
    olt_id Nullable(UInt32),
    ont_id Nullable(UInt64),
    context_json String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, service_name, event_datetime)
TTL event_date + INTERVAL 1 YEAR;

-- Materialized View para capturar apenas erros
CREATE MATERIALIZED VIEW IF NOT EXISTS operational_errors_mv TO operational_errors AS
SELECT
    event_date,
    event_datetime,
    trace_id,
    service_name,
    event_type,
    level,
    message,
    error_code,
    olt_id,
    ont_id,
    context_json
FROM operational_logs
WHERE level IN ('ERROR', 'CRITICAL') OR error_code IS NOT NULL;

-- Tabela para análise de performance por equipamento
CREATE TABLE IF NOT EXISTS equipment_performance_daily (
    date Date,
    olt_id UInt32,
    ont_id Nullable(UInt64),

    -- Contadores
    total_events UInt64,
    error_events UInt64,

    -- Performance
    avg_response_time Float64,
    max_response_time UInt32,

    -- Disponibilidade
    uptime_percentage Float64,

    -- Métricas específicas
    avg_power_level Nullable(Float64),
    signal_quality_score Nullable(Float64)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, olt_id, ont_id)
TTL date + INTERVAL 2 YEAR;

-- Queries de exemplo para validação

-- 1. Logs por serviço nas últimas 24h
-- SELECT service_name, count() FROM operational_logs
-- WHERE event_datetime >= now() - INTERVAL 24 HOUR
-- GROUP BY service_name ORDER BY count() DESC;

-- 2. Top erros por equipamento
-- SELECT olt_id, error_code, count() FROM operational_errors
-- WHERE event_date >= today() - INTERVAL 7 DAY
-- GROUP BY olt_id, error_code ORDER BY count() DESC LIMIT 10;

-- 3. Métricas agregadas por hora
-- SELECT date_hour, service_name, avg_value, p95_value FROM operational_metrics_hourly
-- WHERE date_hour >= now() - INTERVAL 24 HOUR AND metric_name = 'ont_power_level'
-- ORDER BY date_hour DESC;

-- 4. Performance por equipamento
-- SELECT olt_id, avg(avg_response_time) as avg_perf, sum(error_events) as total_errors
-- FROM equipment_performance_daily
-- WHERE date >= today() - INTERVAL 30 DAY
-- GROUP BY olt_id ORDER BY avg_perf ASC;