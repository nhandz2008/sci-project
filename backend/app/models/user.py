from typing import List
from pydantic import EmailStr
from sqlmodel import Field, Relationship

from app.models.common import BaseModel, UserRole


class User(BaseModel, table=True):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    email: EmailStr = Field(unique=True, index=True)
    full_name: str = Field(min_length=1, max_length=100)
    organization: str = Field(min_length=1, max_length=100)
    phone_number: str = Field(min_length=10, max_length=20)
    role: UserRole = Field(default=UserRole.CREATOR)
    hashed_password: str = Field(min_length=1)
    is_active: bool = True
    
    # Relationships
    competitions: List["Competition"] = Relationship(back_populates="owner")
    
    class Config:
        from_attributes = True 