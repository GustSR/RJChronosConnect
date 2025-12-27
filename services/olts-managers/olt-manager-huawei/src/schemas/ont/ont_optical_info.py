from pydantic import BaseModel, ConfigDict
from typing import Optional

class ONTOpticalInfo(BaseModel):
    rx_power: Optional[float]
    tx_power: Optional[float]
    temperature: Optional[float]
    voltage: Optional[float]
    tx_bias_current: Optional[float]

    model_config = ConfigDict(from_attributes=True)
