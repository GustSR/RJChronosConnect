from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str
    OLT_MANAGER_URL: str = "http://olt-manager-huawei:8000"
    
    # RabbitMQ
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = Field("user", validation_alias="RABBITMQ_DEFAULT_USER")
    RABBITMQ_PASS: str = Field("password", validation_alias="RABBITMQ_DEFAULT_PASS")
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "password"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
