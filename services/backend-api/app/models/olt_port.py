from sqlalchemy import Column, Integer, BigInteger, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database.base import Base


class OltPort(Base):
    """Modelo da tabela de Portas da OLT."""

    __tablename__ = "olt_ports"

    id = Column(BigInteger, primary_key=True)
    olt_id = Column(BigInteger, ForeignKey("olts.id"), nullable=False)
    slot = Column(Integer, nullable=False)
    port_number = Column(Integer, nullable=False)

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
    olt = relationship("Olt", back_populates="ports")
    devices = relationship("Device", back_populates="olt_port")
