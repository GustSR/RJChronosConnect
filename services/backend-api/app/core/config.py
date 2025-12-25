from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    OLT_MANAGER_URL: str = "http://olt-manager-huawei:8000"

    class Config:
        env_file = ".env"

settings = Settings()
