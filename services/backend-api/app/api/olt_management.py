from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..crud import olt as crud_olt
from ..schemas.olt import (
    OLT, OLTCreate, OLTUpdate, 
    OLTDiscoveryRequest, OLTSetupRequest, OLTSetupResponse
)
from ..schemas.olt_setup import OltSetupLog, OLTDiscoveryResult, OLTDiscoveryResponse
from ..services.olt_discovery_service import OLTDiscoveryService
from ..services.olt_setup_service import OLTSetupService

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ========================================
# ENDPOINTS BÁSICOS DE OLT
# ========================================

@router.get("/", response_model=List[OLT])
def get_olts(
    skip: int = 0, 
    limit: int = 100,
    setup_status: Optional[str] = None,
    configured_only: Optional[bool] = None,
    db: Session = Depends(get_db)
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
    olt = crud_olt.get_olt(db, olt_id)
    if not olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    return olt


@router.post("/", response_model=OLT, status_code=status.HTTP_201_CREATED)
def create_olt(olt: OLTCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova OLT manualmente.
    """
    # Verifica se já existe OLT com mesmo nome ou IP
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


# ========================================
# ENDPOINTS DE DESCOBERTA
# ========================================

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
                user_id=None  # Replace with current_user.id when auth is ready
            )
            
            # Se auto_configure está habilitado e descoberta foi bem-sucedida, agenda configuração
            if discovery_request.auto_configure and result.success and result.olt_id:
                background_tasks.add_task(
                    _auto_configure_discovered_olt,
                    result.olt_id
                )
                result.message += " (configuração automática agendada)"
            
            return result
            
    except Exception as e:
        logger.error(f"Erro na descoberta de OLT: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno na descoberta: {str(e)}"
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
                db, ip_range, ssh_username, ssh_password, ssh_port,
                user_id=None  # Replace with current_user.id when auth is ready
            )
            
            return OLTDiscoveryResponse(**result)
            
    except Exception as e:
        logger.error(f"Erro na descoberta em massa: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno na descoberta em massa: {str(e)}"
        )


# ========================================
# ENDPOINTS DE CONFIGURAÇÃO
# ========================================

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
                user_id=None  # Replace with current_user.id when auth is ready
            )
            return result
            
    except Exception as e:
        logger.error(f"Erro na configuração da OLT {olt_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno na configuração: {str(e)}"
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
    if len(olt_ids) > 50:  # Limite de segurança
        raise HTTPException(
            status_code=400, 
            detail="Máximo de 50 OLTs por lote"
        )
    
    try:
        async with OLTSetupService() as setup_service:
            result = await setup_service.setup_multiple_olts(
                db, 
                olt_ids, 
                setup_request,
                user_id=None  # Replace with current_user.id when auth is ready
            )
            return result
            
    except Exception as e:
        logger.error(f"Erro na configuração em lote: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno na configuração em lote: {str(e)}"
        )


@router.get("/unconfigured", response_model=List[OLT])
def get_unconfigured_olts(db: Session = Depends(get_db)):
    """
    Lista OLTs que ainda não foram configuradas.
    """
    return crud_olt.get_unconfigured_olts(db)


# ========================================
# ENDPOINTS DE LOGS
# ========================================

@router.get("/{olt_id}/logs", response_model=List[OltSetupLog])
def get_olt_setup_logs(
    olt_id: int, 
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Obtém logs de configuração de uma OLT específica.
    """
    olt = crud_olt.get_olt(db, olt_id)
    if not olt:
        raise HTTPException(status_code=404, detail="OLT não encontrada")
    
    logs = crud_olt.get_setup_logs_by_olt(db, olt_id, limit)
    return logs


@router.get("/logs/recent", response_model=List[OltSetupLog])
def get_recent_setup_logs(limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtém logs de configuração mais recentes de todas as OLTs.
    """
    return crud_olt.get_recent_setup_logs(db, limit)


# ========================================
# ENDPOINTS DE STATUS
# ========================================

@router.get("/stats/overview")
def get_olt_overview_stats(db: Session = Depends(get_db)):
    """
    Obtém estatísticas gerais das OLTs.
    """
    all_olts = crud_olt.get_olts(db)
    
    total = len(all_olts)
    configured = len([olt for olt in all_olts if olt.is_configured])
    pending = len([olt for olt in all_olts if olt.setup_status == 'pending'])
    failed = len([olt for olt in all_olts if olt.setup_status == 'failed'])
    
    return {
        "total_olts": total,
        "configured_olts": configured,
        "pending_setup": pending,
        "failed_setup": failed,
        "configuration_rate": (configured / total * 100) if total > 0 else 0
    }


# ========================================
# FUNÇÕES AUXILIARES
# ========================================

async def _auto_configure_discovered_olt(olt_id: int):
    """
    Configura automaticamente uma OLT descoberta (executa em background).
    """
    try:
        # Esta função rodará em background após descoberta
        # Pode ser expandida para configuração padrão baseada em templates
        logger.info(f"Configuração automática da OLT {olt_id} iniciada em background")
        
        # Implementar lógica de configuração padrão aqui
        # Por enquanto, apenas log
        
    except Exception as e:
        logger.error(f"Erro na configuração automática da OLT {olt_id}: {e}")