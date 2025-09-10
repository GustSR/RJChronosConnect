from pydantic import BaseModel
from typing import Optional

class OntPortAttribute(BaseModel):
    admin_state: str
    link_state: str
    speed: str
    duplex: str

    class Config:
        orm_mode = True
