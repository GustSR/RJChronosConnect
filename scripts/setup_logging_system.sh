#!/bin/bash
# Script de setup completo do sistema de logging avançado
# RJChronosConnect - Sistema de Logging Event-Driven

set -e

echo "🚀 Configurando Sistema de Logging Avançado RJChronosConnect"
echo "=============================================================="
echo "📍 Script localizado em: scripts/setup_logging_system.sh"
echo "📚 Documentação técnica: docs/LOGGING_SYSTEM.md"
echo "🔍 Explicação simples: README_LOGGING.md"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está rodando
check_docker() {
    log_info "Verificando Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker não está rodando. Por favor, inicie o Docker e tente novamente."
        exit 1
    fi
    log_info "Docker OK"
}

# Verificar se docker-compose está disponível
check_docker_compose() {
    log_info "Verificando Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose não encontrado. Por favor, instale o Docker Compose."
        exit 1
    fi
    log_info "Docker Compose OK"
}

# Verificar arquivo .env
check_env_file() {
    log_info "Verificando arquivo .env..."
    if [ ! -f .env ]; then
        log_warn "Arquivo .env não encontrado. Criando arquivo padrão..."
        cat > .env << EOF
# Database
POSTGRES_USER=rjchronos
POSTGRES_PASSWORD=rjchronos123
POSTGRES_DB=rjchronos

# RabbitMQ
RABBITMQ_DEFAULT_USER=rjchronos
RABBITMQ_DEFAULT_PASS=rjchronos123

# Redis
REDIS_PASSWORD=rjchronos123

# JWT
UI_JWT_SECRET=your-secret-key-here
EOF
        log_info "Arquivo .env criado. Por favor, revise as configurações."
    else
        log_info "Arquivo .env encontrado"
    fi
}

# Criar diretórios necessários
create_directories() {
    log_info "Criando diretórios necessários..."

    # Diretórios para logs
    mkdir -p logs/backend-api
    mkdir -p logs/olt-manager-huawei
    mkdir -p logs/consumers

    # Diretórios para dados persistentes (se não existirem)
    mkdir -p data/postgresql
    mkdir -p data/clickhouse
    mkdir -p data/rabbitmq

    log_info "Diretórios criados"
}

# Configurar permissões
setup_permissions() {
    log_info "Configurando permissões..."

    # Permissões para logs
    chmod 755 logs/
    chmod 755 logs/*/

    # Permissões para dados
    chmod 755 data/
    chmod 755 data/*/

    log_info "Permissões configuradas"
}

# Validar configurações de logging
validate_logging_configs() {
    log_info "Validando configurações de logging..."

    # Verificar se arquivos de configuração existem
    configs=(
        "services/backend-api/config/logging.yml"
        "services/olts-managers/olt-manager-huawei/config/logging.yml"
    )

    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            log_info "✅ $config encontrado"
        else
            log_warn "⚠️ $config não encontrado"
        fi
    done
}

# Build das imagens Docker
build_images() {
    log_info "Fazendo build das imagens Docker..."

    log_info "Building shared library..."
    # A shared library será copiada durante o build dos serviços

    log_info "Building PostgreSQL consumer..."
    docker build -t rjchronos/log-consumer-postgresql ./services/log-consumer-postgresql/

    log_info "Building ClickHouse consumer..."
    docker build -t rjchronos/log-consumer-clickhouse ./services/log-consumer-clickhouse/

    log_info "Building log monitor..."
    docker build -t rjchronos/log-monitor ./services/log-monitor/

    log_info "Build das imagens concluído"
}

# Iniciar serviços base
start_base_services() {
    log_info "Iniciando serviços base (PostgreSQL, RabbitMQ, ClickHouse)..."

    # Usar docker-compose ou docker compose baseado na disponibilidade
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # Iniciar apenas serviços de infraestrutura primeiro
    $COMPOSE_CMD up -d db-app rabbitmq clickhouse

    log_info "Aguardando serviços ficarem prontos..."
    sleep 30

    # Verificar se serviços estão rodando
    check_service_health "db-app" "PostgreSQL"
    check_service_health "rabbitmq" "RabbitMQ"
    check_service_health "clickhouse" "ClickHouse"
}

# Função para verificar saúde dos serviços
check_service_health() {
    local service_name=$1
    local display_name=$2

    log_info "Verificando $display_name..."

    if docker ps | grep -q $service_name; then
        log_info "✅ $display_name está rodando"
    else
        log_error "❌ $display_name não está rodando"
        exit 1
    fi
}

# Setup do ClickHouse
setup_clickhouse() {
    log_info "Configurando ClickHouse..."

    # Esperar ClickHouse ficar disponível
    log_info "Aguardando ClickHouse ficar disponível..."

    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8123 > /dev/null; then
            log_info "ClickHouse disponível"
            break
        fi

        log_info "Tentativa $attempt/$max_attempts - aguardando ClickHouse..."
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "ClickHouse não ficou disponível após $max_attempts tentativas"
        exit 1
    fi

    # Executar script de setup
    log_info "Executando setup do schema ClickHouse..."
    cd services/log-consumer-clickhouse/
    chmod +x setup_clickhouse.sh
    ./setup_clickhouse.sh
    cd ../..

    log_info "ClickHouse configurado com sucesso"
}

# Executar migrações PostgreSQL
run_migrations() {
    log_info "Executando migrações PostgreSQL..."

    # Aguardar PostgreSQL ficar disponível
    log_info "Aguardando PostgreSQL ficar disponível..."
    sleep 10

    # As migrações serão executadas quando o backend-api iniciar
    log_info "Migrações serão executadas automaticamente pelo backend-api"
}

# Iniciar consumers de log
start_log_consumers() {
    log_info "Iniciando consumers de log..."

    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    $COMPOSE_CMD up -d log-consumer-postgresql log-consumer-clickhouse

    log_info "Aguardando consumers iniciarem..."
    sleep 10

    # Verificar se consumers estão rodando
    check_service_health "log-consumer-postgresql" "PostgreSQL Consumer"
    check_service_health "log-consumer-clickhouse" "ClickHouse Consumer"
}

# Iniciar monitor
start_monitor() {
    log_info "Iniciando monitor do sistema de logging..."

    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    $COMPOSE_CMD up -d log-monitor

    log_info "Aguardando monitor iniciar..."
    sleep 10

    check_service_health "log-monitor" "Log Monitor"
}

# Verificação final
final_verification() {
    log_info "Executando verificação final do sistema..."

    log_info "Verificando endpoints de saúde..."

    # Verificar RabbitMQ Management
    if curl -s http://localhost:15672 > /dev/null; then
        log_info "✅ RabbitMQ Management disponível em http://localhost:15672"
    else
        log_warn "⚠️ RabbitMQ Management não disponível"
    fi

    # Verificar ClickHouse
    if curl -s http://localhost:8123 > /dev/null; then
        log_info "✅ ClickHouse disponível em http://localhost:8123"
    else
        log_warn "⚠️ ClickHouse não disponível"
    fi

    # Verificar Log Monitor
    if curl -s http://localhost:8083/health > /dev/null; then
        log_info "✅ Log Monitor disponível em http://localhost:8083"
    else
        log_warn "⚠️ Log Monitor não disponível"
    fi

    # Verificar Prometheus metrics
    if curl -s http://localhost:8000 > /dev/null; then
        log_info "✅ Prometheus metrics disponível em http://localhost:8000"
    else
        log_warn "⚠️ Prometheus metrics não disponível"
    fi
}

# Exibir resumo
show_summary() {
    echo ""
    echo "🎉 Sistema de Logging Configurado com Sucesso!"
    echo "=============================================="
    echo ""
    echo "📊 Endpoints Disponíveis:"
    echo "   • RabbitMQ Management: http://localhost:15672"
    echo "   • ClickHouse: http://localhost:8123"
    echo "   • Log Monitor Health: http://localhost:8083/health"
    echo "   • Log Monitor Metrics: http://localhost:8083/metrics/detailed"
    echo "   • Prometheus Metrics: http://localhost:8000"
    echo ""
    echo "🔑 Credenciais (definidas no .env):"
    echo "   • RabbitMQ: rjchronos / rjchronos123"
    echo "   • PostgreSQL: rjchronos / rjchronos123"
    echo "   • ClickHouse: default / (sem senha)"
    echo ""
    echo "📋 Comandos Úteis:"
    echo "   • Ver logs: docker-compose logs -f [serviço]"
    echo "   • Status: docker-compose ps"
    echo "   • Parar: docker-compose down"
    echo "   • Health check: curl http://localhost:8083/health"
    echo ""
    echo "📁 Localização dos Logs:"
    echo "   • Backend API: logs/backend-api/"
    echo "   • OLT Manager: logs/olt-manager-huawei/"
    echo "   • Consumers: logs/consumers/"
    echo ""
}

# Função principal
main() {
    log_info "Iniciando setup do sistema de logging..."

    check_docker
    check_docker_compose
    check_env_file
    create_directories
    setup_permissions
    validate_logging_configs
    build_images
    start_base_services
    setup_clickhouse
    run_migrations
    start_log_consumers
    start_monitor
    final_verification
    show_summary

    log_info "Setup concluído com sucesso! 🎉"
}

# Verificar se script está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
