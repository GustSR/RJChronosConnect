"""Middleware de autenticacao por header injetado pelo Edge Gateway."""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.database.database import SessionLocal
from app.crud.user import get_or_create_user_from_edge

import logging

logger = logging.getLogger(__name__)

PUBLIC_PATH_PREFIXES = (
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
)

PUBLIC_PATHS_EXACT = (
    "/",
)


def is_public_path(path: str) -> bool:
    if path in PUBLIC_PATHS_EXACT:
        return True
    for prefix in PUBLIC_PATH_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


class EdgeAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if is_public_path(path):
            return await call_next(request)

        user_id = request.headers.get("X-User-Id", "").strip()
        user_email = request.headers.get("X-User-Email", "").strip()

        if not user_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Nao autenticado"},
            )

        db = SessionLocal()
        try:
            user = get_or_create_user_from_edge(
                db,
                external_id=user_id,
                email=user_email or f"{user_id}@edge.local",
            )
            db.commit()
            db.refresh(user)
            db.expunge(user)
            request.state.current_user = user
        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao provisionar usuario: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Erro interno de autenticacao"},
            )
        finally:
            db.close()

        return await call_next(request)
