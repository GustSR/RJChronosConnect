from pydantic import BaseModel
from typing import Optional, Dict


class OLTLiveInfo(BaseModel):
    olt_id: int
    reachable: bool
    version: Optional[str] = None
    sysname: Optional[str] = None
    errors: Optional[Dict[str, str]] = None
