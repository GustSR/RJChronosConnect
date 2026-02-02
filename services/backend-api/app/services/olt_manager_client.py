import httpx
import logging
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

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

async def post_olt_manager(path: str, payload: Dict[str, Any] = None) -> Dict[str, Any]:
    urls = _build_olt_manager_urls(path)
    last_error: Optional[Exception] = None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for url in urls:
                try:
                    response = await client.post(url, json=payload or {})
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

async def delete_olt_manager(path: str) -> Dict[str, Any]:
    urls = _build_olt_manager_urls(path)
    last_error: Optional[Exception] = None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for url in urls:
                try:
                    response = await client.delete(url)
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
