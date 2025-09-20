"""
Sistema de roteamento inteligente de logs.

Determina automaticamente o destino (PostgreSQL vs ClickHouse)
baseado no tipo de evento e configurações de compliance.
"""

import re
from typing import Dict, Any, Optional
from enum import Enum

from .config import LogDestination, EventTypeConfig, ComplianceType


class LogCategory(str, Enum):
    """Categorias de log para roteamento."""
    AUTHENTICATION = "authentication"
    DATA_ACCESS = "data_access"
    CONFIGURATION = "configuration"
    SECURITY = "security"
    EQUIPMENT_ACTIVATION = "equipment_activation"
    MONITORING = "monitoring"
    PERFORMANCE = "performance"
    AUTOMATION = "automation"
    DEBUG = "debug"


class LogRouter:
    """
    Roteador inteligente de logs.

    Determina o destino adequado baseado em:
    - Tipo de evento
    - Categoria
    - Nível de criticidade
    - Requisitos de compliance
    - Volume esperado
    """

    def __init__(self):
        # Mapeamento de eventos críticos que sempre vão para PostgreSQL
        self.critical_events = {
            "user_login", "user_logout", "user_password_change",
            "customer_equipment_access", "customer_data_view",
            "equipment_configuration_change", "olt_sysname_change",
            "security_incident", "unauthorized_access",
            "equipment_activation", "equipment_deactivation",
            "ont_activation", "ont_deactivation"
        }

        # Mapeamento de eventos operacionais que vão para ClickHouse
        self.operational_events = {
            "ont_status_monitoring", "ont_power_level",
            "equipment_performance_metric", "port_utilization",
            "monitoring_command_executed", "automated_command",
            "equipment_trap_received", "snmp_trap",
            "connection_status_change", "signal_quality"
        }

        # Padrões que sempre vão para arquivo local
        self.debug_patterns = [
            r".*_debug$",
            r"connection_.*",
            r"pool_.*",
            r"cache_.*",
            r"performance_trace"
        ]

    def determine_destination(self,
                            event_type: str,
                            event_config: Optional[EventTypeConfig] = None,
                            log_level: str = "info",
                            context: Dict[str, Any] = None) -> LogDestination:
        """
        Determina o destino do log baseado em múltiplos fatores.

        Args:
            event_type: Tipo do evento
            event_config: Configuração específica do evento (se disponível)
            log_level: Nível do log
            context: Contexto adicional do log

        Returns:
            Destino determinado para o log
        """
        context = context or {}

        # 1. Se há configuração específica, usar ela
        if event_config and event_config.destination:
            return event_config.destination

        # 2. Logs de debug sempre vão para arquivo local
        if log_level.lower() == "debug":
            return LogDestination.LOCAL_FILE

        # 3. Verificar padrões de debug
        for pattern in self.debug_patterns:
            if re.match(pattern, event_type, re.IGNORECASE):
                return LogDestination.LOCAL_FILE

        # 4. Eventos críticos vão para PostgreSQL
        if event_type in self.critical_events:
            return LogDestination.POSTGRESQL

        # 5. Eventos com compliance LGPD/ANATEL vão para PostgreSQL
        if event_config and event_config.compliance:
            has_critical_compliance = any(
                comp in [ComplianceType.LGPD, ComplianceType.ANATEL]
                for comp in event_config.compliance
            )
            if has_critical_compliance:
                return LogDestination.POSTGRESQL

        # 6. Eventos de segurança sempre para PostgreSQL
        if (log_level.lower() in ["error", "critical"] or
            "security" in event_type.lower() or
            "unauthorized" in event_type.lower()):
            return LogDestination.POSTGRESQL

        # 7. Eventos com dados pessoais (PII) para PostgreSQL
        if event_config and event_config.pii_fields:
            return LogDestination.POSTGRESQL

        # 8. Eventos de configuração crítica para PostgreSQL
        if any(keyword in event_type.lower() for keyword in
               ["config", "activation", "deactivation", "change"]):
            return LogDestination.POSTGRESQL

        # 9. Eventos operacionais de alto volume para ClickHouse
        if event_type in self.operational_events:
            return LogDestination.CLICKHOUSE

        # 10. Eventos de monitoramento para ClickHouse
        if any(keyword in event_type.lower() for keyword in
               ["monitoring", "metric", "performance", "status", "trap"]):
            return LogDestination.CLICKHOUSE

        # 11. Padrão: ClickHouse para eventos operacionais
        return LogDestination.CLICKHOUSE

    def get_routing_key(self,
                       service_name: str,
                       destination: LogDestination,
                       log_level: str,
                       event_type: str) -> str:
        """
        Gera routing key para RabbitMQ baseado no destino.

        Args:
            service_name: Nome do microserviço
            destination: Destino determinado
            log_level: Nível do log
            event_type: Tipo do evento

        Returns:
            Routing key para RabbitMQ
        """
        # Mapear destino para sufixo
        destination_suffix = {
            LogDestination.POSTGRESQL: "critical",
            LogDestination.CLICKHOUSE: "operational",
            LogDestination.LOCAL_FILE: "debug"
        }

        suffix = destination_suffix.get(destination, "operational")

        # Formato: service.level.destination
        # Exemplo: olt-manager-huawei.info.critical
        return f"{service_name}.{log_level.lower()}.{suffix}"

    def should_include_pii_data(self,
                              destination: LogDestination,
                              event_config: Optional[EventTypeConfig] = None) -> bool:
        """
        Determina se dados PII devem ser incluídos no log.

        Args:
            destination: Destino do log
            event_config: Configuração do evento

        Returns:
            True se PII pode ser incluído
        """
        # PII apenas em PostgreSQL (compliance LGPD)
        if destination != LogDestination.POSTGRESQL:
            return False

        # Se evento tem campos PII declarados, permitir
        if event_config and event_config.pii_fields:
            return True

        return False

    def get_retention_period(self,
                           destination: LogDestination,
                           event_config: Optional[EventTypeConfig] = None) -> str:
        """
        Determina período de retenção baseado no destino e compliance.

        Args:
            destination: Destino do log
            event_config: Configuração do evento

        Returns:
            Período de retenção
        """
        if event_config and event_config.retention_period:
            return event_config.retention_period

        # Padrões por destino
        retention_defaults = {
            LogDestination.POSTGRESQL: "5 years",  # Compliance
            LogDestination.CLICKHOUSE: "6 months", # Operacional
            LogDestination.LOCAL_FILE: "7 days"    # Debug
        }

        return retention_defaults.get(destination, "6 months")

    def enrich_log_metadata(self,
                          log_entry: Dict[str, Any],
                          destination: LogDestination,
                          event_config: Optional[EventTypeConfig] = None) -> Dict[str, Any]:
        """
        Enriquece log com metadados baseado no destino e configuração.

        Args:
            log_entry: Entrada de log original
            destination: Destino determinado
            event_config: Configuração do evento

        Returns:
            Log enriquecido com metadados
        """
        enriched = log_entry.copy()

        # Adicionar metadados de destinação
        enriched["destination"] = destination.value
        enriched["retention_period"] = self.get_retention_period(destination, event_config)

        # Adicionar metadados de compliance
        if event_config:
            enriched["compliance_tags"] = [c.value for c in event_config.compliance]
            enriched["category"] = event_config.category
            if event_config.legal_basis:
                enriched["legal_basis"] = event_config.legal_basis

        # Classificação de segurança
        if destination == LogDestination.POSTGRESQL:
            enriched["classification"] = "confidential"
        else:
            enriched["classification"] = "internal"

        # Remove campos PII se não deve incluir
        if not self.should_include_pii_data(destination, event_config):
            pii_fields = ["ip_address", "user_agent", "customer_id", "cpf", "email"]
            for field in pii_fields:
                if field in enriched:
                    enriched[field] = "[REDACTED]"

        return enriched