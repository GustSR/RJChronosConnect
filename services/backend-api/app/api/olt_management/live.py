import asyncio
import httpx
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database.database import get_db
from ...core.config import settings
from ..helpers import ensure_olt_exists
from ...schemas.olt_live import OLTLiveInfo

logger = logging.getLogger(__name__)

router = APIRouter()


async def _fetch_olt_manager(client: httpx.AsyncClient, path: str):
    url = f"{settings.OLT_MANAGER_URL}{path}"
    try:
        response = await client.get(url)
        response.raise_for_status()
        return {"ok": True, "data": response.json()}
    except Exception as exc:
        logger.error(f"Erro ao chamar OLT Manager em {url}: {exc}")
        return {"ok": False, "error": str(exc)}


@router.get("/{olt_id}/live", response_model=OLTLiveInfo)
async def get_olt_live_info(olt_id: int, db: Session = Depends(get_db)):
    ensure_olt_exists(db, olt_id)

    async with httpx.AsyncClient(timeout=15.0) as client:
        version_task = _fetch_olt_manager(
            client, f"/api/v1/olts/{olt_id}/version"
        )
        sysname_task = _fetch_olt_manager(
            client, f"/api/v1/olts/{olt_id}/hostname"
        )
        version_result, sysname_result = await asyncio.gather(
            version_task, sysname_task
        )

    version = None
    sysname = None
    errors = {}

    if version_result["ok"]:
        version = version_result["data"].get("version")
    else:
        errors["version"] = version_result.get("error", "unknown_error")

    if sysname_result["ok"]:
        sysname = sysname_result["data"].get("sysname")
    else:
        errors["sysname"] = sysname_result.get("error", "unknown_error")

    reachable = version is not None or sysname is not None
    return OLTLiveInfo(
        olt_id=olt_id,
        reachable=reachable,
        version=version,
        sysname=sysname,
        errors=errors or None,
    )
