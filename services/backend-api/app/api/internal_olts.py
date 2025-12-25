from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..schemas.olt_credentials import OLTCredentials
from .helpers import ensure_olt_exists

router = APIRouter()


@router.get("/{olt_id}/credentials", response_model=OLTCredentials)
def get_olt_credentials(olt_id: int, db: Session = Depends(get_db)):
    olt = ensure_olt_exists(db, olt_id)
    return OLTCredentials(
        id=olt.id,
        host=str(olt.ip_address),
        username=olt.ssh_username,
        password=olt.ssh_password,
        snmp_community=olt.snmp_community,
        ssh_port=olt.ssh_port,
    )
