from pydantic import BaseModel

class ONTSummary(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    control_flag: str
    run_state: str
    config_state: str

    class Config:
        orm_mode = True
