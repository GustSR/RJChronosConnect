"""
Serviço de Configuração Automática de OLTs
Configura OLTs descobertas com as configurações necessárias para integração
"""

import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.crud import olt as crud_olt
from app.schemas.olt import OLTSetupRequest, OLTSetupResponse
from app.schemas.olt_setup import OltSetupLogCreate, OltSetupLogUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)


class OLTSetupService:
    """Serviço para configuração automática de OLTs."""
    
    def __init__(self):
        # URL do OLT Manager - ajustar conforme ambiente
        self.olt_manager_base_url = getattr(settings, 'OLT_MANAGER_URL', 'http://olt-manager-huawei:8000')
        self.client = httpx.AsyncClient(timeout=120.0)  # Timeout maior para configurações
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def setup_olt(
        self, 
        db: Session, 
        olt_id: int, 
        setup_request: OLTSetupRequest,
        user_id: Optional[int] = None
    ) -> OLTSetupResponse:
        """
        Configura uma OLT existente com as configurações necessárias.
        
        Args:
            db: Sessão do banco de dados
            olt_id: ID da OLT a ser configurada
            setup_request: Parâmetros de configuração
            user_id: ID do usuário que iniciou a configuração
            
        Returns:
            OLTSetupResponse: Resultado da configuração
        """
        start_time = datetime.now()
        setup_log_id = None
        
        try:
            # Busca OLT no banco
            olt = crud_olt.get_olt(db, olt_id)
            if not olt:
                return OLTSetupResponse(
                    olt_id=olt_id,
                    setup_status="failed",
                    message=f"OLT com ID {olt_id} não encontrada"
                )
            
            # Verifica se OLT já está configurada
            if olt.is_configured:
                return OLTSetupResponse(
                    olt_id=olt_id,
                    setup_status="configured",
                    message="OLT já está configurada",
                    duration_seconds=0
                )
            
            # Cria log de configuração
            setup_log = crud_olt.create_setup_log(db, OltSetupLogCreate(
                olt_id=olt_id,
                action="full_setup",
                status="in_progress",
                message=f"Iniciando configuração automática da OLT {olt.name}",
                executed_by_user_id=user_id,
                details={
                    "olt_info": {
                        "name": olt.name,
                        "ip_address": str(olt.ip_address),
                        "vendor": olt.vendor,
                        "model": olt.model
                    },
                    "setup_params": setup_request.dict()
                }
            ))
            setup_log_id = setup_log.id
            
            # Atualiza status da OLT para "em configuração"
            crud_olt.update_olt_setup_status(db, olt_id, "in_progress", False)
            
            # Executa etapas de configuração
            setup_result = await self._execute_full_setup(olt, setup_request)
            
            if setup_result["success"]:
                # Configuração bem-sucedida
                crud_olt.update_olt_setup_status(db, olt_id, "configured", True)
                
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="success",
                    message="OLT configurada com sucesso para integração completa",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        **setup_log.details,
                        "setup_result": setup_result,
                        "configured_features": setup_result.get("configured_features", [])
                    }
                ))
                
                return OLTSetupResponse(
                    olt_id=olt_id,
                    setup_status="configured",
                    message="OLT configurada com sucesso",
                    setup_log_id=setup_log_id,
                    duration_seconds=duration
                )
            else:
                # Falha na configuração
                crud_olt.update_olt_setup_status(db, olt_id, "failed", False)
                
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="failed",
                    message=f"Falha na configuração: {setup_result.get('message', 'Erro desconhecido')}",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        **setup_log.details,
                        "setup_result": setup_result,
                        "error": setup_result.get("error")
                    }
                ))
                
                return OLTSetupResponse(
                    olt_id=olt_id,
                    setup_status="failed",
                    message=setup_result.get("message", "Falha na configuração da OLT"),
                    setup_log_id=setup_log_id,
                    duration_seconds=duration
                )
                
        except Exception as e:
            logger.error(f"Erro durante configuração da OLT {olt_id}: {e}")
            
            # Reverte status em caso de erro
            crud_olt.update_olt_setup_status(db, olt_id, "failed", False)
            
            # Atualiza log com erro
            if setup_log_id:
                duration = int((datetime.now() - start_time).total_seconds())
                crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
                    status="failed",
                    message=f"Erro interno durante configuração: {str(e)}",
                    completed_at=datetime.now(),
                    duration_seconds=duration,
                    details={
                        "error": str(e),
                        "error_type": type(e).__name__
                    }
                ))
            
            return OLTSetupResponse(
                olt_id=olt_id,
                setup_status="failed",
                message=f"Erro interno durante configuração: {str(e)}",
                setup_log_id=setup_log_id,
                duration_seconds=int((datetime.now() - start_time).total_seconds())
            )
    
    async def setup_multiple_olts(
        self, 
        db: Session, 
        olt_ids: list[int], 
        setup_request: OLTSetupRequest,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Configura múltiplas OLTs em lote.
        
        Args:
            db: Sessão do banco de dados
            olt_ids: Lista de IDs das OLTs
            setup_request: Parâmetros de configuração
            user_id: ID do usuário que iniciou a configuração
            
        Returns:
            Dict com resultado da configuração em lote
        """
        results = []
        
        for olt_id in olt_ids:
            result = await self.setup_olt(db, olt_id, setup_request, user_id)
            results.append(result)
            
            # Log do progresso
            if result.setup_status == "configured":
                logger.info(f"✅ OLT {olt_id} configurada com sucesso")
            else:
                logger.warning(f"❌ Falha ao configurar OLT {olt_id}: {result.message}")
        
        successful = len([r for r in results if r.setup_status == "configured"])
        failed = len([r for r in results if r.setup_status == "failed"])
        
        return {
            "setup_results": results,
            "total_olts": len(olt_ids),
            "successful_setups": successful,
            "failed_setups": failed,
            "success_rate": (successful / len(olt_ids)) * 100 if olt_ids else 0
        }
    
    async def _execute_full_setup(self, olt, setup_request: OLTSetupRequest) -> Dict[str, Any]:
        """Executa todas as etapas de configuração de uma OLT."""
        try:
            configured_features = []
            
            # 1. Configuração SNMP
            snmp_result = await self._setup_snmp_configuration(olt, setup_request.snmp_community)
            if snmp_result["success"]:
                configured_features.append("snmp")
            else:
                return {
                    "success": False,
                    "message": f"Falha na configuração SNMP: {snmp_result.get('message')}",
                    "error": snmp_result.get("error")
                }
            
            # 2. Configuração de Traps SNMP
            if setup_request.trap_destination:
                trap_result = await self._setup_snmp_traps(olt, setup_request.trap_destination)
                if trap_result["success"]:
                    configured_features.append("snmp_traps")
                else:
                    return {
                        "success": False,
                        "message": f"Falha na configuração de Traps: {trap_result.get('message')}",
                        "error": trap_result.get("error")
                    }
            
            # 3. Configuração de Auto-provisionamento
            if setup_request.enable_auto_provisioning:
                auto_prov_result = await self._setup_auto_provisioning(olt)
                if auto_prov_result["success"]:
                    configured_features.append("auto_provisioning")
                else:
                    return {
                        "success": False,
                        "message": f"Falha na configuração de auto-provisionamento: {auto_prov_result.get('message')}",
                        "error": auto_prov_result.get("error")
                    }
            
            # 4. Verificação final da configuração
            verification_result = await self._verify_configuration(olt)
            if not verification_result["success"]:
                return {
                    "success": False,
                    "message": f"Falha na verificação final: {verification_result.get('message')}",
                    "error": verification_result.get("error")
                }
            
            return {
                "success": True,
                "message": "OLT configurada com sucesso",
                "configured_features": configured_features,
                "verification": verification_result
            }
            
        except Exception as e:
            logger.error(f"Erro durante configuração completa: {e}")
            return {
                "success": False,
                "message": f"Erro durante configuração: {str(e)}",
                "error": str(e)
            }
    
    async def _setup_snmp_configuration(self, olt, community: str) -> Dict[str, Any]:
        """Configura SNMP na OLT."""
        try:
            response = await self.client.post(
                f"{self.olt_manager_base_url}/api/v1/olts/{olt.id}/setup/snmp",
                json={
                    "ip_address": str(olt.ip_address),
                    "ssh_username": olt.ssh_username,
                    "ssh_password": olt.ssh_password,
                    "ssh_port": olt.ssh_port,
                    "snmp_community": community
                }
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP na configuração SNMP: {e}")
            return {"success": False, "message": str(e), "error": str(e)}
    
    async def _setup_snmp_traps(self, olt, trap_destination: str) -> Dict[str, Any]:
        """Configura Traps SNMP na OLT."""
        try:
            response = await self.client.post(
                f"{self.olt_manager_base_url}/api/v1/olts/{olt.id}/setup/traps",
                json={
                    "ip_address": str(olt.ip_address),
                    "ssh_username": olt.ssh_username,
                    "ssh_password": olt.ssh_password,
                    "ssh_port": olt.ssh_port,
                    "trap_destination": trap_destination
                }
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP na configuração de Traps: {e}")
            return {"success": False, "message": str(e), "error": str(e)}
    
    async def _setup_auto_provisioning(self, olt) -> Dict[str, Any]:
        """Configura auto-provisionamento na OLT."""
        try:
            response = await self.client.post(
                f"{self.olt_manager_base_url}/api/v1/olts/{olt.id}/setup/auto-provisioning",
                json={
                    "ip_address": str(olt.ip_address),
                    "ssh_username": olt.ssh_username,
                    "ssh_password": olt.ssh_password,
                    "ssh_port": olt.ssh_port
                }
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP na configuração de auto-provisionamento: {e}")
            return {"success": False, "message": str(e), "error": str(e)}
    
    async def _verify_configuration(self, olt) -> Dict[str, Any]:
        """Verifica se a configuração foi aplicada corretamente."""
        try:
            response = await self.client.get(
                f"{self.olt_manager_base_url}/api/v1/olts/{olt.id}/verify-setup",
                params={
                    "ip_address": str(olt.ip_address),
                    "ssh_username": olt.ssh_username,
                    "ssh_password": olt.ssh_password,
                    "ssh_port": olt.ssh_port
                }
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"Erro HTTP na verificação de configuração: {e}")
            return {"success": False, "message": str(e), "error": str(e)}