from pydantic import BaseModel, ConfigDict
from typing import Optional

class ONT(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    type: str
    line_profile: str
    last_up_time: str
    status: str

    model_config = ConfigDict(from_attributes=True)
