from pydantic import BaseModel
from typing import Optional


class OLTCredentials(BaseModel):
    id: int
    host: str
    username: Optional[str] = None
    password: Optional[str] = None
    snmp_community: Optional[str] = None
    ssh_port: Optional[int] = None
