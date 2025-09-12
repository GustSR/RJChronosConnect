"""
Serviço de Descoberta Automática de OLTs
Integra com o OLT Manager via HTTP para descobrir e configurar OLTs automaticamente
"""

import httpx
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from app.crud import olt as crud_olt
from app.schemas.olt import OLTCreate, OLTDiscoveryRequest
from app.schemas.olt_setup import OltSetupLogCreate, OltSetupLogUpdate, OLTDiscoveryResult
from app.core.config import settings

logger = logging.getLogger(__name__)


class OLTDiscoveryService:
    """Serviço para descoberta automática de OLTs."""
    
    def __init__(self):
        # URL do OLT Manager - ajustar conforme ambiente
        self.olt_manager_base_url = getattr(settings, 'OLT_MANAGER_URL', 'http://olt-manager-huawei:8000')
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def discover_olt(
        self, 
        db: Session, 
        discovery_request: OLTDiscoveryRequest,
        user_id: Optional[int] = None
    ) -> OLTDiscoveryResult:
        """
        Descobre uma OLT específica via SSH e opcionalmente configura automaticamente.
        
        Args:
            db: Sessão do banco de dados
            discovery_request: Dados da descoberta
            user_id: ID do usuário que iniciou a descoberta
            
        Returns:
            OLTDiscoveryResult: Resultado da descoberta
        """
        start_time = datetime.now()
        setup_log_id = None
        
        try:
            # Verifica se OLT já existe pelo IP
            existing_olt = crud_olt.get_olt_by_ip(db, discovery_request.ip_address)
            if existing_olt:
                return OLTDiscoveryResult(
                    success=False,
                    message=f"OLT com IP {discovery_request.ip_address} já existe (ID: {existing_olt.id})",
                    duration_seconds=0
                )
            
            # Cria log de descoberta
            setup_log = crud_olt.create_setup_log(db, OltSetupLogCreate(
                olt_id=0,  # Será atualizado quando a OLT for criada
                action="discovery",
                status="in_progress",
                message=f"Iniciando descoberta da OLT {discovery_request.ip_address}",
                executed_by_user_id=user_id,
                details={
                    "ip_address": discovery_request.ip_address,
                    "ssh_port": discovery_request.ssh_port,
                    "auto_configure": discovery_request.auto_configure
                }
            ))
            setup_log_id = setup_log.id
            
            # Chama serviço de descoberta no OLT Manager
            discovery_result = await self._call_olt_manager_discovery(discovery_request)
            
            if discovery_result["success"]:
                # Cria OLT no banco de dados
                olt_data = OLTCreate(
                    name=discovery_result.get("name", f"OLT-{discovery_request.ip_address}"),
                    ip_address=discovery_request.ip_address,
                    vendor=discovery_result.get("vendor"),
                    model=discovery_result.get("model"),
                    ssh_username=discovery_request.ssh_username,
                    ssh_password=discovery_request.ssh_password,
                    ssh_port=discovery_request.ssh_port
                )
                
                new_olt = crud_olt.create_olt(db, olt_data)
                
                # Atualiza OLT como descoberta
                crud_olt.mark_olt_as_discovered(
                    db, 
                    new_olt.id, 
                    discovery_result.get("vendor"), 
                    discovery_result.get("model")
                )
                
                # Atualiza log com sucesso
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="success",
                    message="OLT descoberta com sucesso",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        **setup_log.details,
                        "olt_id": new_olt.id,
                        "discovery_result": discovery_result
                    }
                ))
                
                # Atualiza o olt_id no log agora que temos a OLT criada
                setup_log.olt_id = new_olt.id
                db.commit()
                
                return OLTDiscoveryResult(
                    success=True,
                    olt_id=new_olt.id,
                    vendor=discovery_result.get("vendor"),
                    model=discovery_result.get("model"),
                    system_info=discovery_result.get("system_info"),
                    setup_log_id=setup_log_id,
                    message="OLT descoberta e cadastrada com sucesso",
                    duration_seconds=duration
                )
            else:
                # Falha na descoberta
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="failed",
                    message=f"Falha na descoberta: {discovery_result.get('message', 'Erro desconhecido')}",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        **setup_log.details,
                        "error": discovery_result.get("error"),
                        "discovery_result": discovery_result
                    }
                ))
                
                return OLTDiscoveryResult(
                    success=False,
                    setup_log_id=setup_log_id,
                    message=discovery_result.get("message", "Falha na descoberta da OLT"),
                    duration_seconds=duration
                )
                
        except Exception as e:
            logger.error(f"Erro durante descoberta da OLT {discovery_request.ip_address}: {e}")
            
            # Atualiza log com erro
            if setup_log_id:
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="failed",
                    message=f"Erro interno durante descoberta: {str(e)}",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        "error": str(e),
                        "error_type": type(e).__name__
                    }
                ))
            
            return OLTDiscoveryResult(
                success=False,
                setup_log_id=setup_log_id,
                message=f"Erro interno durante descoberta: {str(e)}",
                duration_seconds=int((datetime.now() - start_time).total_seconds())
            )
    
    async def discover_network_range(
        self, 
        db: Session, 
        ip_range: str, 
        ssh_username: str, 
        ssh_password: str,
        ssh_port: int = 22,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Descobre OLTs em uma faixa de IPs.
        
        Args:
            db: Sessão do banco de dados
            ip_range: Faixa de IPs (ex: "192.168.1.1-50" ou "192.168.1.0/24")
            ssh_username: Usuário SSH para conexão
            ssh_password: Senha SSH para conexão
            ssh_port: Porta SSH
            user_id: ID do usuário que iniciou a descoberta
            
        Returns:
            Dict com resultado da descoberta em massa
        """
        try:
            # Expande faixa de IPs
            ip_list = self._expand_ip_range(ip_range)
            
            discoveries = []
            for ip in ip_list:
                discovery_request = OLTDiscoveryRequest(
                    ip_address=ip,
                    ssh_username=ssh_username,
                    ssh_password=ssh_password,
                    ssh_port=ssh_port,
                    auto_configure=False  # Por segurança, não configura automaticamente em descoberta em massa
                )
                
                result = await self.discover_olt(db, discovery_request, user_id)
                discoveries.append(result)
                
                # Log do progresso
                if result.success:
                    logger.info(f"✅ OLT descoberta em {ip}: {result.vendor} {result.model}")
                else:
                    logger.warning(f"❌ Falha ao descobrir OLT em {ip}: {result.message}")
            
            successful = len([d for d in discoveries if d.success])
            failed = len([d for d in discoveries if not d.success])
            
            return {
                "discoveries": discoveries,
                "total_attempts": len(ip_list),
                "successful_discoveries": successful,
                "failed_discoveries": failed,
                "success_rate": (successful / len(ip_list)) * 100 if ip_list else 0
            }
            
        except Exception as e:
            logger.error(f"Erro durante descoberta em massa: {e}")
            return {
                "discoveries": [],
                "total_attempts": 0,
                "successful_discoveries": 0,
                "failed_discoveries": 0,
                "success_rate": 0,
                "error": str(e)
            }
    
    async def _call_olt_manager_discovery(self, discovery_request: OLTDiscoveryRequest) -> Dict[str, Any]:
        """Chama o serviço de descoberta no OLT Manager."""
        try:
            response = await self.client.post(
                f"{self.olt_manager_base_url}/api/v1/discovery/olt",
                json={
                    "ip_address": discovery_request.ip_address,
                    "ssh_username": discovery_request.ssh_username,
                    "ssh_password": discovery_request.ssh_password,
                    "ssh_port": discovery_request.ssh_port
                }
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP ao chamar OLT Manager: {e}")
            return {
                "success": False,
                "message": f"Erro de comunicação com OLT Manager: {str(e)}",
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Erro inesperado ao chamar OLT Manager: {e}")
            return {
                "success": False,
                "message": f"Erro inesperado: {str(e)}",
                "error": str(e)
            }
    
    def _expand_ip_range(self, ip_range: str) -> List[str]:
        """Expande uma faixa de IPs em lista de IPs individuais."""
        import ipaddress
        
        try:
            if '-' in ip_range:
                # Formato: 192.168.1.1-50
                base_ip, end_range = ip_range.split('-')
                base_parts = base_ip.split('.')
                start_ip = int(base_parts[3])
                end_ip = int(end_range)
                
                ips = []
                for i in range(start_ip, end_ip + 1):
                    ip = f"{'.'.join(base_parts[:3])}.{i}"
                    ips.append(ip)
                return ips
                
            elif '/' in ip_range:
                # Formato CIDR: 192.168.1.0/24
                network = ipaddress.IPv4Network(ip_range, strict=False)
                return [str(ip) for ip in network.hosts()]
                
            else:
                # IP único
                return [ip_range]
                
        except Exception as e:
            logger.error(f"Erro ao expandir faixa de IPs {ip_range}: {e}")
            return []