#!/bin/bash
# Script de setup do ClickHouse para logs operacionais

set -e

CLICKHOUSE_HOST=${CLICKHOUSE_HOST:-localhost}
CLICKHOUSE_PORT=${CLICKHOUSE_PORT:-8123}
CLICKHOUSE_USER=${CLICKHOUSE_USER:-default}
CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-}

echo "🚀 Configurando ClickHouse para sistema de logs..."

# Verificar conectividade
echo "Verificando conectividade com ClickHouse..."
if ! curl -s "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}" > /dev/null; then
    echo "❌ Erro: ClickHouse não está acessível em ${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"
    exit 1
fi

echo "✅ ClickHouse acessível"

# Executar schema
echo "Aplicando schema..."
curl -X POST \
    "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data-binary @clickhouse_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema aplicado com sucesso"
else
    echo "❌ Erro ao aplicar schema"
    exit 1
fi

# Verificar tabelas criadas
echo "Verificando tabelas criadas..."
TABLES=$(curl -s "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data "SHOW TABLES FROM logs FORMAT TabSeparated")

expected_tables=("operational_logs" "operational_metrics_hourly" "operational_errors" "equipment_performance_daily")

for table in "${expected_tables[@]}"; do
    if echo "$TABLES" | grep -q "^${table}$"; then
        echo "✅ Tabela ${table} criada"
    else
        echo "❌ Tabela ${table} não encontrada"
        exit 1
    fi
done

# Verificar materialized views
echo "Verificando materialized views..."
VIEWS=$(curl -s "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data "SELECT name FROM system.tables WHERE database = 'logs' AND engine = 'MaterializedView' FORMAT TabSeparated")

expected_views=("operational_metrics_hourly_mv" "operational_errors_mv")

for view in "${expected_views[@]}"; do
    if echo "$VIEWS" | grep -q "^${view}$"; then
        echo "✅ Materialized view ${view} criada"
    else
        echo "❌ Materialized view ${view} não encontrada"
        exit 1
    fi
done

# Teste de inserção
echo "Realizando teste de inserção..."
curl -X POST \
    "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data "INSERT INTO logs.operational_logs VALUES (
        today(),
        now(),
        'test-trace-id',
        'test-message-id',
        'clickhouse-setup',
        '1.0.0',
        'setup_test',
        'INFO',
        'Schema setup test',
        'setup',
        NULL, NULL, NULL, NULL,
        'setup_metric',
        1.0,
        'count',
        'success',
        100,
        NULL,
        NULL,
        'test',
        'test',
        '{}',
        now(),
        'test.info.operational',
        'test'
    )"

if [ $? -eq 0 ]; then
    echo "✅ Teste de inserção realizado com sucesso"
else
    echo "❌ Erro no teste de inserção"
    exit 1
fi

# Verificar inserção
echo "Verificando inserção..."
COUNT=$(curl -s "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data "SELECT count() FROM logs.operational_logs WHERE service_name = 'clickhouse-setup' FORMAT TabSeparated")

if [ "$COUNT" -gt 0 ]; then
    echo "✅ Dados inseridos com sucesso (${COUNT} registros)"
else
    echo "❌ Dados não foram inseridos"
    exit 1
fi

# Limpar dados de teste
echo "Limpando dados de teste..."
curl -X POST \
    "http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}/" \
    --data "ALTER TABLE logs.operational_logs DELETE WHERE service_name = 'clickhouse-setup'"

echo ""
echo "🎉 Setup do ClickHouse concluído com sucesso!"
echo ""
echo "Tabelas criadas:"
echo "- operational_logs (logs operacionais principais)"
echo "- operational_metrics_hourly (agregações por hora)"
echo "- operational_errors (logs de erro)"
echo "- equipment_performance_daily (performance por equipamento)"
echo ""
echo "Materialized Views criadas:"
echo "- operational_metrics_hourly_mv (agregação automática)"
echo "- operational_errors_mv (captura de erros)"
echo ""
echo "Sistema pronto para receber logs operacionais!"