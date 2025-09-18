# -*- coding: utf-8 -*-
"""
Schemas para requisições de gerenciamento de usuários.
"""

from pydantic import BaseModel, Field, validator
from typing import Literal

class UserCreateRequest(BaseModel):
    """Dados para criar usuário."""
    
    username: str = Field(..., min_length=1, max_length=32, description="Nome do usuário")
    password: str = Field(..., min_length=8, max_length=32, description="Senha do usuário")
    service_type: Literal["ssh", "telnet", "ftp", "web"] = Field("ssh", description="Tipo de serviço")
    privilege_level: int = Field(15, ge=0, le=15, description="Nível de privilégio (0-15)")
    
    @validator('username')
    def validate_username(cls, v):
        """Valida se o nome de usuário contém apenas caracteres válidos."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Nome de usuário deve conter apenas caracteres alfanuméricos, _ ou -")
        return v
    
    @validator('password')
    def validate_password(cls, v):
        """Valida se a senha é segura."""
        if len(v) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "username": "operador",
                "password": "senhaSegura123",
                "service_type": "ssh",
                "privilege_level": 10
            }
        }

class UserPasswordChangeRequest(BaseModel):
    """Dados para alterar senha de usuário."""
    
    new_password: str = Field(..., min_length=8, max_length=32, description="Nova senha")
    
    @validator('new_password')
    def validate_password(cls, v):
        """Valida se a nova senha é segura."""
        if len(v) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "new_password": "novaSenhaSegura456"
            }
        }