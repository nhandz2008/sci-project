import json
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship

from app.models.common import BaseModel, CompetitionFormat, CompetitionScale

if TYPE_CHECKING:
    from app.models.user import User


class Competition(BaseModel, table=True):  # type: ignore[call-arg]
    """Competition model for science competitions."""

    __tablename__ = "competitions"

    title: str = Field(min_length=1, max_length=255, index=True)
    introduction: str | None = Field(default=None, max_length=2000)
    question_type: str | None = Field(default=None, max_length=500)
    selection_process: str | None = Field(default=None, max_length=1000)
    history: str | None = Field(default=None, max_length=1000)
    scoring_and_format: str | None = Field(default=None, max_length=1000)
    awards: str | None = Field(default=None, max_length=1000)
    penalties_and_bans: str | None = Field(default=None, max_length=500)
    notable_achievements: str | None = Field(default=None, max_length=1000)
    competition_link: str | None = Field(default=None, max_length=500)
    background_image_url: str | None = Field(default=None, max_length=500)
    detail_image_urls: str = Field(default="[]", max_length=2000)  # JSON string
    location: str | None = Field(default=None, max_length=100)
    format: CompetitionFormat | None = None
    scale: CompetitionScale | None = None
    registration_deadline: datetime = Field(index=True)
    size: int | None = Field(default=None, ge=1)
    target_age_min: int | None = Field(default=None, ge=0, le=100)
    target_age_max: int | None = Field(default=None, ge=0, le=100)
    is_active: bool = Field(default=True, index=True)
    is_featured: bool = Field(default=False, index=True)
    is_approved: bool = Field(default=False, index=True)  # For content moderation

    # Foreign key
    owner_id: str | None = Field(default=None, foreign_key="users.id")

    # Relationships
    owner: Optional["User"] = Relationship(back_populates="competitions")

    @property
    def detail_image_urls_list(self) -> list[str]:
        """Get detail image URLs as a list."""
        try:
            return json.loads(self.detail_image_urls)
        except (json.JSONDecodeError, TypeError):
            return []

    @detail_image_urls_list.setter
    def detail_image_urls_list(self, value: list[str]):
        """Set detail image URLs from a list."""
        self.detail_image_urls = json.dumps(value)

    class Config:
        from_attributes = True
