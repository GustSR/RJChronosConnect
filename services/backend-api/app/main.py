from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import time
import asyncio
from contextlib import asynccontextmanager

from .api import auth, devices, monitoring, provisioning, tasks, wifi, olt_management, internal_olts
from .core.logging import init_logging, cleanup_logging, log_api_request, log_error


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação com logging."""
    # Startup
    try:
        await init_logging()
        print("✅ Sistema de logging inicializado")
    except Exception as e:
        print(f"❌ Erro ao inicializar logging: {e}")

    yield

    # Shutdown
    try:
        await cleanup_logging()
        print("✅ Sistema de logging finalizado")
    except Exception as e:
        print(f"❌ Erro ao finalizar logging: {e}")


app = FastAPI(
    title="RJChronos API",
    description="Sistema de Gestão e Monitoramento de Rede",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware para logging automático de requests
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware para capturar logs de todas as requisições API."""
    start_time = time.time()

    try:
        # Chamar próximo middleware/endpoint
        response = await call_next(request)

        # Calcular tempo de resposta
        response_time = (time.time() - start_time) * 1000  # em millisegundos

        # Log da requisição (assíncrono, não bloqueia a resposta)
        asyncio.create_task(
            log_api_request(
                endpoint=str(request.url.path),
                method=request.method,
                response_time=response_time,
                status_code=response.status_code,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None,
                query_params=dict(request.query_params) if request.query_params else None
            )
        )

        return response

    except Exception as e:
        # Calcular tempo até o erro
        response_time = (time.time() - start_time) * 1000

        # Log do erro
        asyncio.create_task(
            log_error(
                e,
                f"Erro em {request.method} {request.url.path}",
                endpoint=str(request.url.path),
                method=request.method,
                response_time=response_time,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None
            )
        )

        # Re-raise para que o FastAPI trate o erro normalmente
        raise

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
app.include_router(internal_olts.router, prefix="/internal/olts", tags=["Internal OLT"])
