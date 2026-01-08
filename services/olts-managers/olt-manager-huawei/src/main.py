"""
OLT Manager - Huawei
Microsserviço especializado para gestão de OLTs Huawei.

Arquitetura organizada por domínios:
- OLT: Gestão do equipamento (portas PON, perfis, configurações)
- ONT: Gestão de clientes (provisionamento, monitoramento, diagnósticos)
- Health: Monitoramento do serviço
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .trap_listener.listener import TrapListener
from .core.exceptions import OLTException, OLTObjectNotFound
from .core.logging import get_logger
from .services.connection_pool import pool_manager

# Import das rotas organizadas por domínio
from .api import olt_routes, ont_routes, health_routes, report_routes

# ============================================================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================================================

app = FastAPI(
    title="OLT Manager - Huawei",
    description="""
    Microsserviço especializado para gestão de equipamentos OLT Huawei.

    ## Funcionalidades

    ### 🏗️ Gestão de OLT
    - Configuração de portas PON
    - Gestão de perfis e VLANs
    - Backup e restore
    - Monitoramento de hardware

    ### 👥 Gestão de ONTs/Clientes
    - Provisionamento automático
    - Monitoramento em tempo real
    - Diagnósticos avançados
    - Descoberta automática (autofind)

    ### 📊 Monitoramento
    - Health checks
    - Estatísticas de pool de conexão
    - Eventos SNMP em tempo real
    """,
    version="0.5.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# TRATAMENTO DE EXCEÇÕES
# ============================================================================

@app.exception_handler(OLTException)
async def olt_exception_handler(request: Request, exc: OLTException):
    """Tratamento personalizado para exceções da OLT."""
    return JSONResponse(
        status_code=400,
        content={
            "error": "OLT_ERROR",
            "message": f"Erro na OLT: {exc.message}",
            "details": exc.extra
        },
    )

@app.exception_handler(OLTObjectNotFound)
async def olt_object_not_found_handler(request: Request, exc: OLTObjectNotFound):
    """Tratamento personalizado para objetos não encontrados na OLT."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "OBJECT_NOT_FOUND",
            "message": f"Objeto não encontrado na OLT: {exc.message}",
            "details": exc.extra
        },
    )

# ============================================================================
# CONFIGURAÇÃO DE ROTAS POR DOMÍNIO
# ============================================================================

# Rotas de gestão de OLT (equipamento)
app.include_router(
    olt_routes.router,
    tags=["🏗️ OLT Management"]
)

# Rotas de gestão de ONT (clientes)
app.include_router(
    ont_routes.router,
    tags=["👥 ONT Management"]
)

# Rotas de relatorios
app.include_router(
    report_routes.router,
    tags=["📄 Reports"]
)

# Rotas de health e monitoramento
app.include_router(
    health_routes.router,
    tags=["📊 Health & Monitoring"]
)

# ============================================================================
# LIFECYCLE DO SERVIÇO
# ============================================================================

trap_listener = TrapListener()
logger = get_logger(__name__)

@app.on_event("startup")
def startup_event():
    """
    Inicialização do microsserviço.

    - Inicia o listener de traps SNMP para eventos em tempo real
    - Configura pools de conexão SSH
    - Prepara integração com RabbitMQ
    """
    try:
        logger.info("🚀 Iniciando OLT Manager - Huawei v0.5.0")

        # Iniciar listener de traps SNMP
        trap_listener.iniciar()
        logger.info("✅ Listener de traps SNMP iniciado com sucesso")

        # Log de configuração
        logger.info("📡 Microsserviço pronto para receber requisições")
        logger.info("🔗 Endpoints organizados por domínio:")
        logger.info("   • /api/v1/olts/* - Gestão de OLT")
        logger.info("   • /api/v1/olts/*/onts/* - Gestão de ONT")
        logger.info("   • /health - Health check")

    except Exception as e:
        # Se o listener falhar, o serviço ainda pode funcionar para APIs
        logger.critical(f"❌ Falha ao iniciar listener de traps: {e}")
        logger.warning("⚠️  Serviço funcionará apenas para APIs diretas")

@app.on_event("shutdown")
def shutdown_event():
    """
    Encerramento graceful do microsserviço.

    - Para o listener de traps SNMP
    - Fecha todas as conexões SSH do pool
    - Limpa recursos
    """
    logger.info("🛑 Encerrando OLT Manager - Huawei")

    try:
        # Parar listener de traps
        trap_listener.parar()
        logger.info("✅ Listener de traps SNMP parado")

        # Fechar pools de conexão
        pool_manager.close_all()
        logger.info("✅ Pools de conexão SSH fechados")

    except Exception as e:
        logger.error(f"❌ Erro durante encerramento: {e}")

    logger.info("✅ Serviço encerrado com sucesso")

# ============================================================================
# INFORMAÇÕES DO SERVIÇO
# ============================================================================

@app.get("/", tags=["📋 Info"])
def service_info():
    """
    Informações básicas do microsserviço.
    """
    return {
        "service": "olt-manager-huawei",
        "version": "0.5.0",
        "description": "Microsserviço para gestão de OLTs Huawei",
        "architecture": "Domain-Driven Design",
        "domains": {
            "olt": "Gestão do equipamento OLT",
            "ont": "Gestão de clientes ONT/ONU",
            "health": "Monitoramento do serviço"
        },
        "docs": "/docs",
        "health": "/health",
        "pool_stats": "/pool-stats"
    }
