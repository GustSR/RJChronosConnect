from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_USER: str = "user"
    RABBITMQ_PASS: str = "password"
    REDIS_HOST: str = "redis"
    REDIS_PASS: str = "password"
    
    # URLs dos microserviços para o Orquestrador chamar
    OLT_MANAGER_HUAWEI_URL: str = "http://olt-manager-huawei:8000"
    BACKEND_API_URL: str = "http://backend-api:8000"

    class Config:
        env_file = ".env"

settings = Settings()
