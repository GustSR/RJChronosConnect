"""
Schema para resposta padrão de comandos executados na OLT.
"""

from pydantic import BaseModel
from typing import Optional


class CommandResponse(BaseModel):
    """
    Resposta padrão para comandos executados na OLT.

    Utilizado para operações que retornam status de execução,
    como configurações, provisionamento e operações administrativas.
    """
    success: bool
    message: str
    command: Optional[str] = None
    details: Optional[dict] = None