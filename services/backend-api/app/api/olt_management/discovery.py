from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...schemas.olt import OLTDiscoveryRequest
from ...schemas.olt_setup import OLTDiscoveryResult, OLTDiscoveryResponse
from ...services.olt_discovery_service import OLTDiscoveryService

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/discover", response_model=OLTDiscoveryResult)
async def discover_single_olt(
    discovery_request: OLTDiscoveryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # Uncomment when auth is ready
):
    """
    Descobre uma OLT específica por IP e credenciais SSH.
    """
    try:
        async with OLTDiscoveryService() as discovery_service:
            result = await discovery_service.discover_olt(
                db,
                discovery_request,
                user_id=None,  # Replace with current_user.id when auth is ready
            )

            if discovery_request.auto_configure and result.success and result.olt_id:
                background_tasks.add_task(
                    _auto_configure_discovered_olt,
                    result.olt_id,
                )
                result.message += " (configuração automática agendada)"

            return result

    except Exception as e:
        logger.error(f"Erro na descoberta de OLT: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno na descoberta: {str(e)}",
        )


@router.post("/discover/range", response_model=OLTDiscoveryResponse)
async def discover_olt_range(
    ip_range: str,
    ssh_username: str,
    ssh_password: str,
    ssh_port: int = 22,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """
    Descobre OLTs em uma faixa de IPs.

    Args:
        ip_range: Faixa de IPs (ex: "192.168.1.1-50" ou "192.168.1.0/24")
    """
    try:
        async with OLTDiscoveryService() as discovery_service:
            result = await discovery_service.discover_network_range(
                db,
                ip_range,
                ssh_username,
                ssh_password,
                ssh_port,
                user_id=None,  # Replace with current_user.id when auth is ready
            )

            return OLTDiscoveryResponse(**result)

    except Exception as e:
        logger.error(f"Erro na descoberta em massa: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno na descoberta em massa: {str(e)}",
        )


async def _auto_configure_discovered_olt(olt_id: int):
    """
    Configura automaticamente uma OLT descoberta (executa em background).
    """
    try:
        logger.info(f"Configuração automática da OLT {olt_id} iniciada em background")
        # Implementar lógica de configuração padrão aqui
    except Exception as e:
        logger.error(f"Erro na configuração automática da OLT {olt_id}: {e}")
