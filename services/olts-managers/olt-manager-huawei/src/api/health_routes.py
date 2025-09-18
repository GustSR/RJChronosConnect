"""
Rotas de API para health checks e monitoramento do sistema.

Este módulo contém endpoints para verificação de saúde do serviço,
estatísticas de performance e informações de sistema.
"""

from fastapi import APIRouter

from ..services.connection_pool import pool_manager

router = APIRouter(tags=["Health & Monitoring"])

@router.get("/health", summary="Health Check")
def health_check():
    """
    Endpoint de health check para verificação de saúde do serviço.

    Usado pelo orquestrador (Docker, Kubernetes) para verificar se o serviço
    está funcionando corretamente.
    """
    return {
        "status": "healthy",
        "service": "olt-manager-huawei",
        "version": "0.5.0"
    }

@router.get("/pool-stats", summary="Connection Pool Statistics")
def get_pool_stats():
    """
    Retorna estatísticas detalhadas dos pools de conexão SSH.

    Útil para monitoramento de performance e debugging de problemas
    de conectividade com as OLTs.
    """
    return {
        "pools": pool_manager.get_stats(),
        "total_pools": len(pool_manager._pools),
        "service_info": {
            "name": "olt-manager-huawei",
            "version": "0.5.0",
            "description": "Huawei OLT Management Service"
        }
    }