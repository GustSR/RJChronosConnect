import json
from typing import Dict, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    backend_api_url: str = "http://backend-api:8000"
    trap_listener_host: str = "0.0.0.0"
    trap_listener_port: int = 162
    snmp_community: str = "1wAdehYft0c["
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = Field("guest", validation_alias="RABBITMQ_DEFAULT_USER")
    rabbitmq_password: str = Field("guest", validation_alias="RABBITMQ_DEFAULT_PASS")
    netmiko_session_log: bool = False

    # Configurações do Connection Pool SSH
    ssh_pool_max_size: int = 3
    ssh_pool_idle_timeout: int = 300  # 5 minutos
    ssh_pool_connection_timeout: int = 30  # 30 segundos

    # Configurações de OLT para testes/desenvolvimento
    test_olt_ip: Optional[str] = None  # IP da OLT para testes
    test_olt_model: str = "MA5600T"  # Modelo da OLT para testes

    # Mapeamento IP -> Modelo (JSON string via env)
    # Exemplo: OLT_IP_MODEL_MAPPING='{"192.168.1.1": "MA5600T", "192.168.1.2": "MA5800"}'
    olt_ip_model_mapping: str = "{}"

    # Configurações de OLT padrão para testes
    default_olt_model: str = "MA5600T"

    model_config = SettingsConfigDict(
        # Para microsserviço de prateleira, variáveis vêm do docker-compose
        # Não usa .env próprio - tudo orquestrado pelo projeto pai
        env_file=None
    )

    @property
    def ip_to_model_dict(self) -> Dict[str, str]:
        """Converte string JSON do mapeamento IP->modelo para dict."""
        try:
            mapping = json.loads(self.olt_ip_model_mapping)

            # Se test_olt_ip está configurado, adiciona ao mapeamento
            if self.test_olt_ip:
                mapping[self.test_olt_ip] = self.test_olt_model

            return mapping
        except json.JSONDecodeError:
            # Se JSON inválido, retorna apenas OLT de teste se configurada
            if self.test_olt_ip:
                return {self.test_olt_ip: self.test_olt_model}
            return {}


settings = Settings()
