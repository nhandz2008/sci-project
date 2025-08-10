from pydantic import BaseModel, Field


class UploadImageResponse(BaseModel):
    """Response schema for successful image upload."""

    url: str = Field(..., description="Public URL of uploaded image")
    key: str = Field(..., description="S3 object key")
    filename: str = Field(..., description="Original filename")
    content_type: str | None = Field(None, description="File content type")
    size: int = Field(..., ge=1, description="File size in bytes")


class UploadStatusResponse(BaseModel):
    """Response schema for upload service status."""

    status: str = Field(..., description="Service status: 'ok' or 'unavailable'")
    bucket: str | None = Field(None, description="S3 bucket name")
    region: str | None = Field(None, description="AWS region")
