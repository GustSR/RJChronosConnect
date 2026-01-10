from pydantic import BaseModel
from typing import Optional

class ONTAddRequest(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    line_profile: str
    srv_profile: str
    description: Optional[str] = None
    ont_type: Optional[str] = None
