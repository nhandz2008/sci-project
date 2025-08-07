from datetime import datetime
from typing import List, Optional
import json
from sqlmodel import Field, Relationship

from app.models.common import BaseModel, CompetitionFormat, CompetitionScale


class Competition(BaseModel, table=True):
    """Competition model for science competitions."""
    __tablename__ = "competitions"
    
    title: str = Field(min_length=1, max_length=255, index=True)
    introduction: Optional[str] = Field(default=None, max_length=2000)
    question_type: Optional[str] = Field(default=None, max_length=500)
    selection_process: Optional[str] = Field(default=None, max_length=1000)
    history: Optional[str] = Field(default=None, max_length=1000)
    scoring_and_format: Optional[str] = Field(default=None, max_length=1000)
    awards: Optional[str] = Field(default=None, max_length=1000)
    penalties_and_bans: Optional[str] = Field(default=None, max_length=500)
    notable_achievements: Optional[str] = Field(default=None, max_length=1000)
    competition_link: Optional[str] = Field(default=None, max_length=500)
    background_image_url: Optional[str] = Field(default=None, max_length=500)
    detail_image_urls: str = Field(default="[]", max_length=2000)  # JSON string
    location: Optional[str] = Field(default=None, max_length=100)
    format: Optional[CompetitionFormat] = None
    scale: Optional[CompetitionScale] = None
    registration_deadline: datetime = Field(index=True)
    size: Optional[int] = Field(default=None, ge=1)
    target_age_min: Optional[int] = Field(default=None, ge=0, le=100)
    target_age_max: Optional[int] = Field(default=None, ge=0, le=100)
    is_active: bool = Field(default=True, index=True)
    is_featured: bool = Field(default=False, index=True)
    is_approved: bool = Field(default=False, index=True)  # For content moderation
    
    # Foreign key
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id")
    
    # Relationships
    owner: Optional["User"] = Relationship(back_populates="competitions")
    
    @property
    def detail_image_urls_list(self) -> List[str]:
        """Get detail image URLs as a list."""
        try:
            return json.loads(self.detail_image_urls)
        except (json.JSONDecodeError, TypeError):
            return []
    
    @detail_image_urls_list.setter
    def detail_image_urls_list(self, value: List[str]):
        """Set detail image URLs from a list."""
        self.detail_image_urls = json.dumps(value)
    
    class Config:
        from_attributes = True 