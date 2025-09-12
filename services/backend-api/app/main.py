from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import auth, devices, monitoring, provisioning, tasks, wifi, olt_management

app = FastAPI(
    title="RJChronos API",
    description="Sistema de Gestão e Monitoramento de Rede",
    version="2.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RJChronos API v2.0.0 - Refactored", "status": "online"}

# Include routers from API modules
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(monitoring.router, prefix="/api", tags=["Monitoring"])
app.include_router(provisioning.router, prefix="/api/provisioning", tags=["Provisioning"])
app.include_router(tasks.router, prefix="/api/activity-history", tags=["Activity History"])
app.include_router(wifi.router, prefix="/api/wifi", tags=["WiFi"])
app.include_router(olt_management.router, prefix="/api/olts", tags=["OLT Management"])
