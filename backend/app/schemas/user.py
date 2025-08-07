"""User management schemas for request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from app.models.common import UserRole


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

    @validator("full_name", "organization", "phone_number")
    def validate_not_empty(cls, v):
        """Validate that fields are not empty strings."""
        if v is not None and v.strip() == "":
            raise ValueError("Field cannot be empty")
        return v


class PasswordChange(BaseModel):
    """Schema for password change."""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @validator("new_password")
    def validate_password_strength(cls, v):
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
