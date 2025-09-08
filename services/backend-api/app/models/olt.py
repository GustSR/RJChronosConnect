from sqlalchemy import Column, String, DateTime, BigInteger
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Olt(Base):
    """Modelo da tabela de OLTs (Optical Line Terminals)."""

    __tablename__ = "olts"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(INET, unique=True, nullable=False)
    vendor = Column(String, nullable=True)
    model = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamento com as Portas da OLT
    ports = relationship(
        "OltPort",
        back_populates="olt",
        cascade="all, delete-orphan",
    )
