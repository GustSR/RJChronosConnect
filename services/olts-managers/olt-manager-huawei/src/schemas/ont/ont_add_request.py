from pydantic import BaseModel

class ONTAddRequest(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    line_profile: str
    srv_profile: str
