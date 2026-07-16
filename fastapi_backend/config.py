import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # GitHub OAuth Settings
    github_client_id: str = os.getenv("GITHUB_CLIENT_ID", "")
    github_client_secret: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    
    # Security Configuration
    # A secure secret key for signing session cookies
    fastapi_secret_key: str = os.getenv("FASTAPI_SECRET_KEY", "super-secret-session-key-change-in-production")
    
    # 32-byte url-safe base64 key for symmetric token encryption (using Fernet)
    # Generate one using: cryptography.fernet.Fernet.generate_key().decode()
    encryption_key: str = os.getenv("ENCRYPTION_KEY", "y3G_0j-YV6kH9Kj-b7D4B6tBqXF5gE_2Z8J9xP5M3X0=")
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./fastapi_oauth.db")
    
    # App base URL (for building correct OAuth Redirect URIs)
    app_url: Optional[str] = os.getenv("APP_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Instantiate settings
settings = Settings()
