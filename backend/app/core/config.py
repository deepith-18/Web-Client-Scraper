import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "ProspectIQ"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "prospectiq-development-super-secret-key-32charsmin!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database config: Defaults to local SQLite for instant setup, override with Postgres URL
    DATABASE_URL: str = "sqlite:///./prospectiq.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Scraping & Verification limits
    REQUEST_TIMEOUT_SECONDS: int = 15
    MAX_REDIRECTS: int = 5
    USER_AGENT: str = "ProspectIQ-BusinessAuditor/1.0 (+https://prospectiq.example.com/bot-info)"
    
    # External APIs (Optional - fallback to open sources)
    GOOGLE_PLACES_API_KEY: str = ""
    GOOGLE_PAGESPEED_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

