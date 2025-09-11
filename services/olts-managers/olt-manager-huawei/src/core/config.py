from pydantic import BaseSettings

class Settings(BaseSettings):
    backend_api_url: str = "http://backend-api:8000"
    trap_listener_host: str = "0.0.0.0"
    trap_listener_port: int = 162
    snmp_community: str = "public"
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    netmiko_session_log: bool = False
    
    # Configurações do Connection Pool SSH
    ssh_pool_max_size: int = 3
    ssh_pool_idle_timeout: int = 300  # 5 minutos
    ssh_pool_connection_timeout: int = 30  # 30 segundos

    class Config:
        env_file = ".env"

settings = Settings()
