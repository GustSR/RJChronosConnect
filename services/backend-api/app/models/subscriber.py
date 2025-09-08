from sqlalchemy import Column, String, DateTime, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Subscriber(Base):
    """Modelo da tabela de Assinantes (Clientes Finais)."""

    __tablename__ = "subscribers"

    id = Column(BigInteger, primary_key=True)
    full_name = Column(String, index=True, nullable=False)
    cpf_cnpj = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address_street = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamentos
    devices = relationship(
        "Device",
        back_populates="subscriber",
        cascade="all, delete-orphan",
    )
    activity_logs = relationship("ActivityLog", back_populates="subscriber")
