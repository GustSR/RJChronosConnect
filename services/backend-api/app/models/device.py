from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import MACADDR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Device(Base):
    """Modelo da tabela de Dispositivos (ONUs/ONTs)."""

    __tablename__ = "devices"

    id = Column(BigInteger, primary_key=True)
    serial_number = Column(String, unique=True, index=True, nullable=False)
    mac_address = Column(MACADDR, nullable=True)
    genieacs_id = Column(String, unique=True, nullable=True, doc="O _id do dispositivo no GenieACS")

    # Chaves Estrangeiras
    subscriber_id = Column(BigInteger, ForeignKey("subscribers.id"), nullable=False)
    olt_port_id = Column(BigInteger, ForeignKey("olt_ports.id"), nullable=False)
    status_id = Column(BigInteger, ForeignKey("device_statuses.id"), nullable=False)

    # Timestamps
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
    subscriber = relationship("Subscriber", back_populates="devices")
    olt_port = relationship("OltPort", back_populates="devices")
    status = relationship("DeviceStatus", back_populates="devices")
    tasks = relationship("Task", back_populates="target_device")
    activity_logs = relationship("ActivityLog", back_populates="device")
