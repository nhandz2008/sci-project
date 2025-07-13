from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.competition import CompetitionCard


class UserProfileRequest(BaseModel):
    """Schema for user profile data used in AI recommendations."""
    age: int = Field(..., ge=5, le=25, description="User's age")
    grade: Optional[int] = Field(None, ge=1, le=12, description="Current grade level (1-12)")
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0, description="Grade Point Average (0.0-4.0)")
    interests: List[str] = Field(..., min_items=1, max_items=10, description="Areas of interest")
    previous_competitions: Optional[List[str]] = Field(None, description="Previous competition experience")
    preferred_scale: Optional[List[str]] = Field(None, description="Preferred competition scales")
    location_preference: Optional[str] = Field(None, description="Preferred location or 'remote'")
    
    @field_validator('interests')
    @classmethod
    def validate_interests(cls, v):
        """Validate that interests are meaningful strings."""
        cleaned_interests = []
        for interest in v:
            cleaned = interest.strip().lower()
            if len(cleaned) >= 2:  # At least 2 characters
                cleaned_interests.append(cleaned)
        
        if not cleaned_interests:
            raise ValueError("At least one valid interest is required")
        
        return cleaned_interests
    
    @field_validator('previous_competitions')
    @classmethod
    def validate_previous_competitions(cls, v):
        """Clean up previous competition names."""
        if v is None:
            return v
        return [comp.strip() for comp in v if comp.strip()]


class RecommendationRequest(BaseModel):
    """Main request schema for getting AI recommendations."""
    user_profile: UserProfileRequest
    max_recommendations: int = Field(default=5, ge=1, le=20, description="Maximum number of recommendations")
    include_explanation: bool = Field(default=True, description="Include AI explanation for recommendations")


class CompetitionRecommendation(BaseModel):
    """Schema for a single competition recommendation."""
    competition: CompetitionCard
    match_score: float = Field(..., ge=0.0, le=1.0, description="Match score (0.0-1.0)")
    match_reasons: List[str] = Field(..., description="Reasons why this competition matches")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence in this recommendation")


class RecommendationStats(BaseModel):
    """Statistics about recommendation performance."""
    average_match_score: float = Field(..., ge=0.0, le=1.0, description="Average match score of recommendations")
    score_distribution: dict = Field(..., description="Distribution of scores (excellent, good, fair, poor)")
    top_matching_criteria: List[str] = Field(..., description="Top matching criteria used")
    recommendation_quality: str = Field(..., description="Overall quality of recommendations")


class RecommendationResponse(BaseModel):
    """Response schema for AI recommendations."""
    recommendations: List[CompetitionRecommendation]
    total_competitions_analyzed: int = Field(..., description="Total competitions considered")
    recommendation_strategy: str = Field(..., description="AI strategy used for recommendations")
    user_profile_summary: str = Field(..., description="Summary of user profile used")
    stats: Optional[RecommendationStats] = Field(None, description="Recommendation statistics")
    
    
class FeaturedCompetitionsResponse(BaseModel):
    """Response schema for featured competitions."""
    featured_competitions: List[CompetitionCard]
    total_featured: int = Field(..., description="Total number of featured competitions")
    selection_criteria: str = Field(..., description="Criteria used for featuring")


class RecommendationFeedback(BaseModel):
    """Schema for user feedback on recommendations."""
    recommendation_id: Optional[str] = Field(None, description="Unique recommendation session ID")
    competition_id: int = Field(..., description="Competition that was rated")
    rating: int = Field(..., ge=1, le=5, description="User rating (1-5 stars)")
    feedback_text: Optional[str] = Field(None, max_length=500, description="Optional feedback text")
    action_taken: Optional[str] = Field(None, description="Action taken (viewed, registered, etc.)")


# Advanced recommendation schemas
class PersonalizedFilters(BaseModel):
    """Advanced personalized filtering options."""
    exclude_past_competitions: bool = Field(default=True, description="Exclude competitions user already joined")
    time_commitment_preference: Optional[str] = Field(None, description="Preferred time commitment")
    difficulty_preference: Optional[str] = Field(None, description="Preferred difficulty level")
    team_vs_individual: Optional[str] = Field(None, description="Team or individual preference")
    budget_consideration: Optional[str] = Field(None, description="Budget constraints")


class AdvancedRecommendationRequest(RecommendationRequest):
    """Extended recommendation request with advanced filtering."""
    personalized_filters: Optional[PersonalizedFilters] = None
    ai_model_preference: Optional[str] = Field(None, description="Preferred AI model for recommendations")
    explanation_detail_level: str = Field(default="standard", description="Level of detail for explanations")


class AIRecommendationMetrics(BaseModel):
    """Metrics about AI recommendation quality."""
    processing_time_ms: float = Field(..., description="Time taken to generate recommendations")
    model_version: str = Field(..., description="AI model version used")
    confidence_distribution: dict = Field(..., description="Distribution of confidence scores")
    diversity_score: float = Field(..., ge=0.0, le=1.0, description="Diversity of recommendations")


class EnhancedRecommendationResponse(RecommendationResponse):
    """Enhanced response with additional AI metrics."""
    ai_metrics: AIRecommendationMetrics
    alternative_searches: List[str] = Field(..., description="Alternative search suggestions")
    trending_competitions: List[CompetitionCard] = Field(..., description="Currently trending competitions") 