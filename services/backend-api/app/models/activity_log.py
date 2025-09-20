from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.base import Base


class ActivityLog(Base):
    """Modelo da tabela de Logs de Atividade (Trilha de Auditoria) expandido."""

    __tablename__ = "activity_logs"

    id = Column(BigInteger, primary_key=True)
    action = Column(String, nullable=False, doc="Ação realizada, ex: 'user_login', 'device_reboot'")
    details = Column(JSONB, nullable=True, doc="Detalhes em JSON sobre o evento.")

    # Campos expandidos para sistema de logging avançado
    # Identificadores únicos
    trace_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    message_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=True)

    # Metadados do serviço
    service_name = Column(String(100), nullable=True, index=True)
    service_version = Column(String(20), nullable=True)

    # Informações expandidas do evento
    event_type = Column(String(100), nullable=True, index=True)
    category = Column(String(50), nullable=True)
    message = Column(Text, nullable=True)

    # Dados do usuário com cuidado LGPD
    session_id = Column(String(100), nullable=True)
    customer_id_ref = Column(BigInteger, nullable=True, index=True)

    # Compliance e auditoria
    compliance_tags = Column(JSONB, nullable=True)
    legal_basis = Column(String(100), nullable=True)
    retention_period = Column(String(50), nullable=True)
    classification = Column(String(20), nullable=True, index=True)

    # Timestamps expandidos
    event_timestamp = Column(DateTime(timezone=True), nullable=True, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Metadados de processamento
    routing_key = Column(String(200), nullable=True)
    queue_name = Column(String(100), nullable=True)
    destination = Column(String(20), nullable=True)

    # Chaves Estrangeiras originais
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    subscriber_id = Column(BigInteger, ForeignKey("subscribers.id"), nullable=True)
    device_id = Column(BigInteger, ForeignKey("devices.id"), nullable=True)
    log_level_id = Column(BigInteger, ForeignKey("log_levels.id"), nullable=False)

    # Timestamps originais
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relacionamentos
    user = relationship("User", back_populates="activity_logs")
    subscriber = relationship("Subscriber", back_populates="activity_logs")
    device = relationship("Device", back_populates="activity_logs")
    log_level = relationship("LogLevel", back_populates="activity_logs")


class LogComplianceRule(Base):
    """Regras de compliance para tipos de evento."""

    __tablename__ = "log_compliance_rules"

    id = Column(BigInteger, primary_key=True)
    event_type = Column(String(100), nullable=False, index=True)
    compliance_type = Column(String(50), nullable=False, index=True)
    retention_period = Column(String(50), nullable=False)
    legal_basis = Column(String(100), nullable=True)
    pii_fields = Column(JSONB, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default='true', index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
