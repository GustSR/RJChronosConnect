from pydantic import BaseModel

class ServicePort(BaseModel):
    index: int
    vlan_id: int
    traffic_profile: str
    port: str
    ont_id: int

    class Config:
        orm_mode = True
