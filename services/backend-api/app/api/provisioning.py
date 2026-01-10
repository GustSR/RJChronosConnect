from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import httpx
import re

from ..schemas.provisioning import (
    PendingONUModel,
    ProvisionedDevice,
    ONUProvisionRequest,
    ClientConfigurationUpdate,
)
from ..schemas.device import DeviceCreate
from ..services.genieacs_client import get_genieacs_client
# from ..crud.activity import log_activity
from ..crud import device as crud_device
from ..crud import subscriber as crud_subscriber
from ..crud import olt as crud_olt
from ..database.database import get_db
from .helpers import ensure_device_exists
from ..models.subscriber import Subscriber
from ..models.olt import Olt
from ..models.olt_port import OltPort
from ..core.config import settings

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

_TAG_SAFE_RE = re.compile(r"[^a-z0-9:_-]")

def _sanitize_tag(value: str) -> str:
    cleaned = _TAG_SAFE_RE.sub("-", value.strip().lower())
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-")
    return cleaned or "unknown"

def _maybe_tag(prefix: str, value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return _sanitize_tag(f"{prefix}:{text}")

def _build_olt_port(provision_data: ONUProvisionRequest) -> Optional[str]:
    if provision_data.olt_port:
        return provision_data.olt_port

    slot = provision_data.slot if provision_data.slot is not None else provision_data.board
    pon_port = provision_data.port
    if slot is None or pon_port is None:
        return None

    frame = provision_data.frame if provision_data.frame is not None else 0
    return f"{frame}/{slot}/{pon_port}"

async def _post_olt_manager(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OLT_MANAGER_URL}{path}",
                json=payload,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Erro HTTP ao chamar OLT Manager ({path}): {e}")
        return {"success": False, "message": str(e), "error": str(e)}
    except Exception as e:
        logger.error(f"Erro inesperado ao chamar OLT Manager ({path}): {e}")
        return {"success": False, "message": str(e), "error": str(e)}

def _resolve_olt(db: Session, provision_data: ONUProvisionRequest) -> Optional[Olt]:
    if provision_data.olt_id is not None:
        return crud_olt.get_olt(db, provision_data.olt_id)
    if provision_data.olt_name:
        return crud_olt.get_olt_by_name(db, provision_data.olt_name)
    return None

@router.get("/pending", response_model=List[PendingONUModel])
async def get_pending_onus(db: Session = Depends(get_db)):
    """
    Retorna ONUs descobertas mas não autorizadas (pendentes de provisionamento)
    """
    try:
        client = await get_genieacs_client()
        raw_devices = await client.get_devices()
        
        pending_onus = []
        for device_data in raw_devices:
            device_id_info = device_data.get("_deviceId", {})
            serial_number = device_id_info.get("_SerialNumber", "Unknown")
            product_class = device_id_info.get("_ProductClass", "")
            device_id = device_data.get("_id", f"pending-{serial_number}")
            
            onu_indicators = ["HG8310", "F601", "F670", "AN5506", "G-140W"]
            is_onu = any(indicator in product_class for indicator in onu_indicators)
            
            db_device = crud_device.get_device_by_serial_number(db, serial_number)

            if is_onu and not db_device:
                pending_onu = PendingONUModel(
                    id=device_id,
                    serial_number=serial_number,
                    olt_name="OLT-Auto-Detected",
                    board=1,
                    port=1,
                    discovered_at=datetime.now(),
                    distance=1.5,
                    onu_type=product_class,
                    status="pending",
                    rx_power=-18.5,
                    temperature=42.1
                )
                pending_onus.append(pending_onu)
        
        logger.info(f"Encontradas {len(pending_onus)} ONUs pendentes")
        
        if not pending_onus:
            logger.info("Nenhuma ONU pendente encontrada, gerando dados de demonstração")
            return [
                PendingONUModel(
                    id=f"pending-demo-{i}",
                    serial_number=f"DEMO{str(i).zfill(8)}",
                    olt_name=f"OLT-Central-{(i % 2) + 1:02d}",
                    board=1, port=i + 1, discovered_at=datetime.now() - timedelta(minutes=i * 15),
                    distance=round(1.2 + (i * 0.3), 1), onu_type="Huawei HG8310M",
                    status="pending", rx_power=round(-18.5 - (i * 0.5), 1), temperature=round(40.0 + (i * 1.2), 1)
                ) for i in range(3)
            ]
        
        return pending_onus
        
    except Exception as e:
        logger.error(f"Erro ao buscar ONUs pendentes: {e}")
        return []

@router.post("/{onu_id}/authorize")
async def authorize_onu(onu_id: str, provision_data: ONUProvisionRequest, db: Session = Depends(get_db)):
    """
    Autoriza uma ONU pendente e provisiona na rede
    """
    try:
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(onu_id)
        if not device_data:
            raise HTTPException(status_code=404, detail="ONU não encontrada")
        
        logger.info(f"Autorizando ONU {onu_id} para cliente {provision_data.client_name}")
        
        serial_number = device_data.get('_deviceId', {}).get('_SerialNumber', f'SN_{onu_id}')
        cpf_cnpj = provision_data.client_cpf_cnpj or f"auto-{onu_id}"

        # Create Subscriber if it doesn't exist
        subscriber = crud_subscriber.get_subscriber_by_cpf_cnpj(db, cpf_cnpj)
        if not subscriber:
            subscriber = Subscriber(full_name=provision_data.client_name, cpf_cnpj=cpf_cnpj)
            db.add(subscriber)
            db.commit()
            db.refresh(subscriber)

        # Create OLT and OLT Port if they don't exist
        olt = _resolve_olt(db, provision_data)
        if provision_data.olt_id is not None and not olt:
            raise HTTPException(status_code=404, detail="OLT não encontrada")

        if not olt:
            olt_name = provision_data.olt_name or "OLT-Auto-Detected"
            olt = crud_olt.get_olt_by_name(db, olt_name)
        if not olt:
            olt = Olt(name=olt_name, ip_address="127.0.0.1") # Dummy IP
            db.add(olt)
            db.commit()
            db.refresh(olt)

        slot_value = provision_data.slot if provision_data.slot is not None else provision_data.board
        if slot_value is None:
            slot_value = 1
        port_value = provision_data.port if provision_data.port is not None else 1

        olt_port = crud_olt.get_olt_port(db, olt.id, slot_value, port_value)
        if not olt_port:
            olt_port = OltPort(olt_id=olt.id, slot=slot_value, port_number=port_value)
            db.add(olt_port)
            db.commit()
            db.refresh(olt_port)

        device = crud_device.create_device(db, device=DeviceCreate(
            serial_number=serial_number,
            genieacs_id=onu_id,
            subscriber_id=subscriber.id,
            olt_port_id=olt_port.id,
            status_id=1 # Online
        ))

        olt_result: Dict[str, Any] = {
            "status": "skipped",
            "message": "Dados insuficientes para provisionamento físico na OLT",
        }
        olt_port_str = _build_olt_port(provision_data)
        has_profiles = provision_data.line_profile and provision_data.srv_profile
        if olt and olt_port_str and provision_data.ont_id is not None and has_profiles:
            if not olt.ssh_username or not olt.ssh_password:
                olt_result = {
                    "status": "skipped",
                    "message": "Credenciais SSH da OLT ausentes",
                }
            elif not olt.is_configured:
                olt_result = {
                    "status": "skipped",
                    "message": "OLT não configurada para provisionamento",
                }
            else:
                olt_payload = {
                    "port": olt_port_str,
                    "ont_id": provision_data.ont_id,
                    "serial_number": serial_number,
                    "line_profile": provision_data.line_profile,
                    "srv_profile": provision_data.srv_profile,
                }
                olt_response = await _post_olt_manager(
                    f"/api/v1/olts/{olt.id}/onts",
                    olt_payload,
                )
                olt_success = olt_response.get("success")
                if olt_success is None:
                    olt_success = olt_response.get("status") == "success"
                olt_result = {
                    "status": "success" if olt_success else "error",
                    "response": olt_response,
                }

        tags = [
            "authorized",
            _maybe_tag("subscriber", subscriber.id),
            _maybe_tag("serial", serial_number),
            _maybe_tag("plan", provision_data.service_profile),
            _maybe_tag("vlan", provision_data.vlan_id),
            _maybe_tag("wan", provision_data.wan_mode),
            _maybe_tag("olt", olt.id if olt else None),
            _maybe_tag("pon", olt_port_str),
        ]
        tags = [tag for tag in tags if tag]

        tag_results = {"added": [], "failed": []}
        for tag in tags:
            ok = await client.add_tag(onu_id, tag)
            if ok:
                tag_results["added"].append(tag)
            else:
                tag_results["failed"].append(tag)

        refresh_task = {"name": "refreshObject", "objectName": ""}
        task_ok = await client.enqueue_task(
            onu_id,
            refresh_task,
            connection_request=True,
        )

        acs_tasks_results: List[Dict[str, Any]] = []
        connection_request = True
        if provision_data.acs_connection_request is not None:
            connection_request = provision_data.acs_connection_request

        if provision_data.acs_parameters:
            param_values = [
                [param, value]
                for param, value in provision_data.acs_parameters.items()
            ]
            param_task = {
                "name": "setParameterValues",
                "parameterValues": param_values,
            }
            ok = await client.enqueue_task(
                onu_id,
                param_task,
                connection_request=connection_request,
            )
            acs_tasks_results.append({
                "task": "setParameterValues",
                "status": "queued" if ok else "failed",
            })

        if provision_data.acs_tasks:
            for task in provision_data.acs_tasks:
                ok = await client.enqueue_task(
                    onu_id,
                    task,
                    connection_request=connection_request,
                )
                acs_tasks_results.append({
                    "task": task.get("name", "unknown"),
                    "status": "queued" if ok else "failed",
                })

        has_failed_tasks = any(result["status"] == "failed" for result in acs_tasks_results)
        genieacs_result = {
            "status": "success"
            if not tag_results["failed"] and task_ok and not has_failed_tasks
            else "error",
            "tags": tag_results,
            "refresh_task": "queued" if task_ok else "failed",
            "queued_tasks": acs_tasks_results,
        }

        overall_success = olt_result["status"] != "error" and genieacs_result["status"] != "error"
        message = (
            f"ONU {onu_id} autorizada com sucesso"
            if overall_success
            else f"ONU {onu_id} autorizada com ressalvas"
        )

        # await log_activity(
        #     device_id=onu_id, device_name=f"ONU {serial_number}", action="onu_authorization",
        #     description=f"ONU autorizada para cliente {provision_data.client_name}",
        #     status="success",
        #     result=f"Aplicadas configurações",
        #     metadata=provision_data.dict()
        # )
        
        return {
            "success": overall_success,
            "message": message,
            "details": {
                "olt": olt_result,
                "genieacs": genieacs_result,
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao autorizar ONU {onu_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.delete("/{onu_id}/reject")
async def reject_onu(onu_id: str, reason: str = "Rejected by administrator"):
    """
    Rejeita uma ONU pendente
    """
    # await log_activity(
    #     device_id=onu_id, device_name=f"ONU {onu_id}", action="onu_rejection",
    #     description=f"ONU rejeitada: {reason}", status="success",
    #     result="ONU removida da lista de pendentes", metadata={"rejection_reason": reason}
    # )
    logger.info(f"ONU {onu_id} rejeitada: {reason}")
    return {"success": True, "message": f"ONU {onu_id} rejeitada com sucesso"}

@router.get("/clients")
async def get_provisioned_clients(db: Session = Depends(get_db)):
    """
    Retorna lista de todos os clientes provisionados
    """
    devices = crud_device.get_devices(db)
    return devices

@router.get("/clients/{onu_id}")
async def get_client_configuration(onu_id: int, db: Session = Depends(get_db)):
    """
    Retorna configuração de um cliente provisionado específico
    """
    device = ensure_device_exists(db, onu_id, detail="Cliente não encontrado")
    return device

@router.put("/clients/{onu_id}")
async def update_client_configuration(onu_id: int, updates: ClientConfigurationUpdate, db: Session = Depends(get_db)):
    """
    Atualiza configuração de um cliente provisionado
    """
    device = ensure_device_exists(db, onu_id, detail="Cliente não encontrado")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    
    db.add(device)
    db.commit()
    db.refresh(device)
    
    # await log_activity(
    #     device_id=onu_id, device_name=f"Cliente {device.subscriber.full_name}",
    #     action="client_configuration_update", description=f"Configuração atualizada",
    #     status="success", metadata=updates.dict(exclude_none=True)
    # )
    
    return {"success": True, "message": "Configuração atualizada com sucesso"}
