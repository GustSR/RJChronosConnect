from typing import Optional

from pydantic import BaseModel, ConfigDict


class GponPort(BaseModel):
    if_index: int
    if_name: Optional[str] = None
    port: Optional[str] = None
    frame: Optional[int] = None
    slot: Optional[int] = None
    pon: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
