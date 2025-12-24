from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...crud import olt as crud_olt
from ...schemas.olt_setup import OltSetupLog
from ..helpers import ensure_olt_exists

router = APIRouter()


@router.get("/{olt_id}/logs", response_model=List[OltSetupLog])
def get_olt_setup_logs(
    olt_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Obtém logs de configuração de uma OLT específica.
    """
    ensure_olt_exists(db, olt_id)

    logs = crud_olt.get_setup_logs_by_olt(db, olt_id, limit)
    return logs


@router.get("/logs/recent", response_model=List[OltSetupLog])
def get_recent_setup_logs(limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtém logs de configuração mais recentes de todas as OLTs.
    """
    return crud_olt.get_recent_setup_logs(db, limit)
