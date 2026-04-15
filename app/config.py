from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/omini"
    database_url_sync: str = "postgresql://user:password@localhost:5432/omini"
    cors_origins: str = "http://localhost:3000"
    max_stops: int = 500
    min_stops: int = 2
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
