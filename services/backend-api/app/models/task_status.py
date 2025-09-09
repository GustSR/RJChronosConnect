from sqlalchemy import Column, String, BigInteger
from sqlalchemy.orm import relationship

from app.database.base import Base


class TaskStatus(Base):
    """Modelo da tabela de lookup para Status de Tarefas."""

    __tablename__ = "task_statuses"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False, doc="Ex: pendente, em andamento, concluída, falhou")

    tasks = relationship("Task", back_populates="status")
