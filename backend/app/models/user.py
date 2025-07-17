import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum

from app.models.competition import Competition


# Shared properties
class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    CREATOR = "creator"

class UserBase(SQLModel):
    """Base class for user models."""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.CREATOR)


# Database model
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    competitions: list["Competition"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to receive via API request
class UserCreate(UserBase):
    """API input for user to create new account: UserBase + password"""
    password: str = Field(min_length=8, max_length=40)

class UserUpdate(UserBase):
    """API input for updating user details = UserBase + password"""
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    full_name: str | None = Field(default=None, max_length=255)

class UpdatePassword(SQLModel):
    """API input for user to update password"""
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    """API output for user details"""
    id: uuid.UUID

class UsersPublic(SQLModel):
    """API output for list of users"""
    data: list[UserPublic]
    count: int
