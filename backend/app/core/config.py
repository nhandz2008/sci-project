import secrets
import warnings
from typing import Literal

from pydantic import (
    EmailStr,
    Field,
    PostgresDsn,
    field_validator,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False,
    )

    # =============================================================================
    # API Configuration
    # =============================================================================
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Science Competitions Insight"
    ENVIRONMENT: Literal["local", "development", "staging", "production"] = "local"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # =============================================================================
    # Security
    # =============================================================================
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, gt=0)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, gt=0)

    # =============================================================================
    # CORS & Frontend
    # =============================================================================
    FRONTEND_HOST: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"
    CORS_ALLOW_CREDENTIALS: bool = True

    @property
    def all_cors_origins(self) -> list[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
        ]

        frontend_clean = self.FRONTEND_HOST.rstrip("/")
        if frontend_clean not in origins:
            origins.append(frontend_clean)

        return origins

    # =============================================================================
    # Database
    # =============================================================================
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = Field(default=5432, ge=1, le=65535)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = Field(min_length=1)
    POSTGRES_DB: str = "sci_db"

    DATABASE_POOL_SIZE: int = Field(default=5, gt=0)
    DATABASE_MAX_OVERFLOW: int = Field(default=10, ge=0)
    TEST_POSTGRES_DB: str | None = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @property
    def TEST_SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn | None:
        if not self.TEST_POSTGRES_DB:
            return None
        return MultiHostUrl.build(
            scheme="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.TEST_POSTGRES_DB,
        )

    # =============================================================================
    # AWS S3 Configuration
    # =============================================================================
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str | None = None

    # File upload settings
    MAX_FILE_SIZE_MB: int = Field(default=10, gt=0)
    ALLOWED_FILE_TYPES: str = "jpg,jpeg,png,pdf,doc,docx"

    @property
    def S3_BUCKET_URL(self) -> str | None:
        if not self.S3_BUCKET_NAME:
            return None
        return f"https://{self.S3_BUCKET_NAME}.s3.{self.AWS_REGION}.amazonaws.com"

    @property
    def allowed_file_types_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_FILE_TYPES.split(",")]

    # =============================================================================
    # LLM API Configuration
    # =============================================================================
    LLM_API_KEY: str | None = None
    LLM_API_URL: str = "https://api.openai.com/v1/chat/completions"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_MAX_TOKENS: int = Field(default=1000, gt=0, le=4096)
    LLM_TEMPERATURE: float = Field(default=0.7, ge=0.0, le=2.0)

    # =============================================================================
    # Admin User
    # =============================================================================
    FIRST_SUPERUSER: EmailStr = "admin@sci.com"
    FIRST_SUPERUSER_PASSWORD: str = Field(min_length=8)

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value in (
            "changethis",
            "your-llm-api-key",
            "generate-with-openssl-rand-hex-32",
        ):
            message = (
                f"The value of {var_name} is a placeholder value, "
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    def _check_production_requirements(self) -> None:
        """Check that production environment has all required settings."""
        if self.ENVIRONMENT == "production":
            required_fields = []

            if not self.AWS_ACCESS_KEY_ID:
                required_fields.append("AWS_ACCESS_KEY_ID")
            if not self.AWS_SECRET_ACCESS_KEY:
                required_fields.append("AWS_SECRET_ACCESS_KEY")
            if not self.S3_BUCKET_NAME:
                required_fields.append("S3_BUCKET_NAME")
            if not self.LLM_API_KEY:
                required_fields.append("LLM_API_KEY")

            if required_fields:
                raise ValueError(
                    f"Missing required production settings: {', '.join(required_fields)}"
                )

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        # Check for placeholder values
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )
        self._check_default_secret("AWS_ACCESS_KEY_ID", self.AWS_ACCESS_KEY_ID)
        self._check_default_secret("AWS_SECRET_ACCESS_KEY", self.AWS_SECRET_ACCESS_KEY)
        self._check_default_secret("S3_BUCKET_NAME", self.S3_BUCKET_NAME)
        self._check_default_secret("LLM_API_KEY", self.LLM_API_KEY)

        # Check production requirements
        self._check_production_requirements()

        return self

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def generate_secret_key_if_needed(cls, v):
        """Generate a secret key if not provided or if placeholder."""
        if not v or v == "generate-with-openssl-rand-hex-32":
            return secrets.token_urlsafe(32)
        return v


settings = Settings()
