# -*- coding: utf-8 -*-
"""
Schema para requisição de configuração de senha GPON.
"""

from pydantic import BaseModel, Field, validator

class GponPasswordRequest(BaseModel):
    """Dados para configurar senha GPON."""
    
    frame: int = Field(..., ge=0, le=15, description="Frame da interface GPON")
    slot: int = Field(..., ge=0, le=20, description="Slot da interface GPON")
    password: str = Field(..., min_length=8, max_length=16, description="Senha de autenticação (8-16 caracteres)")
    
    @validator('password')
    def validate_password(cls, v):
        """Valida se a senha contém apenas caracteres válidos."""
        if not v.isalnum():
            raise ValueError("Senha deve conter apenas caracteres alfanuméricos")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "frame": 0,
                "slot": 1,
                "password": "12345678"
            }
        }