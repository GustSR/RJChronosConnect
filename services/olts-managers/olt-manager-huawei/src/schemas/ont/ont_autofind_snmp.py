from typing import Optional

from pydantic import BaseModel


class OntAutofindSnmpInfo(BaseModel):
    serial_number: Optional[str] = None
    ont_type: Optional[str] = None
    state: Optional[str] = None
    if_index: Optional[int] = None
    port: Optional[str] = None
    ont_id: Optional[int] = None
    autofind_time: Optional[str] = None
