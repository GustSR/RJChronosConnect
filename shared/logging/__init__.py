"""
Shared logging library para microserviços RJChronosConnect.

Esta biblioteca implementa logging event-driven com routing inteligente
entre PostgreSQL (logs críticos) e ClickHouse (logs operacionais).
"""

from .microservice_logger import MicroserviceLogger
from .config import LoggingConfig
from .routing import LogRouter

__version__ = "1.0.0"
__all__ = ["MicroserviceLogger", "LoggingConfig", "LogRouter"]


def setup_logging(service_name: str, config_path: str = None) -> MicroserviceLogger:
    """
    Setup padrão para logging em qualquer microserviço.

    Args:
        service_name: Nome do microserviço
        config_path: Caminho para arquivo de configuração (opcional)

    Returns:
        Logger configurado e pronto para uso

    Example:
        >>> logger = setup_logging("olt-manager-huawei")
        >>> await logger.info("sysname_change", "OLT renamed", olt_id=123)
    """
    config = LoggingConfig.from_file(config_path or f"config/logging.yml")
    logger = MicroserviceLogger(service_name, config)

    # Auto-discovery de tipos de evento do config
    logger.register_event_types(config.event_types)

    return logger