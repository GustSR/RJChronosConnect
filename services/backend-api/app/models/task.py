from sqlalchemy import Column, DateTime, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Task(Base):
    """Modelo da tabela de Tarefas Assíncronas."""

    __tablename__ = "tasks"

    id = Column(BigInteger, primary_key=True)
    parameters = Column(JSONB, nullable=True)
    result = Column(JSONB, nullable=True)

    # Chaves Estrangeiras
    created_by_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    device_id = Column(BigInteger, ForeignKey("devices.id"), nullable=False)
    task_type_id = Column(BigInteger, ForeignKey("task_types.id"), nullable=False)
    status_id = Column(BigInteger, ForeignKey("task_statuses.id"), nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    created_by = relationship("User", back_populates="tasks")
    target_device = relationship("Device", back_populates="tasks")
    task_type = relationship("TaskType", back_populates="tasks")
    status = relationship("TaskStatus", back_populates="tasks")
