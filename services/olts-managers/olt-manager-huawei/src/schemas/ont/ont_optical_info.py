from pydantic import BaseModel
from typing import Optional

class ONTOpticalInfo(BaseModel):
    rx_power: Optional[float]
    tx_power: Optional[float]
    temperature: Optional[float]
    voltage: Optional[float]
    tx_bias_current: Optional[float]

    class Config:
        orm_mode = True
