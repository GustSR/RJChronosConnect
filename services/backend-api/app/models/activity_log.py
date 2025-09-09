from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class ActivityLog(Base):
    """Modelo da tabela de Logs de Atividade (Trilha de Auditoria)."""

    __tablename__ = "activity_logs"

    id = Column(BigInteger, primary_key=True)
    action = Column(String, nullable=False, doc="Ação realizada, ex: 'user_login', 'device_reboot'")
    details = Column(JSONB, nullable=True, doc="Detalhes em JSON sobre o evento.")

    # Chaves Estrangeiras
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    subscriber_id = Column(BigInteger, ForeignKey("subscribers.id"), nullable=True)
    device_id = Column(BigInteger, ForeignKey("devices.id"), nullable=True)
    log_level_id = Column(BigInteger, ForeignKey("log_levels.id"), nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relacionamentos
    user = relationship("User", back_populates="activity_logs")
    subscriber = relationship("Subscriber", back_populates="activity_logs")
    device = relationship("Device", back_populates="activity_logs")
    log_level = relationship("LogLevel", back_populates="activity_logs")
