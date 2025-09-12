from pydantic import BaseModel, Field
from typing import List

class TcontConfig(BaseModel):
    id: int = Field(..., description="T-CONT ID.")
    dba_profile_name: str = Field(..., description="Name of the DBA profile to bind.")

class GemPortConfig(BaseModel):
    id: int = Field(..., description="GEM port ID.")
    tcont_id: int = Field(..., description="ID of the T-CONT to associate with.")

class OntLineProfileAddRequest(BaseModel):
    profile_name: str = Field(..., description="Name for the new ONT line profile.")
    tconts: List[TcontConfig]
    gem_ports: List[GemPortConfig]
