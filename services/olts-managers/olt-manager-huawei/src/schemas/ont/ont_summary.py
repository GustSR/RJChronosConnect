from pydantic import BaseModel, ConfigDict

class ONTSummary(BaseModel):
    port: str
    ont_id: int
    serial_number: str
    control_flag: str
    run_state: str
    config_state: str

    model_config = ConfigDict(from_attributes=True)
