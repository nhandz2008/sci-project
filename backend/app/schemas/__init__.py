# Pydantic schemas package for request/response validation

# User schemas
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    UserProfile,
    Token,
    TokenData,
    UserLoginResponse,
    UserListResponse,
)

# Competition schemas  
from .competition import (
    CompetitionBase,
    CompetitionCreate,
    CompetitionUpdate,
    CompetitionResponse,
    CompetitionPublic,
    CompetitionCard,
    CompetitionWithCreator,
    CompetitionListResponse,
    CompetitionSearchFilters,
)

# Recommendation schemas
from .recommendation import (
    UserProfileRequest,
    RecommendationRequest,
    CompetitionRecommendation,
    RecommendationResponse,
    FeaturedCompetitionsResponse,
    RecommendationFeedback,
    RecommendationStats,
    PersonalizedFilters,
    AdvancedRecommendationRequest,
    AIRecommendationMetrics,
    EnhancedRecommendationResponse,
)

# Common schemas
from .common import (
    MessageResponse,
    ErrorResponse,
    ValidationErrorResponse,
    PaginationParams,
    PaginationResponse,
    HealthResponse,
    SortParams,
    SearchParams,
    FileUploadResponse,
    BulkOperationResponse,
    APIResponse,
    StatsResponse,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate", 
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "UserProfile",
    "Token",
    "TokenData",
    "UserLoginResponse",
    "UserListResponse",
    
    # Competition schemas
    "CompetitionBase",
    "CompetitionCreate",
    "CompetitionUpdate", 
    "CompetitionResponse",
    "CompetitionPublic",
    "CompetitionCard",
    "CompetitionWithCreator",
    "CompetitionListResponse",
    "CompetitionSearchFilters",
    
    # Recommendation schemas
    "UserProfileRequest",
    "RecommendationRequest",
    "CompetitionRecommendation",
    "RecommendationResponse",
    "FeaturedCompetitionsResponse",
    "RecommendationFeedback",
    "RecommendationStats",
    "PersonalizedFilters",
    "AdvancedRecommendationRequest",
    "AIRecommendationMetrics",
    "EnhancedRecommendationResponse",
    
    # Common schemas
    "MessageResponse",
    "ErrorResponse",
    "ValidationErrorResponse",
    "PaginationParams",
    "PaginationResponse",
    "HealthResponse",
    "SortParams", 
    "SearchParams",
    "FileUploadResponse",
    "BulkOperationResponse",
    "APIResponse",
    "StatsResponse",
] 