from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Optional, List, Union
import secrets


class Settings(BaseSettings):
    """
    Application settings using Pydantic BaseSettings.
    
    This allows us to:
    - Load settings from environment variables
    - Validate configuration values
    - Provide sensible defaults
    - Type check our configuration
    """
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Science Competitions Insight"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def all_cors_origins(self) -> List[str]:
        """Parse CORS origins from string to list."""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
        return self.BACKEND_CORS_ORIGINS
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sci_db"
    POSTGRES_PORT: str = "5432"
    
    DATABASE_URL: Optional[str] = None
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod  
    def assemble_db_connection(cls, v, info):
        """Build database URL from components."""
        if isinstance(v, str) and v:
            return v
        
        # Get values from the validation context
        if hasattr(info, 'data') and info.data:
            values = info.data
            
            # Build PostgreSQL URL from components
            user = values.get("POSTGRES_USER", "postgres")
            password = values.get("POSTGRES_PASSWORD", "postgres")
            host = values.get("POSTGRES_SERVER", "localhost")
            port = values.get("POSTGRES_PORT", "5432")
            db = values.get("POSTGRES_DB", "sci_db")
            
            return f"postgresql://{user}:{password}@{host}:{port}/{db}"
        
        # Default fallback
        return "postgresql://postgres:postgres@localhost:5432/sci_db"
    
    # Admin user (will be created automatically)
    FIRST_SUPERUSER_EMAIL: str = "admin@sci.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    
    # AI Service Configuration (for recommendations)
    OPENAI_API_KEY: Optional[str] = None
    
    class Config:
        """Pydantic configuration."""
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create a global settings instance
settings = Settings() 