# -*- coding: utf-8 -*-
"""
Comando para obter configuração atual completa da OLT.
"""

from typing import Dict, Any, List, Optional
from .base_command import BaseCommand
from ..core.logging import get_logger

logger = get_logger(__name__)

class GetCurrentConfigurationCliCommand(BaseCommand):
    """
    Obtém a configuração atual completa da OLT.
    """
    
    def __init__(self, section: Optional[str] = None, save_to_file: bool = False):
        """
        Inicializa comando para obter configuração.
        
        Args:
            section: Seção específica (opcional) - ex: "interface", "ont-lineprofile", "dba-profile"
            save_to_file: Se deve salvar em arquivo (para backup)
        """
        self.section = section
        self.save_to_file = save_to_file
        
    def execute(self, connection_manager, olt_version: str = None) -> Dict[str, Any]:
        """
        Executa obtenção da configuração atual.
        
        Args:
            connection_manager: Gerenciador de conexão SSH
            olt_version: Versão da OLT (opcional)
            
        Returns:
            Configuração atual estruturada
        """
        try:
            logger.info(f"Obtendo configuração atual da OLT" + 
                       (f" - seção: {self.section}" if self.section else " - completa"))
            
            # Comando base
            if self.section:
                command = f"display current-configuration | include {self.section}"
            else:
                command = "display current-configuration"
            
            # Executa comando
            logger.debug(f"Executando comando: {command}")
            raw_output = connection_manager.send_command(command, timeout=60)  # Timeout maior para config completa
            
            if not raw_output or "Error" in raw_output:
                raise Exception(f"Falha ao obter configuração: {raw_output}")
            
            # Processa a saída
            config_data = self._parse_configuration(raw_output)
            
            logger.info(f"Configuração obtida com sucesso - {len(config_data.get('sections', []))} seções encontradas")
            
            result = {
                "status": "success",
                "message": "Configuração atual obtida com sucesso",
                "section_filter": self.section,
                "total_lines": len(raw_output.splitlines()),
                "configuration": config_data,
                "summary": self._generate_summary(config_data)
            }
            
            # Se solicitado, inclui configuração raw para backup
            if self.save_to_file:
                result["raw_configuration"] = raw_output
                
            return result
            
        except Exception as e:
            error_msg = f"Falha ao obter configuração atual: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "section_filter": self.section
            }
    
    def _parse_configuration(self, raw_output: str) -> Dict[str, Any]:
        """
        Processa a saída da configuração em estrutura organizada.
        
        Args:
            raw_output: Saída bruta do comando
            
        Returns:
            Configuração estruturada por seções
        """
        lines = raw_output.splitlines()
        config_data = {
            "version": "",
            "sysname": "",
            "sections": [],
            "profiles": {
                "dba_profiles": [],
                "ont_line_profiles": [],
                "ont_srv_profiles": [],
                "gpon_alarm_profiles": []
            },
            "interfaces": {
                "gpon": [],
                "ethernet": [],
                "vlanif": []
            },
            "vlans": [],
            "users": [],
            "other_config": []
        }
        
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
                
            # Identifica informações básicas
            if line.startswith('version '):
                config_data["version"] = line.replace('version ', '')
            elif line.startswith('sysname '):
                config_data["sysname"] = line.replace('sysname ', '')
            
            # Identifica perfis DBA
            elif line.startswith('dba-profile add'):
                profile_info = self._parse_dba_profile(line)
                if profile_info:
                    config_data["profiles"]["dba_profiles"].append(profile_info)
            
            # Identifica perfis de linha ONT
            elif line.startswith('ont-lineprofile gpon'):
                profile_info = self._parse_ont_line_profile(line)
                if profile_info:
                    config_data["profiles"]["ont_line_profiles"].append(profile_info)
            
            # Identifica perfis de serviço ONT
            elif line.startswith('ont-srvprofile gpon'):
                profile_info = self._parse_ont_srv_profile(line)
                if profile_info:
                    config_data["profiles"]["ont_srv_profiles"].append(profile_info)
            
            # Identifica interfaces
            elif line.startswith('interface '):
                if current_section:
                    config_data["sections"].append({
                        "type": current_section,
                        "content": current_content
                    })
                
                current_section = line
                current_content = [line]
                
                # Categoriza interface
                if 'gpon' in line:
                    config_data["interfaces"]["gpon"].append(line)
                elif 'ethernet' in line or 'gigabitethernet' in line:
                    config_data["interfaces"]["ethernet"].append(line)
                elif 'vlanif' in line:
                    config_data["interfaces"]["vlanif"].append(line)
            
            # Identifica VLANs
            elif line.startswith('vlan ') and ' smart' in line:
                vlan_info = self._parse_vlan(line)
                if vlan_info:
                    config_data["vlans"].append(vlan_info)
            
            # Identifica usuários
            elif 'local-user' in line and 'password' in line:
                user_info = self._parse_user(line)
                if user_info:
                    config_data["users"].append(user_info)
            
            else:
                # Conteúdo de seção atual ou configuração geral
                if current_section:
                    current_content.append(line)
                else:
                    config_data["other_config"].append(line)
        
        # Adiciona última seção se existir
        if current_section:
            config_data["sections"].append({
                "type": current_section,
                "content": current_content
            })
        
        return config_data
    
    def _parse_dba_profile(self, line: str) -> Optional[Dict[str, Any]]:
        """Extrai informações do perfil DBA."""
        try:
            # Exemplo: dba-profile add profile-id 10 profile-name fttd_dba type3 assure 8192 max 20480
            parts = line.split()
            profile = {}
            
            for i, part in enumerate(parts):
                if part == "profile-id" and i + 1 < len(parts):
                    profile["profile_id"] = parts[i + 1]
                elif part == "profile-name" and i + 1 < len(parts):
                    profile["profile_name"] = parts[i + 1]
                elif part.startswith("type") and part[4:].isdigit():
                    profile["type"] = part
                elif part == "assure" and i + 1 < len(parts):
                    profile["assure_bandwidth"] = int(parts[i + 1])
                elif part == "max" and i + 1 < len(parts):
                    profile["max_bandwidth"] = int(parts[i + 1])
            
            return profile if profile else None
        except:
            return None
    
    def _parse_ont_line_profile(self, line: str) -> Optional[Dict[str, Any]]:
        """Extrai informações do perfil de linha ONT."""
        try:
            # Exemplo: ont-lineprofile gpon profile-id 1 profile-name ont_profile
            parts = line.split()
            profile = {}
            
            for i, part in enumerate(parts):
                if part == "profile-id" and i + 1 < len(parts):
                    profile["profile_id"] = parts[i + 1]
                elif part == "profile-name" and i + 1 < len(parts):
                    profile["profile_name"] = parts[i + 1]
            
            return profile if profile else None
        except:
            return None
    
    def _parse_ont_srv_profile(self, line: str) -> Optional[Dict[str, Any]]:
        """Extrai informações do perfil de serviço ONT."""
        try:
            # Exemplo: ont-srvprofile gpon profile-id 1 profile-name srv_profile
            parts = line.split()
            profile = {}
            
            for i, part in enumerate(parts):
                if part == "profile-id" and i + 1 < len(parts):
                    profile["profile_id"] = parts[i + 1]
                elif part == "profile-name" and i + 1 < len(parts):
                    profile["profile_name"] = parts[i + 1]
            
            return profile if profile else None
        except:
            return None
    
    def _parse_vlan(self, line: str) -> Optional[Dict[str, Any]]:
        """Extrai informações da VLAN."""
        try:
            # Exemplo: vlan 100 smart
            parts = line.split()
            if len(parts) >= 2:
                return {
                    "vlan_id": int(parts[1]),
                    "type": parts[2] if len(parts) > 2 else "standard"
                }
        except:
            return None
        return None
    
    def _parse_user(self, line: str) -> Optional[Dict[str, Any]]:
        """Extrai informações do usuário."""
        try:
            # Exemplo: local-user admin password cipher *** service-type ssh
            if 'local-user' in line:
                parts = line.split()
                user = {}
                
                for i, part in enumerate(parts):
                    if part == "local-user" and i + 1 < len(parts):
                        user["username"] = parts[i + 1]
                    elif part == "service-type" and i + 1 < len(parts):
                        user["service_type"] = parts[i + 1]
                
                return user if user else None
        except:
            return None
        return None
    
    def _generate_summary(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Gera resumo da configuração."""
        return {
            "system_info": {
                "version": config_data["version"],
                "sysname": config_data["sysname"]
            },
            "profiles_count": {
                "dba_profiles": len(config_data["profiles"]["dba_profiles"]),
                "ont_line_profiles": len(config_data["profiles"]["ont_line_profiles"]),
                "ont_srv_profiles": len(config_data["profiles"]["ont_srv_profiles"])
            },
            "interfaces_count": {
                "gpon": len(config_data["interfaces"]["gpon"]),
                "ethernet": len(config_data["interfaces"]["ethernet"]),
                "vlanif": len(config_data["interfaces"]["vlanif"])
            },
            "vlans_count": len(config_data["vlans"]),
            "users_count": len(config_data["users"]),
            "total_sections": len(config_data["sections"])
        }