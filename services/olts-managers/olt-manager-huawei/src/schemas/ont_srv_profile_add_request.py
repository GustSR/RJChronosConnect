from pydantic import BaseModel, Field

class OntSrvProfileAddRequest(BaseModel):
    profile_name: str = Field(..., description="Name for the new ONT service profile.")
    pots_ports: int = Field(0, description="Number of POTS (voice) ports.")
    eth_ports: int = Field(1, description="Number of Ethernet ports.")
