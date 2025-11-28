from sqlalchemy import Column, String, DateTime, BigInteger, Integer, Boolean
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property

from app.database.base import Base
from app.core.crypto import encrypt_credential, decrypt_credential, is_credential_encrypted


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
    _ssh_password_encrypted = Column(String, nullable=True, doc="Senha SSH criptografada")
    _snmp_community_encrypted = Column(String, nullable=True, doc="Community SNMP criptografada")
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

    # Propriedades híbridas para criptografia automática de credenciais
    @hybrid_property
    def ssh_password(self):
        """Propriedade para senha SSH com descriptografia automática."""
        if not self._ssh_password_encrypted:
            return None

        # Se já estiver descriptografado, retorna como está
        if not is_credential_encrypted(self._ssh_password_encrypted):
            return self._ssh_password_encrypted

        return decrypt_credential(self._ssh_password_encrypted)

    @ssh_password.setter
    def ssh_password(self, value):
        """Setter para senha SSH com criptografia automática."""
        if value is None:
            self._ssh_password_encrypted = None
        else:
            # Se já estiver criptografado, não criptografa novamente
            if is_credential_encrypted(value):
                self._ssh_password_encrypted = value
            else:
                self._ssh_password_encrypted = encrypt_credential(value)

    @hybrid_property
    def snmp_community(self):
        """Propriedade para community SNMP com descriptografia automática."""
        if not self._snmp_community_encrypted:
            return "public"  # Valor padrão

        # Se já estiver descriptografado, retorna como está
        if not is_credential_encrypted(self._snmp_community_encrypted):
            return self._snmp_community_encrypted

        return decrypt_credential(self._snmp_community_encrypted)

    @snmp_community.setter
    def snmp_community(self, value):
        """Setter para community SNMP com criptografia automática."""
        if value is None:
            value = "public"  # Valor padrão

        # Se já estiver criptografado, não criptografa novamente
        if is_credential_encrypted(value):
            self._snmp_community_encrypted = value
        else:
            self._snmp_community_encrypted = encrypt_credential(value)
