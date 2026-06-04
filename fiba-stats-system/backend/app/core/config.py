# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings # importo BaseSettings para crear la configuracion
from typing import List

class Settings(BaseSettings): # Clase que hereda de BaseSettings para crear la configuracion
    HOST: str = "127.0.0.1" # Host del servidor
    PORT: int = 8000 # Puerto del servidor
    DEBUG: bool = False # Debug mode disabled by default for performance
    DATABASE_URL: str = "sqlite:///./fiba_stats.db" # Si no hay variable env, usa local
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION" # Clave secreta para la encriptacion de datos
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "change_me_in_production"
    ALLOWED_ORIGINS: str = "*" # Comma-separated list for CORS

    class Config: # Clase que hereda de BaseSettings para crear la configuracion
        env_file = ".env"  # Archivo de configuracion

settings = Settings() # Instancia de la clase Settings
