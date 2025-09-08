from sqlalchemy import Column, String, BigInteger
from sqlalchemy.orm import relationship

from app.database.base import Base


class LogLevel(Base):
    """Modelo da tabela de lookup para Níveis de Log."""

    __tablename__ = "log_levels"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False, doc="info, warning, error, critical")

    activity_logs = relationship("ActivityLog", back_populates="log_level")
