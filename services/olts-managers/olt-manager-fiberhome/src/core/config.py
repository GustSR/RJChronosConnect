from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    backend_api_url: str = "http://backend-api:8000"
    snmp_community: str = "public"
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = Field("guest", validation_alias="RABBITMQ_DEFAULT_USER")
    rabbitmq_password: str = Field("guest", validation_alias="RABBITMQ_DEFAULT_PASS")

    ssh_pool_max_size: int = 3
    ssh_pool_idle_timeout: int = 300
    ssh_pool_connection_timeout: int = 30

    model_config = SettingsConfigDict(env_file=None)


settings = Settings()
