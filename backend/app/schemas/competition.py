"""Competition schemas for request/response validation."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer, field_validator, ConfigDict

from app.models.common import CompetitionFormat, CompetitionScale


class CompetitionCreate(BaseModel):
    """Schema for creating a new competition."""

    title: str = Field(
        ..., min_length=1, max_length=255, description="Competition title"
    )
    introduction: str | None = Field(
        None, max_length=2000, description="Competition introduction"
    )
    question_type: str | None = Field(
        None, max_length=500, description="Type of questions"
    )
    selection_process: str | None = Field(
        None, max_length=1000, description="Selection process"
    )
    history: str | None = Field(
        None, max_length=1000, description="Competition history"
    )
    scoring_and_format: str | None = Field(
        None, max_length=1000, description="Scoring and format"
    )
    awards: str | None = Field(None, max_length=1000, description="Awards and prizes")
    penalties_and_bans: str | None = Field(
        None, max_length=500, description="Penalties and bans"
    )
    notable_achievements: str | None = Field(
        None, max_length=1000, description="Notable achievements"
    )
    competition_link: str | None = Field(
        None, max_length=500, description="Official competition link"
    )
    background_image_url: str | None = Field(
        None, max_length=500, description="Background image URL"
    )
    detail_image_urls: list[str] = Field(default=[], description="Detail image URLs")
    location: str | None = Field(
        None, max_length=100, description="Competition location"
    )
    format: CompetitionFormat | None = Field(None, description="Competition format")
    scale: CompetitionScale | None = Field(None, description="Competition scale")
    registration_deadline: datetime = Field(..., description="Registration deadline")
    size: int | None = Field(None, ge=1, description="Competition size")
    target_age_min: int | None = Field(
        None, ge=0, le=100, description="Minimum target age"
    )
    target_age_max: int | None = Field(
        None, ge=0, le=100, description="Maximum target age"
    )

    @field_validator("target_age_max")
    @classmethod
    def validate_age_range(cls, v: int | None, info: Any) -> int | None:
        """Validate that max age is greater than min age."""
        if (
            v is not None
            and "target_age_min" in info.data
            and info.data["target_age_min"] is not None
        ):
            if v <= info.data["target_age_min"]:
                raise ValueError("Maximum age must be greater than minimum age")
        return v

    @field_validator("registration_deadline")
    @classmethod
    def validate_deadline(cls, v: datetime) -> datetime:
        """Validate that deadline is in the future."""
        if v <= datetime.now():
            raise ValueError("Registration deadline must be in the future")
        return v


class CompetitionUpdate(BaseModel):
    """Schema for updating a competition."""

    title: str | None = Field(
        None, min_length=1, max_length=255, description="Competition title"
    )
    introduction: str | None = Field(
        None, max_length=2000, description="Competition introduction"
    )
    question_type: str | None = Field(
        None, max_length=500, description="Type of questions"
    )
    selection_process: str | None = Field(
        None, max_length=1000, description="Selection process"
    )
    history: str | None = Field(
        None, max_length=1000, description="Competition history"
    )
    scoring_and_format: str | None = Field(
        None, max_length=1000, description="Scoring and format"
    )
    awards: str | None = Field(None, max_length=1000, description="Awards and prizes")
    penalties_and_bans: str | None = Field(
        None, max_length=500, description="Penalties and bans"
    )
    notable_achievements: str | None = Field(
        None, max_length=1000, description="Notable achievements"
    )
    competition_link: str | None = Field(
        None, max_length=500, description="Official competition link"
    )
    background_image_url: str | None = Field(
        None, max_length=500, description="Background image URL"
    )
    detail_image_urls: list[str] | None = Field(None, description="Detail image URLs")
    location: str | None = Field(
        None, max_length=100, description="Competition location"
    )
    format: CompetitionFormat | None = Field(None, description="Competition format")
    scale: CompetitionScale | None = Field(None, description="Competition scale")
    registration_deadline: datetime | None = Field(
        None, description="Registration deadline"
    )
    size: int | None = Field(None, ge=1, description="Competition size")
    target_age_min: int | None = Field(
        None, ge=0, le=100, description="Minimum target age"
    )
    target_age_max: int | None = Field(
        None, ge=0, le=100, description="Maximum target age"
    )
    is_featured: bool | None = Field(None, description="Featured status")

    @field_validator("target_age_max")
    @classmethod
    def validate_age_range(cls, v: int | None, info: Any) -> int | None:
        """Validate that max age is greater than min age."""
        if (
            v is not None
            and "target_age_min" in info.data
            and info.data["target_age_min"] is not None
        ):
            if v <= info.data["target_age_min"]:
                raise ValueError("Maximum age must be greater than minimum age")
        return v

    @field_validator("registration_deadline")
    @classmethod
    def validate_deadline(cls, v: datetime | None) -> datetime | None:
        """Validate that deadline is in the future."""
        if v is not None and v <= datetime.now():
            raise ValueError("Registration deadline must be in the future")
        return v


class CompetitionResponse(BaseModel):
    """Schema for competition response data."""

    id: UUID
    title: str
    introduction: str | None
    question_type: str | None
    selection_process: str | None
    history: str | None
    scoring_and_format: str | None
    awards: str | None
    penalties_and_bans: str | None
    notable_achievements: str | None
    competition_link: str | None
    background_image_url: str | None
    detail_image_urls: list[str]
    location: str | None
    format: CompetitionFormat | None
    scale: CompetitionScale | None
    registration_deadline: datetime
    size: int | None
    target_age_min: int | None
    target_age_max: int | None
    is_active: bool
    is_featured: bool
    is_approved: bool
    owner_id: str | None
    created_at: datetime
    updated_at: datetime | None = None

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class CompetitionListResponse(BaseModel):
    """Schema for competition list response."""

    id: UUID
    title: str
    introduction: str | None
    background_image_url: str | None
    location: str | None
    format: CompetitionFormat | None
    scale: CompetitionScale | None
    registration_deadline: datetime
    size: int | None
    target_age_min: int | None
    target_age_max: int | None
    is_featured: bool
    is_approved: bool
    owner_id: str | None
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class CompetitionListPaginatedResponse(BaseModel):
    """Schema for paginated competition list response."""

    competitions: list[CompetitionListResponse] = Field(
        ..., description="List of competitions"
    )
    total: int = Field(..., description="Total number of competitions")
    skip: int = Field(..., description="Number of competitions skipped")
    limit: int = Field(..., description="Number of competitions returned")


class CompetitionFilterParams(BaseModel):
    """Schema for competition filtering parameters."""

    skip: int = Field(default=0, ge=0, description="Number of competitions to skip")
    limit: int = Field(
        default=100, ge=1, le=1000, description="Number of competitions to return"
    )
    format: CompetitionFormat | None = Field(
        None, description="Filter by competition format"
    )
    scale: CompetitionScale | None = Field(
        None, description="Filter by competition scale"
    )
    location: str | None = Field(None, description="Filter by location")
    is_approved: bool | None = Field(None, description="Filter by approval status")
    is_featured: bool | None = Field(None, description="Filter by featured status")
    search: str | None = Field(None, description="Search in title and description")
    owner_id: str | None = Field(None, description="Filter by owner ID")


class CompetitionModerationResponse(BaseModel):
    """Schema for competition moderation response."""

    id: UUID
    title: str
    introduction: str | None
    owner_id: str | None
    created_at: datetime
    is_approved: bool

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    model_config = ConfigDict(from_attributes=True)


class CompetitionModerationListResponse(BaseModel):
    """Schema for paginated competition moderation list response."""

    competitions: list[CompetitionModerationResponse] = Field(
        ..., description="List of competitions"
    )
    total: int = Field(..., description="Total number of competitions")
    skip: int = Field(..., description="Number of competitions skipped")
    limit: int = Field(..., description="Number of competitions returned")
