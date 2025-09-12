from pydantic import BaseModel
from typing import Optional

class ONT(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    type: str
    line_profile: str
    last_up_time: str
    status: str

    class Config:
        orm_mode = True
