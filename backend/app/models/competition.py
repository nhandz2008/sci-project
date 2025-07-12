from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship, Text
from enum import Enum


class CompetitionScale(str, Enum):
    """Competition scale/level."""
    LOCAL = "local"
    REGIONAL = "regional"
    NATIONAL = "national"
    INTERNATIONAL = "international"


class Competition(SQLModel, table=True):
    """
    Competition model for science and technology competitions.
    
    This model stores all information about competitions including
    details, dates, eligibility, and prizes.
    """
    __tablename__ = "competitions"
    
    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Basic info
    title: str = Field(max_length=200, index=True)
    description: str = Field(sa_type=Text)
    location: str = Field(max_length=200, index=True)
    scale: CompetitionScale = Field(index=True)
    
    # Dates
    start_date: date
    end_date: date
    registration_deadline: date
    
    # Additional info
    prize_structure: Optional[str] = Field(default=None, sa_type=Text)
    eligibility_criteria: Optional[str] = Field(default=None, sa_type=Text)
    
    # Media and links
    image_url: Optional[str] = Field(default=None, max_length=500)
    external_url: Optional[str] = Field(default=None, max_length=500)
    
    # Features for AI recommendations
    target_age_min: Optional[int] = Field(default=None, ge=5, le=25)
    target_age_max: Optional[int] = Field(default=None, ge=5, le=25)
    required_grade_min: Optional[int] = Field(default=None, ge=1, le=12)
    required_grade_max: Optional[int] = Field(default=None, ge=1, le=12)
    subject_areas: Optional[str] = Field(default=None, max_length=500)  # Comma-separated
    
    # Status
    is_featured: bool = Field(default=False, index=True)
    featured_priority: int = Field(default=0, ge=0, le=100, description="Priority for featuring (higher = more featured)")
    is_active: bool = Field(default=True, index=True)
    
    # Relationships
    created_by: int = Field(foreign_key="users.id", index=True)
    creator: "User" = Relationship(back_populates="competitions")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    class Config:
        """Pydantic configuration."""
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        } 