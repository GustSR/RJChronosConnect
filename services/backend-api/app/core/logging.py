"""
Integração do sistema de logging avançado no backend-api.

Configura e inicializa o logger compartilhado com routing inteligente.
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório raiz do repo ao path para importar shared/*
current_path = Path(__file__).resolve()
repo_root = None
for parent in (current_path, *current_path.parents):
    if (parent / "shared").is_dir():
        repo_root = parent
        break
if repo_root is None:
    repo_root = current_path.parents[2] if len(current_path.parents) > 2 else current_path.parent
sys.path.insert(0, str(repo_root))

from shared.logging import setup_logging, LoggingConfig

# Logger global para a aplicação
logger = None


async def init_logging():
    """
    Inicializa o sistema de logging para o backend-api.

    Returns:
        MicroserviceLogger: Logger configurado
    """
    global logger

    try:
        # Determinar caminho do arquivo de configuração
        config_path = os.getenv(
            "LOGGING_CONFIG_PATH",
            "config/logging.yml"
        )

        # Substituir variáveis de ambiente na URL do RabbitMQ
        if "RABBITMQ_URL" in os.environ:
            rabbitmq_url = os.environ["RABBITMQ_URL"]
        else:
            user = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
            password = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
            host = os.getenv("RABBITMQ_HOST", "localhost")
            port = os.getenv("RABBITMQ_PORT", "5672")
            rabbitmq_url = f"amqp://{user}:{password}@{host}:{port}"

        # Carregar configuração base
        if os.path.exists(config_path):
            config = LoggingConfig.from_file(config_path)
        else:
            # Configuração padrão se arquivo não existir
            config = LoggingConfig(
                service_name="backend-api",
                service_version="1.0.0"
            )

        # Substituir URL do RabbitMQ
        config.transport.url = rabbitmq_url

        # Configurar path de fallback baseado no ambiente
        log_dir = os.getenv("LOG_DIR", "/var/log")
        config.fallback.path = f"{log_dir}/backend-api.log"

        # Inicializar logger
        logger = setup_logging("backend-api", config_path if os.path.exists(config_path) else None)

        # Log de inicialização
        await logger.info(
            "system_startup",
            "Sistema de logging inicializado",
            service_version=config.service_version,
            config_source=config_path if os.path.exists(config_path) else "default"
        )

        return logger

    except Exception as e:
        print(f"ERRO CRÍTICO: Falha ao inicializar logging: {e}", file=sys.stderr)
        # Em caso de falha, criar logger básico
        logger = setup_logging("backend-api")
        return logger


async def get_logger():
    """
    Retorna o logger da aplicação.

    Returns:
        MicroserviceLogger: Logger configurado
    """
    global logger
    if logger is None:
        logger = await init_logging()
    return logger


# Funções de conveniência para logging
async def log_user_action(user_id: int, action: str, details: dict = None, **context):
    """
    Log de ação do usuário (crítico - vai para PostgreSQL).

    Args:
        user_id: ID do usuário
        action: Ação realizada
        details: Detalhes adicionais
        **context: Contexto adicional
    """
    logger = await get_logger()

    await logger.info(
        action,
        f"Usuário {user_id} executou: {action}",
        user_id=user_id,
        details=details,
        **context
    )


async def log_equipment_access(user_id: int, customer_id: int, equipment_type: str, equipment_id: int, action: str, **context):
    """
    Log de acesso a equipamento (crítico - compliance ANATEL).

    Args:
        user_id: ID do usuário
        customer_id: ID do cliente
        equipment_type: Tipo do equipamento (olt, ont, etc)
        equipment_id: ID do equipamento
        action: Ação realizada
        **context: Contexto adicional
    """
    logger = await get_logger()

    event_type = f"customer_equipment_access"

    await logger.warning(
        event_type,
        f"Acesso a {equipment_type} ID {equipment_id} do cliente {customer_id}",
        user_id=user_id,
        customer_id=customer_id,
        equipment_type=equipment_type,
        equipment_id=equipment_id,
        action=action,
        **context
    )


async def log_configuration_change(user_id: int, target_type: str, target_id: int, changes: dict, **context):
    """
    Log de mudança de configuração (crítico - compliance).

    Args:
        user_id: ID do usuário
        target_type: Tipo do alvo (olt, ont, etc)
        target_id: ID do alvo
        changes: Mudanças realizadas
        **context: Contexto adicional
    """
    logger = await get_logger()

    event_type = f"{target_type}_configuration_change"

    await logger.warning(
        event_type,
        f"Configuração alterada em {target_type} ID {target_id}",
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
        changes=changes,
        **context
    )


async def log_api_request(endpoint: str, method: str, user_id: int = None, response_time: float = None, status_code: int = None, **context):
    """
    Log de requisição da API (operacional - vai para ClickHouse).

    Args:
        endpoint: Endpoint acessado
        method: Método HTTP
        user_id: ID do usuário (se autenticado)
        response_time: Tempo de resposta em ms
        status_code: Código de status HTTP
        **context: Contexto adicional
    """
    logger = await get_logger()

    await logger.info(
        "api_request",
        f"{method} {endpoint}",
        user_id=user_id,
        endpoint=endpoint,
        method=method,
        response_time_ms=response_time,
        status_code=status_code,
        **context
    )


async def log_security_event(event_type: str, severity: str, description: str, user_id: int = None, **context):
    """
    Log de evento de segurança (crítico - alta prioridade).

    Args:
        event_type: Tipo do evento de segurança
        severity: Severidade (info, warning, error, critical)
        description: Descrição do evento
        user_id: ID do usuário envolvido
        **context: Contexto adicional
    """
    logger = await get_logger()

    # Mapear severidade para método do logger
    log_method = getattr(logger, severity.lower(), logger.error)

    await log_method(
        event_type,
        description,
        user_id=user_id,
        **context
    )


async def log_performance_metric(metric_name: str, metric_value: float, metric_unit: str = None, **context):
    """
    Log de métrica de performance (operacional - ClickHouse).

    Args:
        metric_name: Nome da métrica
        metric_value: Valor da métrica
        metric_unit: Unidade da métrica
        **context: Contexto adicional
    """
    logger = await get_logger()

    await logger.info(
        "performance_metric",
        f"Métrica {metric_name}: {metric_value} {metric_unit or ''}",
        metric_name=metric_name,
        metric_value=metric_value,
        metric_unit=metric_unit,
        **context
    )


async def log_error(error: Exception, context_description: str, **context):
    """
    Log de erro da aplicação.

    Args:
        error: Exceção capturada
        context_description: Descrição do contexto onde ocorreu o erro
        **context: Contexto adicional
    """
    logger = await get_logger()

    await logger.error(
        "application_error",
        f"Erro em {context_description}: {str(error)}",
        error_type=type(error).__name__,
        error_message=str(error),
        context_description=context_description,
        **context
    )


async def cleanup_logging():
    """Limpa recursos do logging ao finalizar a aplicação."""
    global logger
    if logger:
        await logger.close()
