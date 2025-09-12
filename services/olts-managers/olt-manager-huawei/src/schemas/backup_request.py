# -*- coding: utf-8 -*-
"""
Schemas para requisições de backup e restore.
"""

from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional

class BackupRequest(BaseModel):
    """Dados para solicitar backup."""
    
    backup_type: Literal["full", "profiles", "interfaces"] = Field("full", description="Tipo de backup")
    include_passwords: bool = Field(False, description="Incluir senhas no backup")
    
    class Config:
        schema_extra = {
            "example": {
                "backup_type": "full",
                "include_passwords": False
            }
        }

class RestoreRequest(BaseModel):
    """Dados para solicitar restore."""
    
    backup_data: Dict[str, Any] = Field(..., description="Dados do backup a ser restaurado")
    restore_type: Literal["full", "profiles", "interfaces"] = Field("full", description="Tipo de restore")
    
    class Config:
        schema_extra = {
            "example": {
                "backup_data": {
                    "backup_info": {
                        "timestamp": "20241201_143022",
                        "type": "full"
                    },
                    "configuration": {}
                },
                "restore_type": "full"
            }
        }

class ConfigurationQueryRequest(BaseModel):
    """Dados para consultar configuração."""
    
    section: Optional[str] = Field(None, description="Seção específica da configuração")
    save_to_file: bool = Field(False, description="Salvar em arquivo para backup")
    
    class Config:
        schema_extra = {
            "example": {
                "section": "interface",
                "save_to_file": True
            }
        }