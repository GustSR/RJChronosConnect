"""
Configuração de logging para microserviços.

Define estruturas de configuração YAML e validação de tipos de evento.
"""

import os
import yaml
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class LogLevel(str, Enum):
    """Níveis de log suportados."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class LogDestination(str, Enum):
    """Destinos possíveis para logs."""
    POSTGRESQL = "postgresql"
    CLICKHOUSE = "clickhouse"
    LOCAL_FILE = "local_file"


class ComplianceType(str, Enum):
    """Tipos de compliance suportados."""
    LGPD = "LGPD"
    ANATEL = "ANATEL"
    ITIL = "ITIL"
    ISO27001 = "ISO27001"


@dataclass
class EventTypeConfig:
    """Configuração de um tipo de evento específico."""
    name: str
    destination: LogDestination
    level: LogLevel
    category: str
    retention_period: str
    compliance: List[ComplianceType] = field(default_factory=list)
    pii_fields: List[str] = field(default_factory=list)  # Campos com dados pessoais
    legal_basis: Optional[str] = None  # Base legal LGPD
    description: Optional[str] = None


@dataclass
class TransportConfig:
    """Configuração de transporte (RabbitMQ)."""
    type: str = "rabbitmq"
    url: str = "amqp://localhost:5672"
    exchange: str = "system.logs"
    timeout_ms: int = 1000
    retry_attempts: int = 3
    retry_delay_ms: int = 500


@dataclass
class FallbackConfig:
    """Configuração de fallback local."""
    type: str = "file"
    path: str = "/var/log/service.log"
    rotation: str = "daily"
    retention: str = "7 days"
    max_size_mb: int = 100


@dataclass
class FilterConfig:
    """Configuração de filtros de log."""
    min_level: LogLevel = LogLevel.INFO
    exclude_patterns: List[str] = field(default_factory=list)
    include_only: List[str] = field(default_factory=list)


@dataclass
class RateLimitConfig:
    """Configuração de rate limiting."""
    max_per_second: int = 100
    burst_size: int = 500
    window_seconds: int = 60


@dataclass
class LoggingConfig:
    """Configuração completa de logging para um microserviço."""
    service_name: str
    service_version: str = "1.0.0"
    transport: TransportConfig = field(default_factory=TransportConfig)
    fallback: FallbackConfig = field(default_factory=FallbackConfig)
    filters: FilterConfig = field(default_factory=FilterConfig)
    rate_limit: RateLimitConfig = field(default_factory=RateLimitConfig)
    event_types: List[EventTypeConfig] = field(default_factory=list)

    @classmethod
    def from_file(cls, file_path: str) -> "LoggingConfig":
        """
        Carrega configuração de arquivo YAML.

        Args:
            file_path: Caminho para arquivo de configuração

        Returns:
            Configuração carregada e validada

        Raises:
            FileNotFoundError: Se arquivo não existe
            yaml.YAMLError: Se YAML inválido
            ValueError: Se configuração inválida
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo de configuração não encontrado: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)

        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LoggingConfig":
        """
        Cria configuração a partir de dicionário.

        Args:
            data: Dados de configuração

        Returns:
            Configuração validada
        """
        # Extrair configuração do serviço
        service_config = data.get("service", {})
        service_name = service_config.get("name")
        if not service_name:
            raise ValueError("service.name é obrigatório")

        service_version = service_config.get("version", "1.0.0")

        # Configuração de logging
        logging_config = data.get("logging", {})

        # Transport
        transport_data = logging_config.get("transport", {})
        transport = TransportConfig(
            type=transport_data.get("type", "rabbitmq"),
            url=transport_data.get("url", os.getenv("RABBITMQ_URL", "amqp://localhost:5672")),
            exchange=transport_data.get("exchange", "system.logs"),
            timeout_ms=transport_data.get("timeout_ms", 1000),
            retry_attempts=transport_data.get("retry_attempts", 3),
            retry_delay_ms=transport_data.get("retry_delay_ms", 500)
        )

        # Fallback
        fallback_data = logging_config.get("fallback", {})
        fallback = FallbackConfig(
            type=fallback_data.get("type", "file"),
            path=fallback_data.get("path", f"/var/log/{service_name}.log"),
            rotation=fallback_data.get("rotation", "daily"),
            retention=fallback_data.get("retention", "7 days"),
            max_size_mb=fallback_data.get("max_size_mb", 100)
        )

        # Filtros
        filters_data = logging_config.get("filters", {})
        filters = FilterConfig(
            min_level=LogLevel(filters_data.get("min_level", "info")),
            exclude_patterns=filters_data.get("exclude_patterns", []),
            include_only=filters_data.get("include_only", [])
        )

        # Rate limit
        rate_limit_data = logging_config.get("rate_limit", {})
        rate_limit = RateLimitConfig(
            max_per_second=rate_limit_data.get("max_per_second", 100),
            burst_size=rate_limit_data.get("burst_size", 500),
            window_seconds=rate_limit_data.get("window_seconds", 60)
        )

        # Event types
        event_types = []
        for event_data in logging_config.get("event_types", []):
            event_type = EventTypeConfig(
                name=event_data["name"],
                destination=LogDestination(event_data.get("destination", "clickhouse")),
                level=LogLevel(event_data.get("level", "info")),
                category=event_data.get("category", "operational"),
                retention_period=event_data.get("retention", "6 months"),
                compliance=[ComplianceType(c) for c in event_data.get("compliance", [])],
                pii_fields=event_data.get("pii_fields", []),
                legal_basis=event_data.get("legal_basis"),
                description=event_data.get("description")
            )
            event_types.append(event_type)

        return cls(
            service_name=service_name,
            service_version=service_version,
            transport=transport,
            fallback=fallback,
            filters=filters,
            rate_limit=rate_limit,
            event_types=event_types
        )

    def get_event_config(self, event_type: str) -> Optional[EventTypeConfig]:
        """
        Obtém configuração de um tipo de evento específico.

        Args:
            event_type: Nome do tipo de evento

        Returns:
            Configuração do evento ou None se não encontrado
        """
        for config in self.event_types:
            if config.name == event_type:
                return config
        return None

    def validate(self) -> List[str]:
        """
        Valida configuração e retorna lista de erros.

        Returns:
            Lista de mensagens de erro (vazia se válida)
        """
        errors = []

        # Validar service name
        if not self.service_name or not self.service_name.strip():
            errors.append("service_name não pode estar vazio")

        # Validar transport URL
        if not self.transport.url:
            errors.append("transport.url é obrigatório")

        # Validar event types únicos
        event_names = [et.name for et in self.event_types]
        duplicates = set([name for name in event_names if event_names.count(name) > 1])
        if duplicates:
            errors.append(f"Tipos de evento duplicados: {duplicates}")

        # Validar retention periods
        valid_periods = ["days", "weeks", "months", "years"]
        for event_type in self.event_types:
            if not any(period in event_type.retention_period for period in valid_periods):
                errors.append(f"Período de retenção inválido para {event_type.name}: {event_type.retention_period}")

        return errors