import uuid
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import User


# Shared properties
class CompetitionBase(SQLModel):
    """Base class for competition models."""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Database model
class Competition(CompetitionBase, table=True):
    """Database model for competition"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
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


# Properties to return via API, id is always required
class CompetitionPublic(CompetitionBase):
    """API output for competition details"""
    id: uuid.UUID
    owner_id: uuid.UUID

class CompetitionsPublic(SQLModel):
    """API output for list of competitions"""
    data: list[CompetitionPublic]
    count: int
