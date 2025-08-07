"""Authentication schemas for request/response validation."""

import re
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ValidationError, field_serializer, field_validator, ConfigDict

from app.core.security import validate_password_strength
from app.models.common import UserRole

# Phone number regex pattern
PHONE_REGEX = re.compile(r"^\+?[1-9]\d{1,19}$")


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(
        ..., min_length=1, max_length=100, description="User full name"
    )
    organization: str = Field(
        ..., min_length=1, max_length=100, description="User organization"
    )
    phone_number: str = Field(
        ..., min_length=10, max_length=20, description="User phone number"
    )
    password: str = Field(..., min_length=8, description="User password")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength."""
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError("Invalid phone number format")
        return v


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """Schema for user response data."""

    id: UUID
    email: EmailStr
    full_name: str
    organization: str
    phone_number: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""

    email: EmailStr = Field(..., description="User email address")


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength."""
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v


class MessageResponse(BaseModel):
    """Schema for simple message responses."""

    message: str = Field(..., description="Response message")
