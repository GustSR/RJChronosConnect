"""
OLT Manager - Fiberhome
Minimal FastAPI service for Fiberhome OLT operations.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api import health_routes, olt_routes, ont_routes
from .core.logging import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting OLT Manager - Fiberhome")
    yield
    logger.info("Stopping OLT Manager - Fiberhome")


app = FastAPI(
    title="OLT Manager - Fiberhome",
    description="Microservice for Fiberhome OLT/ONT operations",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.include_router(olt_routes.router)
app.include_router(ont_routes.router)
app.include_router(health_routes.router)


@app.get("/", tags=["Info"])
def service_info():
    return {
        "service": "olt-manager-fiberhome",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
