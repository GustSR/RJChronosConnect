from pydantic import BaseModel

class OntConfirmRequest(BaseModel):
    serial_number: str
    ont_line_profile_name: str
    ont_srv_profile_name: str
