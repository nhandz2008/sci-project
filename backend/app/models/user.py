from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    CREATOR = "creator"


class User(SQLModel, table=True):
    """
    User model for authentication and user management.
    
    This model handles both content creators and admins who can manage competitions.
    Regular users browsing competitions don't need accounts.
    """
    __tablename__ = "users"
    
    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Authentication fields
    email: str = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=100)
    hashed_password: str = Field(max_length=255)
    
    # User info
    role: UserRole = Field(default=UserRole.CREATOR)
    is_active: bool = Field(default=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    competitions: list["Competition"] = Relationship(back_populates="creator")
    
    class Config:
        """Pydantic configuration."""
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 