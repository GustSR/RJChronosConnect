# -*- coding: utf-8 -*-
"""
Schemas para requisições de gerenciamento de VLAN.
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional

class VlanCreateRequest(BaseModel):
    """Dados para criar VLAN."""
    
    vlan_id: int = Field(..., ge=1, le=4094, description="ID da VLAN (1-4094)")
    description: Optional[str] = Field("", max_length=80, description="Descrição da VLAN")
    vlan_type: Literal["smart", "standard"] = Field("smart", description="Tipo da VLAN")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "vlan_id": 100,
            "description": "VLAN para Internet",
            "vlan_type": "smart"
        }
    })

class VlanAssignPortRequest(BaseModel):
    """Dados para associar porta à VLAN."""
    
    vlan_id: int = Field(..., ge=1, le=4094, description="ID da VLAN")
    frame: int = Field(..., ge=0, le=15, description="Frame da porta")
    slot: int = Field(..., ge=0, le=20, description="Slot da porta")
    port: int = Field(..., ge=0, le=15, description="Número da porta")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "vlan_id": 100,
            "frame": 0,
            "slot": 10,
            "port": 0
        }
    })
