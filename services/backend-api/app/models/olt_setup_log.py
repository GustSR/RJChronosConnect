from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class OltSetupLog(Base):
    """Modelo da tabela de Logs de Configuração de OLT."""

    __tablename__ = "olt_setup_logs"

    id = Column(BigInteger, primary_key=True)
    action = Column(String, nullable=False, doc="Ação realizada: 'discovery', 'ssh_setup', 'snmp_setup', 'trap_setup'")
    status = Column(String, nullable=False, doc="Status da ação: 'pending', 'in_progress', 'success', 'failed'")
    message = Column(Text, nullable=True, doc="Mensagem detalhada do resultado da operação")
    details = Column(JSONB, nullable=True, doc="Detalhes técnicos em JSON (comandos, respostas, erros)")
    
    # Informações da execução
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(BigInteger, nullable=True, doc="Duração da operação em segundos")
    
    # Chave Estrangeira
    olt_id = Column(BigInteger, ForeignKey("olts.id"), nullable=False)
    executed_by_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True, 
                                doc="Usuário que iniciou a operação (null para operações automáticas)")

    # Relacionamentos
    olt = relationship("Olt", back_populates="setup_logs")
    executed_by = relationship("User")