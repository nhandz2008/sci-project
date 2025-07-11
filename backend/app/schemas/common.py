from typing import Any, Optional, List, Dict
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Generic message response schema."""
    message: str = Field(..., description="Response message")
    success: bool = Field(default=True, description="Whether the operation was successful")


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")
    success: bool = Field(default=False, description="Operation success status")


class ValidationErrorResponse(BaseModel):
    """Validation error response schema."""
    error: str = Field(default="Validation Error", description="Error type")
    details: List[Dict[str, Any]] = Field(..., description="List of validation errors")
    success: bool = Field(default=False, description="Operation success status")


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.size


class PaginationResponse(BaseModel):
    """Base pagination response metadata."""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
    
    @classmethod
    def create(cls, total: int, page: int, size: int) -> "PaginationResponse":
        """Create pagination response from parameters."""
        pages = (total + size - 1) // size  # Ceiling division
        return cls(
            total=total,
            page=page,
            size=size,
            pages=pages
        )


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="healthy", description="Service status")
    timestamp: str = Field(..., description="Health check timestamp")
    version: str = Field(default="1.0.0", description="API version")
    database: str = Field(default="connected", description="Database status")
    dependencies: Dict[str, str] = Field(default_factory=dict, description="External dependencies status")


class SortParams(BaseModel):
    """Common sorting parameters."""
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")


class SearchParams(BaseModel):
    """Common search parameters."""
    q: Optional[str] = Field(None, min_length=1, max_length=100, description="Search query")
    
    
class FileUploadResponse(BaseModel):
    """File upload response schema."""
    filename: str = Field(..., description="Original filename")
    file_url: str = Field(..., description="URL to access the uploaded file")
    file_size: int = Field(..., description="File size in bytes")
    content_type: str = Field(..., description="File content type")
    upload_timestamp: str = Field(..., description="Upload timestamp")


class BulkOperationResponse(BaseModel):
    """Response for bulk operations."""
    total_processed: int = Field(..., description="Total items processed")
    successful: int = Field(..., description="Successfully processed items")
    failed: int = Field(..., description="Failed items")
    errors: List[str] = Field(default_factory=list, description="List of error messages")


class APIResponse(BaseModel):
    """Generic API response wrapper."""
    data: Any = Field(..., description="Response data")
    message: Optional[str] = Field(None, description="Optional message")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    success: bool = Field(default=True, description="Operation success status")


class StatsResponse(BaseModel):
    """Common statistics response schema."""
    total_users: int = Field(..., description="Total number of users")
    total_competitions: int = Field(..., description="Total number of competitions")
    active_competitions: int = Field(..., description="Currently active competitions")
    featured_competitions: int = Field(..., description="Featured competitions")
    competitions_by_scale: Dict[str, int] = Field(..., description="Competitions grouped by scale")
    recent_activity: List[str] = Field(..., description="Recent platform activity") 