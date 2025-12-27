from typing import Optional

from pydantic import BaseModel, ConfigDict


class SnmpWalkItem(BaseModel):
    oid: str
    value: str
    value_hex: Optional[str] = None
    value_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
