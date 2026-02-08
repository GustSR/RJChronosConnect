from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
import asyncio
import httpx
import re
import zlib

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
from ..models.device import Device
from ..models.device_status import DeviceStatus
from ..core.config import settings

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

_TAG_SAFE_RE = re.compile(r"[^a-z0-9:_-]")
_PORT_RE = re.compile(r"^(?:gpon\s*)?(\d+)/(\d+)/(\d+)$")
_DEFAULT_LINE_PROFILE = "SMARTOLT_FLEXIBLE_GPON"
_DEFAULT_SRV_PROFILES = [
    "EG8145X6-10",
    "EG8145X6",
    "EG8145V5-V2",
    "EG8145V5",
    "EG8010H",
]
_PLACEHOLDER_ONU_TYPES = {"ONU", "ONT", "UNKNOWN", "N/A"}

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

def _parse_port_label(value: Optional[str]) -> Tuple[Optional[int], Optional[int], Optional[int]]:
    if not value:
        return None, None, None
    match = _PORT_RE.match(value.strip().lower())
    if not match:
        return None, None, None
    frame, slot, pon_port = match.groups()
    return int(frame), int(slot), int(pon_port)

def _build_pon_lock_key(olt_id: int, port_label: str) -> Optional[int]:
    frame, slot, pon_port = _parse_port_label(port_label)
    if frame is None or slot is None or pon_port is None:
        return None
    seed = f"{frame}/{slot}/{pon_port}"
    checksum = zlib.crc32(seed.encode("utf-8")) & 0xFFFFFFFF
    return ((olt_id & 0xFFFFFFFF) << 32) | checksum

def _acquire_pon_lock(db: Session, lock_key: int) -> None:
    db.execute(text("SELECT pg_advisory_xact_lock(:lock_key)"), {"lock_key": lock_key})

def _parse_autofind_time(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now()
    raw = value.strip()
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return datetime.now()

def _resolve_srv_profile(onu_type: Optional[str]) -> Optional[str]:
    if not onu_type:
        return None
    normalized = str(onu_type).upper()
    for profile in _DEFAULT_SRV_PROFILES:
        if profile in normalized:
            return profile
    return None

def _is_placeholder_onu_type(value: Optional[str]) -> bool:
    if value is None:
        return True
    normalized = str(value).strip().upper()
    return not normalized or normalized in _PLACEHOLDER_ONU_TYPES

async def _resolve_autofind_onu_type(
    olt_id: int,
    serial_number: str,
) -> Optional[str]:
    serial = str(serial_number).strip().upper()
    if not serial:
        return None

    snmp_data = await _get_olt_manager(
        f"/api/v1/olts/{olt_id}/autofind-onts/snmp",
        {"serial_number": serial, "limit": 1},
    )
    if snmp_data:
        ont = snmp_data[0]
        equipment_id = ont.get("equipment_id") or ont.get("ont_type")
        if equipment_id:
            return str(equipment_id).strip()

    cli_data = await _get_olt_manager(
        f"/api/v1/olts/{olt_id}/autofind-onts",
        {},
    )
    for ont in cli_data or []:
        ont_serial = ont.get("serial_number")
        if not ont_serial:
            continue
        if str(ont_serial).strip().upper() == serial:
            equipment_id = ont.get("equipment_id") or ont.get("ont_type")
            if equipment_id:
                return str(equipment_id).strip()

    return None

def _describe_olt_missing_data(
    ont_id: Optional[int],
    olt_port: Optional[str],
    line_profile: Optional[str],
    srv_profile: Optional[str],
    ont_id_error: Optional[str] = None,
) -> Optional[str]:
    missing: List[str] = []
    if not olt_port:
        missing.append("porta OLT (frame/slot/port)")
    if ont_id is None:
        if ont_id_error:
            missing.append(f"ont_id ({ont_id_error})")
        else:
            missing.append("ont_id")
    if not line_profile:
        missing.append("ont-lineprofile-name")
    if not srv_profile:
        missing.append("ont-srvprofile-name")
    if not missing:
        return None
    return "Dados insuficientes para a OLT: " + ", ".join(missing)

def _pick_available_ont_id(used_ids: set[int]) -> Optional[int]:
    for candidate in range(1, 128):
        if candidate not in used_ids:
            return candidate
    return None

async def _get_used_ont_ids(olt_id: int, port_label: str) -> Optional[set[int]]:
    frame, slot, pon_port = _parse_port_label(port_label)
    if frame is None or slot is None or pon_port is None:
        return None
    data = await _get_olt_manager(
        f"/api/v1/olts/{olt_id}/ports/{frame}/{slot}/{pon_port}/onts/all",
        {},
    )
    if data is None:
        return None
    used_ids: set[int] = set()
    for item in data:
        try:
            ont_id = int(item.get("ont_id"))
        except (TypeError, ValueError):
            continue
        used_ids.add(ont_id)
    return used_ids

def _describe_olt_error(olt_result: Dict[str, Any]) -> str:
    response = olt_result.get("response")
    if isinstance(response, dict):
        message = response.get("message") or response.get("error")
        if message:
            return str(message).strip()
    return "Falha ao provisionar na OLT"

def _describe_genieacs_error(genieacs_result: Dict[str, Any]) -> str:
    tags = genieacs_result.get("tags")
    if isinstance(tags, dict):
        failed_tags = tags.get("failed")
        if failed_tags:
            return "Falha ao aplicar tags no GenieACS"
    if genieacs_result.get("refresh_task") == "failed":
        return "Falha ao enfileirar refresh no GenieACS"
    queued = genieacs_result.get("queued_tasks")
    if isinstance(queued, list) and any(
        isinstance(item, dict) and item.get("status") == "failed"
        for item in queued
    ):
        return "Falha ao enfileirar tarefas no GenieACS"
    return "Falha ao aplicar configuracoes no GenieACS"

def _is_ont_id_conflict(response: Dict[str, Any]) -> bool:
    message = response.get("message") or response.get("error") or ""
    normalized = str(message).lower()
    return "ont id" in normalized and "already" in normalized

async def _post_olt_manager(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    urls = _build_olt_manager_urls(path)
    last_error: Optional[Exception] = None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for url in urls:
                try:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPError as e:
                    last_error = e
    except httpx.HTTPError as e:
        last_error = e

    if last_error:
        logger.error(f"Erro HTTP ao chamar OLT Manager ({path}): {last_error}")
        return {"success": False, "message": str(last_error), "error": str(last_error)}
    return {"success": False, "message": "Erro desconhecido ao chamar OLT Manager"}

async def _get_olt_manager(path: str, params: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    urls = _build_olt_manager_urls(path)
    last_error: Optional[Exception] = None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in urls:
                try:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    if isinstance(data, list):
                        return data
                    logger.error(
                        "Resposta inesperada do OLT Manager (%s): esperado lista",
                        url,
                    )
                    return None
                except httpx.HTTPError as e:
                    last_error = e
    except httpx.HTTPError as e:
        last_error = e
    except Exception as e:
        last_error = e

    if last_error:
        logger.error(f"Erro ao chamar OLT Manager ({path}): {last_error}")
    return None

def _build_olt_manager_urls(path: str) -> List[str]:
    base = settings.OLT_MANAGER_URL.rstrip("/")
    normalized = path if path.startswith("/") else f"/{path}"
    candidates = [f"{base}{normalized}"]

    if "/api/v1/" in normalized:
        alt = normalized.replace("/api/v1/", "/api/", 1)
        candidates.append(f"{base}{alt}")
    elif normalized.startswith("/api/"):
        alt = normalized.replace("/api/", "/api/v1/", 1)
        candidates.append(f"{base}{alt}")

    seen: set[str] = set()
    unique: List[str] = []
    for url in candidates:
        if url not in seen:
            seen.add(url)
            unique.append(url)
    return unique

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
        olts = crud_olt.get_olts(db)
        if not olts:
            logger.info("Nenhuma OLT cadastrada para buscar ONUs em autofind")
            return []

        async def _fetch_autofind(olt: Olt) -> Tuple[Olt, List[Dict[str, Any]]]:
            data = await _get_olt_manager(
                f"/api/v1/olts/{olt.id}/autofind-onts/snmp",
                {"limit": 200},
            )
            return olt, data or []

        tasks = [_fetch_autofind(olt) for olt in olts]
        results = await asyncio.gather(*tasks)

        pending_onus: List[PendingONUModel] = []
        for olt, ont_list in results:
            for ont in ont_list:
                serial_number = ont.get("serial_number") or "Unknown"
                db_device = crud_device.get_device_by_serial_number(db, serial_number)
                if db_device and db_device.genieacs_id:
                    continue

                equipment_id = ont.get("equipment_id")
                onu_type = equipment_id or ont.get("ont_type") or "ONU"
                port_label = ont.get("port")
                frame, slot, pon_port = _parse_port_label(port_label)
                board_value = slot if slot is not None else 0
                port_value = pon_port if pon_port is not None else 0

                pending_onus.append(
                    PendingONUModel(
                        id=f"autofind-{olt.id}-{serial_number}",
                        serial_number=serial_number,
                        olt_id=olt.id,
                        olt_name=olt.name,
                        olt_port=port_label,
                        frame=frame,
                        slot=slot,
                        ont_id=ont.get("ont_id"),
                        board=board_value,
                        port=port_value,
                        discovered_at=_parse_autofind_time(ont.get("autofind_time")),
                        distance=None,
                        onu_type=onu_type,
                        status="pending",
                        rx_power=None,
                        temperature=None,
                    )
                )

        logger.info(f"Encontradas {len(pending_onus)} ONUs pendentes via autofind")
        return pending_onus

    except Exception as e:
        logger.error(f"Erro ao buscar ONUs pendentes: {e}")
        return []

from ..services.rabbitmq_publisher import publisher
import uuid

@router.post("/{onu_id}/authorize-async")
async def authorize_onu_async(onu_id: str, provision_data: ONUProvisionRequest, db: Session = Depends(get_db)):
    """
    Versão Assíncrona: Autoriza uma ONU, persiste no banco e delega o provisionamento físico para o Orquestrador (works).
    """
    try:
        task_id = str(uuid.uuid4())
        logger.info(f"Iniciando autorização ASSÍNCRONA para ONU {onu_id}, Task ID: {task_id}")

        # 1. RESOLVER ENTIDADES NO BANCO (Lógica de Negócio)
        
        # 1.1 Localizar ou Criar Subscriber
        cpf_cnpj = provision_data.client_cpf_cnpj or f"auto-{onu_id}"
        subscriber = crud_subscriber.get_subscriber_by_cpf_cnpj(db, cpf_cnpj)
        if not subscriber:
            subscriber = Subscriber(
                full_name=provision_data.client_name,
                cpf_cnpj=cpf_cnpj,
                address_street=provision_data.client_address,
            )
            db.add(subscriber)
            db.commit()
            db.refresh(subscriber)

        # 1.2 Resolver OLT
        olt = _resolve_olt(db, provision_data)
        if not olt:
             raise HTTPException(status_code=404, detail="OLT não encontrada para provisionamento")

        # 1.3 Resolver/Criar OltPort
        slot_value = provision_data.slot if provision_data.slot is not None else provision_data.board or 1
        port_value = provision_data.port or 1
        olt_port = crud_olt.get_olt_port(db, olt.id, slot_value, port_value)
        if not olt_port:
            olt_port = OltPort(olt_id=olt.id, slot=slot_value, port_number=port_value)
            db.add(olt_port)
            db.commit()
            db.refresh(olt_port)

        # 1.4 Criar Registro do Dispositivo (Device)
        serial_number = provision_data.serial_number or onu_id
        device = crud_device.get_device_by_serial_number(db, serial_number)
        
        # Se já existe, atualizamos o vínculo
        if device:
            device.subscriber_id = subscriber.id
            device.olt_port_id = olt_port.id
            device.status_id = 1 # 'ativo'
        else:
            device = Device(
                serial_number=serial_number,
                subscriber_id=subscriber.id,
                olt_port_id=olt_port.id,
                status_id=1,
                ont_id=provision_data.ont_id # Pode ser None, o worker resolverá
            )
            db.add(device)
        
        db.commit()
        db.refresh(device)

        # 2. Preparar os dados para o Orquestrador (Hardware Action)
        final_service_vlan = provision_data.vlan_id or olt.service_vlan
        final_mgmt_vlan = olt.mgmt_vlan or 200

        event_payload = {
            "event_type": "provisioning",
            "task_id": task_id,
            "olt_id": olt.id,
            "port": _build_olt_port(provision_data) or f"0/{slot_value}/{port_value}",
            "ont_id": device.ont_id,
            "serial_number": serial_number,
            "line_profile": provision_data.line_profile or _DEFAULT_LINE_PROFILE,
            "srv_profile": provision_data.srv_profile or _resolve_srv_profile(provision_data.onu_type),
            "description": provision_data.client_name,
            
            "vlan_id": final_service_vlan,
            "mgmt_vlan": final_mgmt_vlan,
            "wan_mode": provision_data.wan_mode or "dhcp",
            "tr069_profile_id": 2
        }

        # 3. Publicar o evento
        await publisher.publish_event("task_queue", event_payload)

        return {
            "success": True,
            "message": "Provisionamento iniciado. Acompanhe o status no painel de dispositivos.",
            "task_id": task_id,
            "device_id": device.id,
            "status": "queued"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao iniciar autorização assíncrona: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados no banco: {str(e)}")

@router.post("/{onu_id}/authorize")
async def authorize_onu(onu_id: str, provision_data: ONUProvisionRequest, db: Session = Depends(get_db)):
    """
    Autoriza uma ONU pendente e provisiona na rede
    """
    try:
        client = await get_genieacs_client()
        device_data = await client.get_device_by_id(onu_id)
        genieacs_available = device_data is not None
        
        logger.info(f"Autorizando ONU {onu_id} para cliente {provision_data.client_name}")
        
        if genieacs_available:
            serial_number = device_data.get('_deviceId', {}).get('_SerialNumber', f'SN_{onu_id}')
        else:
            serial_number = provision_data.serial_number or f"SN_{onu_id}"

        existing_device = crud_device.get_device_by_serial_number(db, serial_number)
        if existing_device and provision_data.client_cpf_cnpj:
            existing_cpf = existing_device.subscriber.cpf_cnpj if existing_device.subscriber else None
            if existing_cpf and existing_cpf != provision_data.client_cpf_cnpj:
                raise HTTPException(
                    status_code=409,
                    detail="ONU já cadastrada para outro cliente",
                )

        if existing_device:
            subscriber = existing_device.subscriber
        else:
            cpf_cnpj = provision_data.client_cpf_cnpj or f"auto-{onu_id}"

            # Create Subscriber if it doesn't exist
            subscriber = crud_subscriber.get_subscriber_by_cpf_cnpj(db, cpf_cnpj)
            if not subscriber:
                subscriber = Subscriber(
                    full_name=provision_data.client_name,
                    cpf_cnpj=cpf_cnpj,
                    address_street=provision_data.client_address,
                )
                db.add(subscriber)
                db.commit()
                db.refresh(subscriber)
            elif provision_data.client_address:
                new_address = provision_data.client_address.strip()
                if new_address and not subscriber.address_street:
                    subscriber.address_street = new_address
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

        # Get 'ativo' status ID dynamically, creating if necessary
        active_status = db.query(DeviceStatus).filter(DeviceStatus.name == "ativo").first()
        if not active_status:
            active_status = DeviceStatus(name="ativo")
            db.add(active_status)
            db.commit()
            db.refresh(active_status)
        
        status_id_val = active_status.id

        device = existing_device
        if existing_device:
            updates = {
                "subscriber_id": subscriber.id,
                "olt_port_id": olt_port.id,
                "status_id": status_id_val,
            }
            if genieacs_available:
                updates["genieacs_id"] = onu_id

            needs_update = any(
                getattr(existing_device, key) != value
                for key, value in updates.items()
            )
            if needs_update:
                for key, value in updates.items():
                    setattr(existing_device, key, value)
                db.add(existing_device)
                db.commit()
                db.refresh(existing_device)
        else:
            try:
                device = crud_device.create_device(db, device=DeviceCreate(
                    serial_number=serial_number,
                    genieacs_id=onu_id if genieacs_available else None,
                    subscriber_id=subscriber.id,
                    olt_port_id=olt_port.id,
                    status_id=status_id_val # 'ativo' status
                ))
            except IntegrityError:
                db.rollback()
                device = crud_device.get_device_by_serial_number(db, serial_number)
                if not device:
                    raise

        resolved_onu_type = provision_data.onu_type
        if _is_placeholder_onu_type(resolved_onu_type) and genieacs_available:
            resolved_onu_type = device_data.get('_deviceId', {}).get('_ProductClass')
        if _is_placeholder_onu_type(resolved_onu_type) and olt and serial_number:
            resolved_onu_type = await _resolve_autofind_onu_type(
                olt.id,
                serial_number,
            )

        resolved_line_profile = provision_data.line_profile or _DEFAULT_LINE_PROFILE
        resolved_srv_profile = provision_data.srv_profile or _resolve_srv_profile(resolved_onu_type)

        olt_port_str = _build_olt_port(provision_data)
        resolved_ont_id = provision_data.ont_id
        if resolved_ont_id is not None and resolved_ont_id <= 0:
            resolved_ont_id = None

        has_profiles = resolved_line_profile and resolved_srv_profile
        used_ids: Optional[set[int]] = None
        ont_id_error: Optional[str] = None

        async def _provision_on_olt() -> Dict[str, Any]:
            nonlocal resolved_ont_id, used_ids, ont_id_error
            if olt and olt_port_str and resolved_ont_id is None:
                used_ids = await _get_used_ont_ids(olt.id, olt_port_str)
                if used_ids is None:
                    ont_id_error = "falha ao consultar ONTs na porta"
                else:
                    resolved_ont_id = _pick_available_ont_id(used_ids)
                    if resolved_ont_id is None:
                        ont_id_error = "sem IDs livres na porta"

            missing_data_message = _describe_olt_missing_data(
                resolved_ont_id,
                olt_port_str,
                resolved_line_profile,
                resolved_srv_profile,
                ont_id_error=ont_id_error,
            )

            if missing_data_message or not olt:
                return {
                    "status": "skipped",
                    "message": missing_data_message
                    or "Dados insuficientes para provisionamento físico na OLT",
                }

            if not olt.ssh_username or not olt.ssh_password:
                return {
                    "status": "skipped",
                    "message": "Credenciais SSH da OLT ausentes",
                }
            if not olt.is_configured:
                return {
                    "status": "skipped",
                    "message": "OLT não configurada para provisionamento",
                }
            if not olt_port_str or resolved_ont_id is None or not has_profiles:
                return {
                    "status": "skipped",
                    "message": "Dados insuficientes para provisionamento físico na OLT",
                }

            olt_payload = {
                "port": olt_port_str,
                "ont_id": resolved_ont_id,
                "serial_number": serial_number,
                "line_profile": resolved_line_profile,
                "srv_profile": resolved_srv_profile,
            }
            if provision_data.client_name:
                olt_payload["description"] = provision_data.client_name.strip()
            olt_response = await _post_olt_manager(
                f"/api/v1/olts/{olt.id}/onts",
                olt_payload,
            )
            olt_success = olt_response.get("success")
            if olt_success is None:
                olt_success = olt_response.get("status") == "success"

            if not olt_success and _is_ont_id_conflict(olt_response):
                used_ids = await _get_used_ont_ids(olt.id, olt_port_str)
                if used_ids is not None:
                    fallback_ont_id = _pick_available_ont_id(used_ids)
                    if (
                        fallback_ont_id is not None
                        and fallback_ont_id != resolved_ont_id
                    ):
                        olt_payload["ont_id"] = fallback_ont_id
                        olt_response = await _post_olt_manager(
                            f"/api/v1/olts/{olt.id}/onts",
                            olt_payload,
                        )
                        olt_success = olt_response.get("success")
                        if olt_success is None:
                            olt_success = olt_response.get("status") == "success"

            return {
                "status": "success" if olt_success else "error",
                "response": olt_response,
            }

        olt_result: Dict[str, Any] = {
            "status": "skipped",
            "message": "Dados insuficientes para provisionamento físico na OLT",
        }

        lock_key: Optional[int] = None
        if olt and olt_port_str:
            lock_key = _build_pon_lock_key(olt.id, olt_port_str)

        if lock_key is not None:
            if db.in_transaction():
                _acquire_pon_lock(db, lock_key)
                olt_result = await _provision_on_olt()
            else:
                with db.begin():
                    _acquire_pon_lock(db, lock_key)
                    olt_result = await _provision_on_olt()
        else:
            olt_result = await _provision_on_olt()

        genieacs_result = {
            "status": "skipped",
            "message": "ONU não encontrada no GenieACS",
        }

        if genieacs_available:
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

        if genieacs_available:
            overall_success = olt_result["status"] != "error" and genieacs_result["status"] != "error"
        else:
            overall_success = olt_result["status"] == "success"

        if overall_success:
            if resolved_ont_id is not None:
                device.ont_id = resolved_ont_id
                db.add(device)
                db.commit()
            message = f"ONU {onu_id} autorizada com sucesso"
        elif not genieacs_available and olt_result["status"] == "skipped":
            olt_message = olt_result.get("message")
            if isinstance(olt_message, str) and olt_message.strip():
                message = (
                    olt_message
                    if olt_message.lower().startswith("provisionamento")
                    else f"Provisionamento pendente: {olt_message}"
                )
            else:
                message = "Provisionamento pendente: dados insuficientes para a OLT"
        else:
            reasons: List[str] = []
            if olt_result.get("status") == "error":
                reasons.append(f"OLT: {_describe_olt_error(olt_result)}")
            if genieacs_result.get("status") == "error":
                reasons.append(f"GenieACS: {_describe_genieacs_error(genieacs_result)}")
            if reasons:
                message = "Autorizada com ressalvas: " + " | ".join(reasons)
            else:
                message = f"ONU {onu_id} autorizada com ressalvas"

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

class WanReconfigRequest(BaseModel):
    mgmt_vlan: int
    tr069_profile_id: int
    ip_mode: str
    ip_address: Optional[str] = None
    mask: Optional[str] = None
    gateway: Optional[str] = None

@router.post("/{onu_id}/reconfigure-wan-async")
async def reconfigure_wan_async(onu_id: str, config_data: WanReconfigRequest, db: Session = Depends(get_db)):
    """
    Reconfigura WAN e TR-069 de uma ONU existente via arquitetura de eventos.
    """
    try:
        task_id = str(uuid.uuid4())
        logger.info(f"Iniciando reconfiguração ASSÍNCRONA para ONU {onu_id}, Task ID: {task_id}")

        # 1. Buscar device para obter OLT ID e Porta
        device = crud_device.get_device_by_serial_number(db, onu_id)
        if not device or not device.olt_port:
             raise HTTPException(status_code=404, detail="Dispositivo não encontrado ou sem porta vinculada")

        olt = device.olt_port.olt
        
        # 2. Preparar evento (Tipo: reconfigure_wan)
        event_payload = {
            "event_type": "reconfigure_wan",
            "task_id": task_id,
            "olt_id": olt.id,
            "port": f"0/{device.olt_port.slot}/{device.olt_port.port_number}",
            "ont_id": device.ont_id,
            "serial_number": onu_id,
            # Dados de rede que vieram do request
            "mgmt_vlan": config_data.mgmt_vlan,
            "wan_mode": config_data.ip_mode, # Mapear ip_mode para wan_mode
            "tr069_profile_id": config_data.tr069_profile_id,
            "ip_address": config_data.ip_address,
            "mask": config_data.mask,
            "gateway": config_data.gateway
        }

        # 3. Publicar evento
        await publisher.publish_event("task_queue", event_payload)

        return {
            "success": True,
            "message": "Solicitação de reconfiguração enviada.",
            "task_id": task_id,
            "status": "queued"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar reconfiguração assíncrona: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa: {str(e)}")

@router.put("/clients/serial/{serial_number}")
async def update_client_configuration_by_serial(serial_number: str, updates: ClientConfigurationUpdate, db: Session = Depends(get_db)):
    """
    Atualiza configuração de um cliente provisionado buscando pelo Serial Number.
    Utilizado pelo Worker para atualizar o ID físico da ONT.
    """
    device = crud_device.get_device_by_serial_number(db, serial_number)
    if not device:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    
    db.add(device)
    db.commit()
    db.refresh(device)
    
    return {"success": True, "message": "Configuração atualizada com sucesso"}

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
    devices = (
        db.query(Device)
        .options(
            selectinload(Device.subscriber),
            selectinload(Device.olt_port).selectinload(OltPort.olt),
        )
        .all()
    )
    result: List[Dict[str, Any]] = []
    for device in devices:
        subscriber = device.subscriber
        olt_port = device.olt_port
        result.append(
            {
                "id": device.id,
                "serial_number": device.serial_number,
                "ont_id": device.ont_id,
                "olt_id": olt_port.olt_id if olt_port else None,
                "pon_port": f"{olt_port.slot}/{olt_port.port_number}"
                if olt_port
                else None,
                "created_at": device.created_at,
                "status": "online" if device.status_id == 1 else "offline",
                "customer_name": subscriber.full_name if subscriber else None,
                "customer_address": subscriber.address_street if subscriber else None,
            }
        )
    return result

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
