from sqlalchemy import Column, String, BigInteger
from sqlalchemy.orm import relationship

from app.database.base import Base


class DeviceStatus(Base):
    """Modelo da tabela de lookup para Status de Dispositivos."""

    __tablename__ = "device_statuses"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False, doc="Ex: ativo, desligado, em manutenção")

    # Este relacionamento permite ver todos os dispositivos com um certo status
    devices = relationship("Device", back_populates="status")
