"""Rotas de gerenciamento de OLTs, organizadas por dominio."""

from fastapi import APIRouter

from .base import router as base_router
from .discovery import router as discovery_router
from .setup import router as setup_router
from .logs import router as logs_router
from .stats import router as stats_router

router = APIRouter()
router.include_router(base_router)
router.include_router(discovery_router)
router.include_router(setup_router)
router.include_router(logs_router)
router.include_router(stats_router)

__all__ = ["router"]
