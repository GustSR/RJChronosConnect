# -*- coding: utf-8 -*-
"""
Comandos para backup e restore de configuração da OLT.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json
from ..base_command import BaseCommand
from ...core.logging import get_logger

logger = get_logger(__name__)

class BackupConfigurationCommand(BaseCommand):
    """
    Faz backup da configuração da OLT.
    """
    
    def __init__(self, backup_type: str = "full", include_passwords: bool = False):
        """
        Inicializa comando para backup.
        
        Args:
            backup_type: Tipo de backup (full, profiles, interfaces)
            include_passwords: Se deve incluir senhas no backup
        """
        self.backup_type = backup_type
        self.include_passwords = include_passwords
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa backup da configuração.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Backup da configuração
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            logger.info(f"Iniciando backup {self.backup_type} da configuração")
            
            backup_data = {
                "backup_info": {
                    "timestamp": timestamp,
                    "type": self.backup_type,
                    "olt_version": olt_version,
                    "include_passwords": self.include_passwords
                },
                "configuration": {}
            }
            
            # Backup completo
            if self.backup_type == "full":
                backup_data["configuration"] = self._backup_full_config(connection_manager)
            
            # Backup apenas perfis
            elif self.backup_type == "profiles":
                backup_data["configuration"] = self._backup_profiles(connection_manager)
            
            # Backup apenas interfaces
            elif self.backup_type == "interfaces":
                backup_data["configuration"] = self._backup_interfaces(connection_manager)
            
            else:
                raise ValueError(f"Tipo de backup inválido: {self.backup_type}")
            
            logger.info(f"Backup {self.backup_type} concluído com sucesso")
            
            return {
                "status": "success",
                "message": f"Backup {self.backup_type} realizado com sucesso",
                "backup_data": backup_data,
                "backup_size": len(json.dumps(backup_data)),
                "timestamp": timestamp
            }
            
        except Exception as e:
            error_msg = f"Falha ao realizar backup: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "backup_type": self.backup_type
            }
    
    def _backup_full_config(self, connection_manager) -> Dict[str, Any]:
        """Faz backup completo da configuração."""
        config = {}
        
        # Informações do sistema
        config["system"] = self._get_system_info(connection_manager)
        
        # Perfis
        config["profiles"] = self._backup_profiles(connection_manager)
        
        # Interfaces
        config["interfaces"] = self._backup_interfaces(connection_manager)
        
        # VLANs
        config["vlans"] = self._get_vlans(connection_manager)
        
        # Usuários (sem senhas por segurança)
        if not self.include_passwords:
            config["users"] = self._get_users_safe(connection_manager)
        
        return config
    
    def _backup_profiles(self, connection_manager) -> Dict[str, Any]:
        """Faz backup dos perfis."""
        profiles = {}
        
        # Perfis DBA
        profiles["dba"] = self._get_dba_profiles(connection_manager)
        
        # Perfis de linha ONT
        profiles["ont_line"] = self._get_ont_line_profiles(connection_manager)
        
        # Perfis de serviço ONT
        profiles["ont_service"] = self._get_ont_service_profiles(connection_manager)
        
        return profiles
    
    def _backup_interfaces(self, connection_manager) -> Dict[str, Any]:
        """Faz backup das interfaces."""
        interfaces = {}
        
        # Interfaces GPON
        interfaces["gpon"] = self._get_gpon_interfaces(connection_manager)
        
        # Interfaces Ethernet
        interfaces["ethernet"] = self._get_ethernet_interfaces(connection_manager)
        
        return interfaces
    
    def _get_system_info(self, connection_manager) -> Dict[str, Any]:
        """Obtém informações do sistema."""
        try:
            version_output = connection_manager.send_command("display version")
            uptime_output = connection_manager.send_command("display sysuptime")
            
            return {
                "version": version_output,
                "uptime": uptime_output
            }
        except:
            return {}
    
    def _get_dba_profiles(self, connection_manager) -> List[str]:
        """Obtém perfis DBA."""
        try:
            output = connection_manager.send_command("display dba-profile all")
            return output.splitlines()
        except:
            return []
    
    def _get_ont_line_profiles(self, connection_manager) -> List[str]:
        """Obtém perfis de linha ONT."""
        try:
            output = connection_manager.send_command("display ont-lineprofile gpon all")
            return output.splitlines()
        except:
            return []
    
    def _get_ont_service_profiles(self, connection_manager) -> List[str]:
        """Obtém perfis de serviço ONT."""
        try:
            output = connection_manager.send_command("display ont-srvprofile gpon all")
            return output.splitlines()
        except:
            return []
    
    def _get_gpon_interfaces(self, connection_manager) -> List[str]:
        """Obtém configuração das interfaces GPON."""
        try:
            output = connection_manager.send_command("display current-configuration | include interface.gpon")
            return output.splitlines()
        except:
            return []
    
    def _get_ethernet_interfaces(self, connection_manager) -> List[str]:
        """Obtém configuração das interfaces Ethernet."""
        try:
            output = connection_manager.send_command("display current-configuration | include interface.ethernet")
            return output.splitlines()
        except:
            return []
    
    def _get_vlans(self, connection_manager) -> List[str]:
        """Obtém configuração das VLANs."""
        try:
            output = connection_manager.send_command("display vlan all")
            return output.splitlines()
        except:
            return []
    
    def _get_users_safe(self, connection_manager) -> List[str]:
        """Obtém usuários sem senhas."""
        try:
            output = connection_manager.send_command("display current-configuration | include local-user")
            # Remove linhas com senhas por segurança
            safe_lines = []
            for line in output.splitlines():
                if "password" not in line.lower():
                    safe_lines.append(line)
            return safe_lines
        except:
            return []


class RestoreConfigurationCommand(BaseCommand):
    """
    Restaura configuração da OLT a partir de backup.
    """
    
    def __init__(self, backup_data: Dict[str, Any], restore_type: str = "full"):
        """
        Inicializa comando para restore.
        
        Args:
            backup_data: Dados do backup
            restore_type: Tipo de restore (full, profiles, interfaces)
        """
        self.backup_data = backup_data
        self.restore_type = restore_type
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa restore da configuração.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Resultado do restore
        """
        try:
            logger.info(f"Iniciando restore {self.restore_type} da configuração")
            
            # Validação do backup
            if not self.backup_data or "configuration" not in self.backup_data:
                raise ValueError("Dados de backup inválidos")
            
            restore_results = {}
            
            # Restore completo
            if self.restore_type == "full":
                restore_results = self._restore_full_config(connection_manager)
            
            # Restore apenas perfis
            elif self.restore_type == "profiles":
                restore_results = self._restore_profiles(connection_manager)
            
            # Restore apenas interfaces
            elif self.restore_type == "interfaces":
                restore_results = self._restore_interfaces(connection_manager)
            
            else:
                raise ValueError(f"Tipo de restore inválido: {self.restore_type}")
            
            logger.info(f"Restore {self.restore_type} concluído com sucesso")
            
            return {
                "status": "success",
                "message": f"Restore {self.restore_type} realizado com sucesso",
                "restore_results": restore_results,
                "backup_timestamp": self.backup_data.get("backup_info", {}).get("timestamp")
            }
            
        except Exception as e:
            error_msg = f"Falha ao realizar restore: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "restore_type": self.restore_type
            }
    
    def _restore_full_config(self, connection_manager) -> Dict[str, Any]:
        """Restaura configuração completa."""
        results = {}
        
        # Restaura perfis
        results["profiles"] = self._restore_profiles(connection_manager)
        
        # Restaura interfaces  
        results["interfaces"] = self._restore_interfaces(connection_manager)
        
        return results
    
    def _restore_profiles(self, connection_manager) -> Dict[str, Any]:
        """Restaura perfis."""
        results = {"restored": 0, "errors": 0, "details": []}
        
        config = self.backup_data.get("configuration", {})
        profiles = config.get("profiles", {})
        
        # Restaura cada tipo de perfil
        for profile_type, profile_data in profiles.items():
            try:
                if isinstance(profile_data, list):
                    for profile_config in profile_data:
                        if isinstance(profile_config, str) and profile_config.strip():
                            # Executa comando de configuração
                            connection_manager.send_command("config")
                            output = connection_manager.send_command(profile_config)
                            connection_manager.send_command("quit")
                            
                            if "Error" not in output:
                                results["restored"] += 1
                                results["details"].append(f"Restaurado: {profile_config[:50]}...")
                            else:
                                results["errors"] += 1
                                results["details"].append(f"Erro: {profile_config[:50]}...")
            except Exception as e:
                results["errors"] += 1
                results["details"].append(f"Erro no perfil {profile_type}: {str(e)}")
        
        return results
    
    def _restore_interfaces(self, connection_manager) -> Dict[str, Any]:
        """Restaura interfaces."""
        results = {"restored": 0, "errors": 0, "details": []}
        
        config = self.backup_data.get("configuration", {})
        interfaces = config.get("interfaces", {})
        
        # Restaura cada tipo de interface
        for interface_type, interface_data in interfaces.items():
            try:
                if isinstance(interface_data, list):
                    for interface_config in interface_data:
                        if isinstance(interface_config, str) and interface_config.strip():
                            # Executa comando de configuração
                            connection_manager.send_command("config")
                            output = connection_manager.send_command(interface_config)
                            connection_manager.send_command("quit")
                            
                            if "Error" not in output:
                                results["restored"] += 1
                                results["details"].append(f"Restaurado: {interface_config[:50]}...")
                            else:
                                results["errors"] += 1
                                results["details"].append(f"Erro: {interface_config[:50]}...")
            except Exception as e:
                results["errors"] += 1
                results["details"].append(f"Erro na interface {interface_type}: {str(e)}")
        
        return results
