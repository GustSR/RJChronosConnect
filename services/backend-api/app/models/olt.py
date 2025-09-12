from sqlalchemy import Column, String, DateTime, BigInteger, Integer, Boolean
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

    # Campos de descoberta e configuração automática
    ssh_username = Column(String, nullable=True, doc="Usuário SSH para configuração automática")
    ssh_password = Column(String, nullable=True, doc="Senha SSH para configuração automática")
    ssh_port = Column(Integer, default=22, nullable=False, doc="Porta SSH para conexão")
    setup_status = Column(
        String, 
        default='pending', 
        nullable=False,
        doc="Status da configuração: 'pending', 'configured', 'failed'"
    )
    is_configured = Column(
        Boolean, 
        default=False, 
        nullable=False,
        doc="Flag indicando se OLT está completamente configurada"
    )
    discovered_at = Column(
        DateTime(timezone=True), 
        nullable=True,
        doc="Timestamp de quando a OLT foi descoberta automaticamente"
    )
    last_sync_at = Column(
        DateTime(timezone=True), 
        nullable=True,
        doc="Timestamp da última sincronização bem-sucedida"
    )

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
    
    # Relacionamento com logs de configuração
    setup_logs = relationship(
        "OltSetupLog",
        back_populates="olt",
        cascade="all, delete-orphan",
    )
