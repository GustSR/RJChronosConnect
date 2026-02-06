from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # RabbitMQ
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_USER: str = Field("user", validation_alias="RABBITMQ_DEFAULT_USER")
    RABBITMQ_PASS: str = Field("password", validation_alias="RABBITMQ_DEFAULT_PASS")
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PASS: str = Field("password", validation_alias="REDIS_PASSWORD")
    
    # URLs dos microserviços para o Orquestrador chamar
    OLT_MANAGER_HUAWEI_URL: str = "http://olt-manager-huawei:8001"
    BACKEND_API_URL: str = "http://backend:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
