from pydantic import BaseModel
from typing import Optional

class OLTBase(BaseModel):
    name: str
    ip_address: str
    vendor: Optional[str] = None
    model: Optional[str] = None

class OLTCreate(OLTBase):
    pass

class OLTUpdate(OLTBase):
    pass

class OLT(OLTBase):
    id: int

    class Config:
        orm_mode = True
