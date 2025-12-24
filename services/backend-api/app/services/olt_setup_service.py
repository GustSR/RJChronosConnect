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

    def _base_olt_payload(self, olt) -> Dict[str, Any]:
        return {
            "ip_address": str(olt.ip_address),
            "ssh_username": olt.ssh_username,
            "ssh_password": olt.ssh_password,
            "ssh_port": olt.ssh_port,
        }

    async def _post_olt_manager(
        self,
        path: str,
        payload: Dict[str, Any],
        error_context: str,
    ) -> Dict[str, Any]:
        try:
            response = await self.client.post(
                f"{self.olt_manager_base_url}{path}",
                json=payload,
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"{error_context}: {e}")
            return {"success": False, "message": str(e), "error": str(e)}

    async def _get_olt_manager(
        self,
        path: str,
        params: Dict[str, Any],
        error_context: str,
    ) -> Dict[str, Any]:
        try:
            response = await self.client.get(
                f"{self.olt_manager_base_url}{path}",
                params=params,
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"{error_context}: {e}")
            return {"success": False, "message": str(e), "error": str(e)}

    def _build_missing_olt_response(self, olt_id: int) -> OLTSetupResponse:
        return OLTSetupResponse(
            olt_id=olt_id,
            setup_status="failed",
            message=f"OLT com ID {olt_id} não encontrada",
        )

    def _build_already_configured_response(self, olt_id: int) -> OLTSetupResponse:
        return OLTSetupResponse(
            olt_id=olt_id,
            setup_status="configured",
            message="OLT já está configurada",
            duration_seconds=0,
        )

    def _create_setup_log(
        self,
        db: Session,
        olt,
        setup_request: OLTSetupRequest,
        user_id: Optional[int],
    ):
        return crud_olt.create_setup_log(db, OltSetupLogCreate(
            olt_id=olt.id,
            action="full_setup",
            status="in_progress",
            message=f"Iniciando configuração automática da OLT {olt.name}",
            executed_by_user_id=user_id,
            details={
                "olt_info": {
                    "name": olt.name,
                    "ip_address": str(olt.ip_address),
                    "vendor": olt.vendor,
                    "model": olt.model,
                },
                "setup_params": setup_request.dict(),
            },
        ))

    def _build_setup_response(
        self,
        olt_id: int,
        setup_status: str,
        message: str,
        setup_log_id: Optional[int],
        duration_seconds: int,
    ) -> OLTSetupResponse:
        return OLTSetupResponse(
            olt_id=olt_id,
            setup_status=setup_status,
            message=message,
            setup_log_id=setup_log_id,
            duration_seconds=duration_seconds,
        )

    def _mark_setup_success(
        self,
        db: Session,
        olt_id: int,
        setup_log_id: int,
        setup_log_details: Dict[str, Any],
        setup_result: Dict[str, Any],
        duration: int,
    ) -> None:
        crud_olt.update_olt_setup_status(db, olt_id, "configured", True)
        self._update_setup_log(
            db,
            setup_log_id,
            status="success",
            message="OLT configurada com sucesso para integração completa",
            duration_seconds=duration,
            details={
                **setup_log_details,
                "setup_result": setup_result,
                "configured_features": setup_result.get("configured_features", []),
            },
        )

    def _mark_setup_failure(
        self,
        db: Session,
        olt_id: int,
        setup_log_id: int,
        setup_log_details: Dict[str, Any],
        setup_result: Dict[str, Any],
        duration: int,
    ) -> None:
        crud_olt.update_olt_setup_status(db, olt_id, "failed", False)
        self._update_setup_log(
            db,
            setup_log_id,
            status="failed",
            message=f"Falha na configuração: {setup_result.get('message', 'Erro desconhecido')}",
            duration_seconds=duration,
            details={
                **setup_log_details,
                "setup_result": setup_result,
                "error": setup_result.get("error"),
            },
        )

    def _handle_setup_exception(
        self,
        db: Session,
        olt_id: int,
        setup_log_id: Optional[int],
        start_time: datetime,
        error: Exception,
    ) -> OLTSetupResponse:
        logger.error(f"Erro durante configuração da OLT {olt_id}: {error}")
        crud_olt.update_olt_setup_status(db, olt_id, "failed", False)

        if setup_log_id:
            duration = int((datetime.now() - start_time).total_seconds())
            self._update_setup_log(
                db,
                setup_log_id,
                status="failed",
                message=f"Erro interno durante configuração: {str(error)}",
                duration_seconds=duration,
                details={
                    "error": str(error),
                    "error_type": type(error).__name__,
                },
            )

        duration = int((datetime.now() - start_time).total_seconds())
        return self._build_setup_response(
            olt_id,
            "failed",
            f"Erro interno durante configuração: {str(error)}",
            setup_log_id,
            duration,
        )

    def _update_setup_log(
        self,
        db: Session,
        setup_log_id: int,
        status: str,
        message: str,
        duration_seconds: int,
        details: Dict[str, Any],
    ) -> None:
        crud_olt.update_setup_log(db, setup_log_id, OltSetupLogUpdate(
            status=status,
            message=message,
            completed_at=datetime.now(),
            duration_seconds=duration_seconds,
            details=details,
        ))
    
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
                return self._build_missing_olt_response(olt_id)
            
            # Verifica se OLT já está configurada
            if olt.is_configured:
                return self._build_already_configured_response(olt_id)
            
            # Cria log de configuração
            setup_log = self._create_setup_log(db, olt, setup_request, user_id)
            setup_log_id = setup_log.id
            
            # Atualiza status da OLT para "em configuração"
            crud_olt.update_olt_setup_status(db, olt_id, "in_progress", False)
            
            # Executa etapas de configuração
            setup_result = await self._execute_full_setup(olt, setup_request)

            duration = int((datetime.now() - start_time).total_seconds())
            if setup_result["success"]:
                self._mark_setup_success(
                    db,
                    olt_id,
                    setup_log_id,
                    setup_log.details,
                    setup_result,
                    duration,
                )
                return self._build_setup_response(
                    olt_id,
                    "configured",
                    "OLT configurada com sucesso",
                    setup_log_id,
                    duration,
                )

            self._mark_setup_failure(
                db,
                olt_id,
                setup_log_id,
                setup_log.details,
                setup_result,
                duration,
            )
            return self._build_setup_response(
                olt_id,
                "failed",
                setup_result.get("message", "Falha na configuração da OLT"),
                setup_log_id,
                duration,
            )

        except Exception as e:
            return self._handle_setup_exception(db, olt_id, setup_log_id, start_time, e)
    
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
        payload = {
            **self._base_olt_payload(olt),
            "snmp_community": community,
        }
        return await self._post_olt_manager(
            f"/api/v1/olts/{olt.id}/setup/snmp",
            payload,
            "Erro HTTP na configuração SNMP",
        )
    
    async def _setup_snmp_traps(self, olt, trap_destination: str) -> Dict[str, Any]:
        """Configura Traps SNMP na OLT."""
        payload = {
            **self._base_olt_payload(olt),
            "trap_destination": trap_destination,
        }
        return await self._post_olt_manager(
            f"/api/v1/olts/{olt.id}/setup/traps",
            payload,
            "Erro HTTP na configuração de Traps",
        )
    
    async def _setup_auto_provisioning(self, olt) -> Dict[str, Any]:
        """Configura auto-provisionamento na OLT."""
        payload = self._base_olt_payload(olt)
        return await self._post_olt_manager(
            f"/api/v1/olts/{olt.id}/setup/auto-provisioning",
            payload,
            "Erro HTTP na configuração de auto-provisionamento",
        )
    
    async def _verify_configuration(self, olt) -> Dict[str, Any]:
        """Verifica se a configuração foi aplicada corretamente."""
        payload = self._base_olt_payload(olt)
        return await self._get_olt_manager(
            f"/api/v1/olts/{olt.id}/verify-setup",
            payload,
            "Erro HTTP na verificação de configuração",
        )
