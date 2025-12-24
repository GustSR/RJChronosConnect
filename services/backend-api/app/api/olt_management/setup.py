from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...schemas.olt import OLTSetupRequest, OLTSetupResponse
from ...services.olt_setup_service import OLTSetupService

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{olt_id}/setup", response_model=OLTSetupResponse)
async def setup_olt(
    olt_id: int,
    setup_request: OLTSetupRequest,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """
    Configura uma OLT existente para integração completa.
    """
    try:
        async with OLTSetupService() as setup_service:
            result = await setup_service.setup_olt(
                db,
                olt_id,
                setup_request,
                user_id=None,  # Replace with current_user.id when auth is ready
            )
            return result

    except Exception as e:
        logger.error(f"Erro na configuração da OLT {olt_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno na configuração: {str(e)}",
        )


@router.post("/setup/batch")
async def setup_multiple_olts(
    olt_ids: List[int],
    setup_request: OLTSetupRequest,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """
    Configura múltiplas OLTs em lote.
    """
    if len(olt_ids) > 50:
        raise HTTPException(
            status_code=400,
            detail="Máximo de 50 OLTs por lote",
        )

    try:
        async with OLTSetupService() as setup_service:
            result = await setup_service.setup_multiple_olts(
                db,
                olt_ids,
                setup_request,
                user_id=None,  # Replace with current_user.id when auth is ready
            )
            return result

    except Exception as e:
        logger.error(f"Erro na configuração em lote: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno na configuração em lote: {str(e)}",
        )
