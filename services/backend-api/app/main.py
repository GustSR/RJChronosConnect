from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Import API routers
from app.api import auth, devices, monitoring, tasks, wifi

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RJChronos Backend starting up...")
    yield
    logger.info("🛑 RJChronos Backend shutting down...")

# FastAPI app instance
app = FastAPI(
    title="RJChronos API",
    description="Sistema de Gestão e Monitoramento de Rede",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "RJChronos API v1.0.0", "status": "online"}

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(monitoring.router, prefix="/api", tags=["Monitoring"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(wifi.router, prefix="/api/wifi", tags=["WiFi"])