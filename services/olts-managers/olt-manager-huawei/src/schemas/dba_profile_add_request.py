from pydantic import BaseModel, Field

class DbaProfileAddRequest(BaseModel):
    profile_name: str = Field(..., description="Name for the new DBA profile.")
    profile_type: int = Field(..., description="Type of the DBA profile (e.g., 3).", ge=1, le=5)
    assure_kbps: int = Field(..., description="Assured bandwidth in Kbps.")
    max_kbps: int = Field(..., description="Maximum bandwidth in Kbps.")
