from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator
import json

class Settings(BaseSettings):
    app_name: str = "PARAKH"
    app_env: str = "development"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./parakh.db"
    cors_origins: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    approval_threshold: float = 5_000_000
    price_deviation_threshold: float = 0.30
    nlp_similarity_threshold: float = 0.85
    tender_duration_threshold_days: int = 7
    vendor_lockin_threshold: float = 0.60
    unusual_extension_days: int = 90
    risk_threshold: int = 70
    
    # Auth & Security
    jwt_secret: str = "parakh-super-secure-dev-secret-key-2026"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    
    # Blockchain
    blockchain_enabled: bool = False
    sepolia_rpc_url: str = ""
    blockchain_private_key: str = ""
    blockchain_contract_address: str = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

