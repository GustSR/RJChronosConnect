from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..crud import device as crud_device
from ..crud import olt as crud_olt


def ensure_olt_exists(db: Session, olt_id: int):
    olt = crud_olt.get_olt(db, olt_id)
    if not olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    return olt


def ensure_device_exists(
    db: Session,
    device_id: int,
    detail: str = "Dispositivo não encontrado",
):
    device = crud_device.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail=detail)
    return device
