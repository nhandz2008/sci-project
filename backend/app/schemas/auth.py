"""Authentication schemas for request/response validation."""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from app.core.exceptions import ValidationError
from app.models.common import UserRole

PHONE_REGEX = re.compile(r"^\+?\d{10,20}$")


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

    @validator("password")
    def validate_password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValidationError(
                message="Password must be at least 8 characters long",
                error_code="VAL_101",
                details="Password too short",
            )
        if not any(c.isupper() for c in v):
            raise ValidationError(
                message="Password must contain at least one uppercase letter",
                error_code="VAL_102",
                details="Missing uppercase letter",
            )
        if not any(c.islower() for c in v):
            raise ValidationError(
                message="Password must contain at least one lowercase letter",
                error_code="VAL_103",
                details="Missing lowercase letter",
            )
        if not any(c.isdigit() for c in v):
            raise ValidationError(
                message="Password must contain at least one digit",
                error_code="VAL_104",
                details="Missing digit",
            )
        return v

    @validator("phone_number")
    def validate_phone_number(cls, v):
        if not PHONE_REGEX.match(v):
            raise ValidationError(
                message="Invalid phone number format",
                error_code="VAL_105",
                details="Phone number must be 10-20 digits, may start with +",
            )
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

    class Config:
        from_attributes = True


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

    @validator("new_password")
    def validate_password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValidationError(
                message="Password must be at least 8 characters long",
                error_code="VAL_101",
                details="Password too short",
            )
        if not any(c.isupper() for c in v):
            raise ValidationError(
                message="Password must contain at least one uppercase letter",
                error_code="VAL_102",
                details="Missing uppercase letter",
            )
        if not any(c.islower() for c in v):
            raise ValidationError(
                message="Password must contain at least one lowercase letter",
                error_code="VAL_103",
                details="Missing lowercase letter",
            )
        if not any(c.isdigit() for c in v):
            raise ValidationError(
                message="Password must contain at least one digit",
                error_code="VAL_104",
                details="Missing digit",
            )
        return v


class MessageResponse(BaseModel):
    """Schema for simple message responses."""

    message: str = Field(..., description="Response message")
