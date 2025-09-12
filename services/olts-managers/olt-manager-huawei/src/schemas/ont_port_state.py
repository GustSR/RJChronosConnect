from pydantic import BaseModel

class ONTPortState(BaseModel):
    port_index: int
    status: str
