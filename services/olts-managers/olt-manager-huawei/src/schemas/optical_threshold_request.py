# -*- coding: utf-8 -*-
"""
Schema para requisição de configuração de threshold óptico.
"""

from pydantic import BaseModel, Field, validator
from typing import Literal

class OpticalThresholdRequest(BaseModel):
    """Dados para configurar threshold óptico."""
    
    frame: int = Field(..., ge=0, le=15, description="Frame da interface")
    slot: int = Field(..., ge=0, le=20, description="Slot da interface") 
    port: int = Field(..., ge=0, le=15, description="Porta da interface")
    parameter: Literal["rx-power", "tx-power", "bias", "temperature", "voltage"] = Field(
        ..., description="Parâmetro a configurar"
    )
    limit_type: Literal["lower-limit", "upper-limit"] = Field(
        ..., description="Tipo de limite"
    )
    value: float = Field(..., description="Valor do threshold")
    
    @validator('value')
    def validate_threshold_value(cls, v, values):
        """Valida se o valor está dentro dos limites aceitáveis."""
        parameter = values.get('parameter')
        
        validation_ranges = {
            "rx-power": (-50.0, 10.0),  # dBm
            "tx-power": (-10.0, 10.0),  # dBm  
            "bias": (0.0, 100.0),       # mA
            "temperature": (-40.0, 85.0), # °C
            "voltage": (2.5, 5.5)       # V
        }
        
        if parameter in validation_ranges:
            min_val, max_val = validation_ranges[parameter]
            if not (min_val <= v <= max_val):
                raise ValueError(f"Valor deve estar entre {min_val} e {max_val} para {parameter}")
        
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "frame": 0,
                "slot": 1,
                "port": 0,
                "parameter": "rx-power",
                "limit_type": "lower-limit",
                "value": -28.0
            }
        }