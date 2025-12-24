from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...crud import olt as crud_olt
from ...schemas.olt import OLT, OLTCreate, OLTUpdate
from ..helpers import ensure_olt_exists

router = APIRouter()


@router.get("/", response_model=List[OLT])
def get_olts(
    skip: int = 0,
    limit: int = 100,
    setup_status: Optional[str] = None,
    configured_only: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Lista OLTs com filtros opcionais.
    """
    if setup_status:
        olts = crud_olt.get_olts_by_setup_status(db, setup_status)
    elif configured_only is not None:
        if configured_only:
            olts = [olt for olt in crud_olt.get_olts(db) if olt.is_configured]
        else:
            olts = crud_olt.get_unconfigured_olts(db)
    else:
        olts = crud_olt.get_olts(db, skip=skip, limit=limit)

    return olts


@router.get("/{olt_id}", response_model=OLT)
def get_olt(olt_id: int, db: Session = Depends(get_db)):
    """
    Obtém detalhes de uma OLT específica.
    """
    return ensure_olt_exists(db, olt_id)


@router.post("/", response_model=OLT, status_code=status.HTTP_201_CREATED)
def create_olt(olt: OLTCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova OLT manualmente.
    """
    existing_name = crud_olt.get_olt_by_name(db, olt.name)
    if existing_name:
        raise HTTPException(status_code=400, detail="Já existe OLT com este nome")

    existing_ip = crud_olt.get_olt_by_ip(db, olt.ip_address)
    if existing_ip:
        raise HTTPException(status_code=400, detail="Já existe OLT com este IP")

    return crud_olt.create_olt(db, olt)


@router.put("/{olt_id}", response_model=OLT)
def update_olt(olt_id: int, olt: OLTUpdate, db: Session = Depends(get_db)):
    """
    Atualiza uma OLT existente.
    """
    updated_olt = crud_olt.update_olt(db, olt_id, olt)
    if not updated_olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    return updated_olt


@router.delete("/{olt_id}")
def delete_olt(olt_id: int, db: Session = Depends(get_db)):
    """
    Remove uma OLT.
    """
    deleted_olt = crud_olt.delete_olt(db, olt_id)
    if not deleted_olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    return {"message": "OLT removida com sucesso"}


@router.get("/unconfigured", response_model=List[OLT])
def get_unconfigured_olts(db: Session = Depends(get_db)):
    """
    Lista OLTs que ainda não foram configuradas.
    """
    return crud_olt.get_unconfigured_olts(db)
