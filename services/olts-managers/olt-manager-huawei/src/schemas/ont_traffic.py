from pydantic import BaseModel

class OntTraffic(BaseModel):
    port_index: int
    ingress_bytes: int
    egress_bytes: int

    class Config:
        orm_mode = True
