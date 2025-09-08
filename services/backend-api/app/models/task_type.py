from sqlalchemy import Column, String, BigInteger
from sqlalchemy.orm import relationship

from app.database.base import Base


class TaskType(Base):
    """Modelo da tabela de lookup para Tipos de Tarefas."""

    __tablename__ = "task_types"

    id = Column(BigInteger, primary_key=True)
    name = Column(String, unique=True, nullable=False, doc="Ex: reprovisionar, resetar, alterar perfil")

    tasks = relationship("Task", back_populates="task_type")
