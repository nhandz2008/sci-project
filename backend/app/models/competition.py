import uuid
from enum import Enum
import datetime
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import User


# Shared properties
class CompetitionFormat(str, Enum):
    """Format of competition"""
    ONLINE = "online"
    OFFLINE = "offline"
    HYBRID = "hybrid"

class CompetitionScale(str, Enum):
    """Scale of competition"""
    PROVINCIAL = "provincial"
    REGIONAL = "regional"
    INTERNATIONAL = "international"

class CompetitionBase(SQLModel):
    """Base class for competition models."""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    competition_link: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    format: CompetitionFormat | None = Field(default=None)
    scale: CompetitionScale | None = Field(default=None)
    registration_deadline: datetime.datetime | None = Field(default=None)
    target_age_min: int | None = Field(default=None, ge=0)
    target_age_max: int | None = Field(default=None, ge=0)
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)


# Database model
class Competition(CompetitionBase, table=True):
    """Database model for competition"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: User | None = Relationship(back_populates="competitions")


# Properties to receive via API request
class CompetitionCreate(CompetitionBase):
    """API input for competition to create new competition"""
    pass

class CompetitionUpdate(CompetitionBase):
    """API input for competition to update competition"""
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    description: str | None = Field(default=None, max_length=255)
    competition_link: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    format: CompetitionFormat | None = Field(default=None)
    scale: CompetitionScale | None = Field(default=None)
    registration_deadline: datetime.datetime | None = Field(default=None)
    target_age_min: int | None = Field(default=None, ge=0)
    target_age_max: int | None = Field(default=None, ge=0)
    is_active: bool | None = Field(default=None)


# Properties to return via API, id is always required
class CompetitionPublic(CompetitionBase):
    """API output for competition details"""
    id: uuid.UUID
    owner_id: uuid.UUID

class CompetitionsPublic(SQLModel):
    """API output for list of competitions"""
    data: list[CompetitionPublic]
    count: int
