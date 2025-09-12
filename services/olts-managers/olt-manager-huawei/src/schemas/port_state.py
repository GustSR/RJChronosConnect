from pydantic import BaseModel

class PortState(BaseModel):
    admin_state: str
    link_state: str

    class Config:
        orm_mode = True
