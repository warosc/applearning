import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/excoba"
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "simulador-dev-secret")
    jwt_algorithm: str = "HS256"
    access_token_expire_hours: int = 8
    cors_origin: str = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    app_name: str = "Escobita Simulator Platform"
    app_version: str = "2.0.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
