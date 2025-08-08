"""User schemas for request/response validation."""

import re
from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_serializer,
    field_validator,
)

from app.models.common import UserRole

# Phone number regex pattern
PHONE_REGEX = re.compile(r"^\+?[1-9]\d{1,19}$")


class UserUpdate(BaseModel):
    """Schema for user profile updates."""

    full_name: str | None = Field(
        None, min_length=1, max_length=100, description="User full name"
    )
    organization: str | None = Field(
        None, min_length=1, max_length=100, description="User organization"
    )
    phone_number: str | None = Field(
        None, min_length=10, max_length=20, description="User phone number"
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name_not_empty(cls, v: str | None) -> str | None:
        """Validate full name is not empty if provided."""
        if v is not None and not v.strip():
            raise ValueError("Full name cannot be empty")
        return v

    @field_validator("organization")
    @classmethod
    def validate_organization_not_empty(cls, v: str | None) -> str | None:
        """Validate organization is not empty if provided."""
        if v is not None and not v.strip():
            raise ValueError("Organization cannot be empty")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str | None) -> str | None:
        """Validate phone number format if provided."""
        if v is not None:
            if not v.strip():
                raise ValueError("Phone number cannot be empty")
            if not PHONE_REGEX.match(v):
                raise ValueError("Invalid phone number format")
        return v


class PasswordChange(BaseModel):
    """Schema for password change."""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserListResponse(BaseModel):
    """Schema for user list response."""

    id: UUID
    email: EmailStr
    full_name: str
    organization: str
    role: UserRole
    is_active: bool
    created_at: datetime

    @field_serializer("id")
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class UserDetailResponse(BaseModel):
    """Schema for detailed user response."""

    id: UUID
    email: EmailStr
    full_name: str
    organization: str
    phone_number: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None

    @field_serializer("id")
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class UserListPaginatedResponse(BaseModel):
    """Schema for paginated user list response."""

    users: list[UserListResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    skip: int = Field(..., description="Number of users skipped")
    limit: int = Field(..., description="Number of users returned")


class UserFilterParams(BaseModel):
    """Schema for user filtering parameters."""

    skip: int = Field(default=0, ge=0, description="Number of users to skip")
    limit: int = Field(
        default=100, ge=1, le=1000, description="Number of users to return"
    )
    role: UserRole | None = Field(None, description="Filter by user role")
    is_active: bool | None = Field(None, description="Filter by active status")
    search: str | None = Field(None, description="Search by name or email")
