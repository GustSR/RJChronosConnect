from pydantic import BaseModel, ConfigDict

class OntTraffic(BaseModel):
    port_index: int
    ingress_bytes: int
    egress_bytes: int

    model_config = ConfigDict(from_attributes=True)
