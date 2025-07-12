from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, HttpUrl, field_validator
from app.models.competition import CompetitionScale


class CompetitionBase(BaseModel):
    """Base competition schema with common fields."""
    title: str = Field(..., min_length=3, max_length=200, description="Competition title")
    description: str = Field(..., min_length=10, description="Detailed competition description")
    location: str = Field(..., min_length=3, max_length=200, description="Competition location")
    scale: CompetitionScale = Field(..., description="Competition scale/level")


class CompetitionCreate(CompetitionBase):
    """Schema for creating a new competition."""
    # Required dates
    start_date: date = Field(..., description="Competition start date")
    end_date: date = Field(..., description="Competition end date")
    registration_deadline: date = Field(..., description="Registration deadline")
    
    # Optional detailed information
    prize_structure: Optional[str] = Field(None, description="Prize structure and awards")
    eligibility_criteria: Optional[str] = Field(None, description="Eligibility requirements")
    
    # Media and links
    image_url: Optional[HttpUrl] = Field(None, description="Competition image URL")
    external_url: Optional[HttpUrl] = Field(None, description="External registration/info URL")
    
    # AI recommendation fields
    target_age_min: Optional[int] = Field(None, ge=5, le=25, description="Minimum target age")
    target_age_max: Optional[int] = Field(None, ge=5, le=25, description="Maximum target age")
    required_grade_min: Optional[int] = Field(None, ge=1, le=12, description="Minimum grade level")
    required_grade_max: Optional[int] = Field(None, ge=1, le=12, description="Maximum grade level")
    subject_areas: Optional[str] = Field(None, max_length=500, description="Subject areas (comma-separated)")
    
    # Status flags
    is_featured: bool = Field(default=False, description="Whether competition is featured")
    is_active: bool = Field(default=True, description="Whether competition is active")
    
    @field_validator('end_date')
    @classmethod
    def end_date_after_start_date(cls, v, info):
        """Validate that end date is after start date."""
        if hasattr(info, 'data') and info.data and 'start_date' in info.data:
            if v <= info.data['start_date']:
                raise ValueError('End date must be after start date')
        return v
    
    @field_validator('registration_deadline')
    @classmethod
    def deadline_before_start_date(cls, v, info):
        """Validate that registration deadline is before start date."""
        if hasattr(info, 'data') and info.data and 'start_date' in info.data:
            if v >= info.data['start_date']:
                raise ValueError('Registration deadline must be before start date')
        return v
    
    @field_validator('target_age_max')
    @classmethod
    def age_max_greater_than_min(cls, v, info):
        """Validate that max age is greater than min age."""
        if v is not None and hasattr(info, 'data') and info.data and 'target_age_min' in info.data:
            target_age_min = info.data['target_age_min']
            if target_age_min is not None and v < target_age_min:
                raise ValueError('Maximum age must be greater than minimum age')
        return v
    
    @field_validator('required_grade_max')
    @classmethod
    def grade_max_greater_than_min(cls, v, info):
        """Validate that max grade is greater than min grade."""
        if v is not None and hasattr(info, 'data') and info.data and 'required_grade_min' in info.data:
            required_grade_min = info.data['required_grade_min']
            if required_grade_min is not None and v < required_grade_min:
                raise ValueError('Maximum grade must be greater than minimum grade')
        return v


class CompetitionUpdate(BaseModel):
    """Schema for updating competition information."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, min_length=3, max_length=200)
    scale: Optional[CompetitionScale] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    prize_structure: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    external_url: Optional[HttpUrl] = None
    target_age_min: Optional[int] = Field(None, ge=5, le=25)
    target_age_max: Optional[int] = Field(None, ge=5, le=25)
    required_grade_min: Optional[int] = Field(None, ge=1, le=12)
    required_grade_max: Optional[int] = Field(None, ge=1, le=12)
    subject_areas: Optional[str] = Field(None, max_length=500)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class CompetitionResponse(CompetitionBase):
    """Schema for competition data in API responses."""
    id: int
    start_date: date
    end_date: date
    registration_deadline: date
    prize_structure: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    required_grade_min: Optional[int] = None
    required_grade_max: Optional[int] = None
    subject_areas: Optional[str] = None
    is_featured: bool
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class CompetitionPublic(BaseModel):
    """Public competition schema (limited fields for public browsing)."""
    id: int
    title: str
    description: str
    location: str
    scale: CompetitionScale
    start_date: date
    end_date: date
    registration_deadline: date
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    is_featured: bool
    
    model_config = ConfigDict(from_attributes=True)


class CompetitionCard(BaseModel):
    """Minimal competition schema for card displays."""
    id: int
    title: str
    location: str
    scale: CompetitionScale
    registration_deadline: date
    image_url: Optional[str] = None
    is_featured: bool
    
    model_config = ConfigDict(from_attributes=True)


class CompetitionWithCreator(CompetitionResponse):
    """Competition schema with creator information."""
    creator_username: str = Field(..., description="Username of the creator")
    
    model_config = ConfigDict(from_attributes=True)


# Creator information schema
class CreatorInfo(BaseModel):
    """Creator information schema for management views."""
    id: int
    username: str
    email: str
    role: str
    
    model_config = ConfigDict(from_attributes=True)


class CompetitionManagement(CompetitionResponse):
    """Competition schema for management views with full creator information."""
    creator: CreatorInfo = Field(..., description="Full creator information")
    
    model_config = ConfigDict(from_attributes=True)


# List and pagination schemas
class CompetitionListResponse(BaseModel):
    """Response schema for paginated competition lists."""
    competitions: List[CompetitionPublic]
    total: int = Field(..., description="Total number of competitions")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")


class CompetitionManagementListResponse(BaseModel):
    """Response schema for paginated competition management lists."""
    competitions: List[CompetitionManagement]
    total: int = Field(..., description="Total number of competitions")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")


class CompetitionSearchFilters(BaseModel):
    """Schema for competition search and filtering."""
    search: Optional[str] = Field(None, description="Search term for title or description")
    location: Optional[str] = Field(None, description="Filter by location")
    scale: Optional[CompetitionScale] = Field(None, description="Filter by scale")
    is_featured: Optional[bool] = Field(None, description="Filter featured competitions")
    age_min: Optional[int] = Field(None, ge=5, le=25, description="Minimum age filter")
    age_max: Optional[int] = Field(None, ge=5, le=25, description="Maximum age filter")
    grade_min: Optional[int] = Field(None, ge=1, le=12, description="Minimum grade filter") 
    grade_max: Optional[int] = Field(None, ge=1, le=12, description="Maximum grade filter")
    subject_areas: Optional[List[str]] = Field(None, description="Subject area filters") 