from sqlalchemy import Column, String, DateTime, BigInteger, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class User(Base):
    """Modelo da tabela de Usuarios (Administradores do Sistema)."""

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    external_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    activity_logs = relationship("ActivityLog", back_populates="user")
    tasks = relationship("Task", back_populates="created_by")
