from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    

class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100, description="User password (min 8 characters)")
    role: UserRole = Field(default=UserRole.CREATOR, description="User role in the system")
    is_active: bool = Field(default=True, description="Whether the user account is active")


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = Field(None, description="New email address")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="New username")
    password: Optional[str] = Field(None, min_length=8, max_length=100, description="New password")
    role: Optional[UserRole] = Field(None, description="New user role")
    is_active: Optional[bool] = Field(None, description="Account active status")


class UserResponse(UserBase):
    """Schema for user data in API responses."""
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login requests."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserProfile(UserResponse):
    """Extended user schema for profile information."""
    # Can be extended with additional profile fields later
    pass


# Authentication response schemas
class Token(BaseModel):
    """JWT token response schema."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class TokenData(BaseModel):
    """Schema for JWT token payload data."""
    email: Optional[str] = None


class UserLoginResponse(BaseModel):
    """Complete login response with user data and token."""
    user: UserResponse
    token: Token


# Admin-specific schemas
class UserListResponse(BaseModel):
    """Response schema for paginated user lists."""
    users: list[UserResponse]
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages") 