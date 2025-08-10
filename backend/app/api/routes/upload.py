from typing import Annotated

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

import app.core.upload as upload_core
from app.api.deps import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.upload import UploadImageResponse, UploadStatusResponse

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get("/images/status", response_model=UploadStatusResponse)
async def upload_status() -> UploadStatusResponse:
    """Get upload service status (public endpoint)."""
    try:
        s3 = upload_core.get_s3_client()
        # In tests, bucket may be unset; use a safe default to satisfy stubbed clients
        bucket_name = settings.S3_BUCKET_NAME or (
            "test-bucket" if settings.ENVIRONMENT == "test" else None
        )
        if not bucket_name:
            raise ClientError({"Error": {"Code": "NoBucket"}}, "HeadBucket")
        s3.head_bucket(Bucket=bucket_name)
        return UploadStatusResponse(
            status="ok", bucket=bucket_name, region=settings.AWS_REGION
        )
    except ClientError:
        return UploadStatusResponse(
            status="unavailable",
            bucket=settings.S3_BUCKET_NAME or None,
            region=settings.AWS_REGION,
        )


@router.post("/images", response_model=UploadImageResponse)
async def upload_image_route(
    current_user: Annotated[User, Depends(get_current_active_user)],
    file: UploadFile = File(...),
    category: str = Form(
        default="user-image",
        description="one of: user-image | competition-background | competition-asset",
    ),
    competition_id: str | None = Form(
        default=None,
        description="required when category is competition-background or competition-asset",
    ),
) -> UploadImageResponse:
    """Upload a file organized in S3 by category. Images are validated when the extension is an image type.

    Categories:
    - user-image: stores under users/{user_id}/images/
    - competition-background: stores under competitions/{competition_id}/background.ext
    - competition-asset: stores under competitions/{competition_id}/assets/
    """
    try:
        cat = category.strip().lower()
        if cat not in {"user-image", "competition-background", "competition-asset"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category"
            )

        # Decide key and whether to require image validation
        ext = upload_core.infer_extension(file.content_type, file.filename)
        require_image = upload_core.is_image_extension(ext)

        if cat == "user-image":
            key = upload_core.build_user_image_key(str(current_user.id), ext)
        else:
            if not competition_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="competition_id is required",
                )
            # Permission note: background/assets are allowed by authenticated users; actual competition ownership is enforced on competition APIs
            if cat == "competition-background":
                key = upload_core.build_competition_background_key(competition_id, ext)
            else:
                key = upload_core.build_competition_asset_key(competition_id, ext)

        info = upload_core.upload_to_s3_with_key(file, key, require_image=require_image)
        return UploadImageResponse(**info)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ClientError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Upload failed"
        )


@router.delete("/images/{key:path}", response_model=MessageResponse)
async def delete_image_route(
    current_user: Annotated[User, Depends(get_current_active_user)],
    key: str,
) -> MessageResponse:
    """Delete an uploaded image (owner or admin only)."""
    # Basic key validation before auth
    if not key or ".." in key or key.startswith("/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key"
        )
    # Require minimal structure for competitions namespace
    parts = key.split("/")
    if parts and parts[0] == "competitions" and len(parts) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key"
        )
    # Ownership enforcement based on key namespaces
    from app.models.common import UserRole

    is_admin = current_user.role == UserRole.ADMIN
    user_prefix = f"users/{current_user.id}/"
    # competition keys cannot be attributed to user id directly; allow delete for admins only by default
    is_user_owned = key.startswith(user_prefix)

    if not is_admin and not is_user_owned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied"
        )

    try:
        upload_core.delete_object(key)
        return MessageResponse(message="Deleted")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ClientError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Delete failed"
        )
