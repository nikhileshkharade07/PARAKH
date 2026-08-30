from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "PARAKH"
    app_env: str = "development"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://parakh:parakh@localhost:5432/parakh"
    cors_origins: list[str] = ["http://localhost:5173"]
    approval_threshold: float = 5_000_000
    price_deviation_threshold: float = 0.30
    nlp_similarity_threshold: float = 0.85
    tender_duration_threshold_days: int = 7
    vendor_lockin_threshold: float = 0.60
    unusual_extension_days: int = 90
    risk_threshold: int = 70
    blockchain_enabled: bool = False
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
