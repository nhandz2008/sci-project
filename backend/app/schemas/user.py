"""User management schemas for request/response validation."""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from app.core.exceptions import ValidationError
from app.models.common import UserRole

PHONE_REGEX = re.compile(r"^\+?\d{10,20}$")


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

    @validator("full_name")
    def validate_full_name_not_empty(cls, v):
        if v is not None and v.strip() == "":
            raise ValidationError(
                message="Full name cannot be empty",
                error_code="VAL_201",
                details="full_name is empty",
            )
        return v

    @validator("organization")
    def validate_organization_not_empty(cls, v):
        if v is not None and v.strip() == "":
            raise ValidationError(
                message="Organization cannot be empty",
                error_code="VAL_201",
                details="organization is empty",
            )
        return v

    @validator("phone_number")
    def validate_phone_number(cls, v):
        if v is not None and v.strip() == "":
            raise ValidationError(
                message="Phone number cannot be empty",
                error_code="VAL_201",
                details="phone_number is empty",
            )
        if v is not None and not PHONE_REGEX.match(v):
            raise ValidationError(
                message="Invalid phone number format",
                error_code="VAL_202",
                details="Phone number must be 10-20 digits, may start with +",
            )
        return v


class PasswordChange(BaseModel):
    """Schema for password change."""

    current_password: str = Field(..., description="Current password")
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


class UserListResponse(BaseModel):
    """Schema for user list response."""

    id: UUID
    email: EmailStr
    full_name: str
    organization: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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
