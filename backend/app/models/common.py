from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CREATOR = "CREATOR"


class CompetitionFormat(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"


class CompetitionScale(str, Enum):
    PROVINCIAL = "PROVINCIAL"
    REGIONAL = "REGIONAL"
    INTERNATIONAL = "INTERNATIONAL"


class BaseModel(SQLModel):
    """Base model with common fields."""
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Optional[datetime] = Field(default=None, sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}) 