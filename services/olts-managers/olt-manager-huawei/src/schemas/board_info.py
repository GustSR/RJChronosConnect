from pydantic import BaseModel
from typing import Optional

class BoardInfo(BaseModel):
    board_id: int
    board_type: str
    status: str
    sub_type_b: Optional[str] = None
    sub_type_c: Optional[str] = None
    online: Optional[str] = None

    class Config:
        orm_mode = True
