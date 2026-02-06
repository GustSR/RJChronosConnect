from pydantic import BaseModel

class OntTr069ConfigRequest(BaseModel):
    port: str
    ont_id: int
    profile_id: int
