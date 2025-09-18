from pydantic import BaseModel

class OntAutofindInfo(BaseModel):
    port: str
    ont_id: int
    loid: str
    password: str
    serial_number: str
    equipment_id: str
