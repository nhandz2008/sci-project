# Phase 4: File Upload & Media Management – Implementation Guide

This guide describes how to implement image upload to AWS S3 so creators can attach images to competitions during creation/update. It aligns with the existing models, schemas, routes, and settings in `sci-project/backend/app`.

No database migrations are required. Competitions already store image URLs via `background_image_url` and `detail_image_urls`.

---

## Goals
- Authenticated users upload images to S3 and obtain permanent URLs
- Reuse URLs in `POST /competitions` and `PUT /competitions/{id}`
- Enforce file validation (type/size), safe key naming, and ownership constraints
- Provide secure deletion for owners and admins
- Offer a simple service health endpoint

---

## High-Level Architecture
- `app/core/upload.py`: S3 client factory and upload/delete utilities
- `app/schemas/upload.py`: Request/response models for upload endpoints
- `app/api/routes/upload.py`: Upload API routes
- Wire router in `app/api/main.py`

Flow when creating competitions:
1) Client uploads images → receives public URLs
2) Client includes `background_image_url` and/or `detail_image_urls` in `POST /competitions`

---

## Prerequisites
- Environment variables (already modeled in `app/core/config.py`):
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
  - `MAX_FILE_SIZE_MB` (default 10), `ALLOWED_FILE_TYPES` (recommend: `jpg,jpeg,png,webp`)
- Dependencies (already present): `boto3`, `python-multipart`, `pillow`
- Bucket policy permitting uploads. For public serving via direct URLs, configure bucket to allow public read of uploaded objects or serve via CloudFront.

Recommended settings:
- Set `ALLOWED_FILE_TYPES=jpg,jpeg,png,webp` and adjust `MAX_FILE_SIZE_MB` as needed in your `.env`.

Tip: For local dev you can use a real S3 bucket or a local S3-compatible emulator (e.g. LocalStack). This guide targets real S3 with SDK-level validation and stubbed tests.

---

## API Design
- `POST /api/v1/upload/images` (auth required):
  - Body: `multipart/form-data` with field `file`
  - Saves to: `competitions/{user_id}/{uuid}.{ext}`
  - Validates extension and size; opens with Pillow to ensure valid image
  - Response: `{ url, key, filename, content_type, size }`

- `DELETE /api/v1/upload/images/{key}` (auth required):
  - Path param: `key` (use `{key:path}` to allow slashes; key must be URL-encoded by client)
  - Only owner of `competitions/{user_id}/...` (or admin) can delete
  - Response: `{ message }`

- `GET /api/v1/upload/images/status` (public):
  - Checks S3 bucket head operation; returns `{ status, bucket, region }`

Notes:
- Keep competition routes unchanged; they already accept image URLs as strings.
- Ownership enforcement is done by embedding `current_user.id` in object keys and checking on delete.

---

## Implementation Steps

### 1) Core utilities – `app/core/upload.py`
Create a new module with S3 helpers and validations.

```python
from __future__ import annotations

import io
import mimetypes
import re
import uuid
from typing import BinaryIO

import boto3
from botocore.client import Config as BotoConfig
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


def _sanitize_filename(filename: str) -> str:
    # remove path components and unsafe chars
    base = filename.split("/")[-1].split("\\")[-1]
    base = re.sub(r"[^A-Za-z0-9._-]", "-", base)
    return base[:128] or "file"


def _infer_ext(content_type: str | None, filename: str) -> str:
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        return ext
    guessed = mimetypes.guess_extension(content_type or "")
    return (guessed or ".bin").lstrip(".")


def _is_allowed_image_ext(ext: str) -> bool:
    allowed_from_settings = {e.lower() for e in settings.allowed_file_types_list}
    allowed = allowed_from_settings or {"jpg", "jpeg", "png", "webp"}
    return ext.lower() in allowed


def validate_upload(file: UploadFile) -> tuple[bytes, str, int]:
    # Read into memory for Pillow validation and size check
    content = file.file.read()
    size = len(content)
    if size == 0:
        raise ValueError("Empty file")
    if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError("File too large")

    # Validate as image
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.verify()
    except UnidentifiedImageError as e:
        raise ValueError("Invalid image file") from e

    # Validate extension
    ext = _infer_ext(file.content_type, file.filename)
    if not _is_allowed_image_ext(ext):
        raise ValueError("Unsupported image type")

    return content, ext, size


def build_key(user_id: str, ext: str) -> str:
    return f"competitions/{user_id}/{uuid.uuid4().hex}.{ext.lower()}"


def upload_image(file: UploadFile, user_id: str) -> dict:
    content, ext, size = validate_upload(file)

    key = build_key(user_id, ext)
    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=content,
        ContentType=file.content_type or mimetypes.types_map.get(f".{ext}", "application/octet-stream"),
    )

    url = f"{settings.S3_BUCKET_URL}/{key}" if settings.S3_BUCKET_URL else key
    return {
        "url": url,
        "key": key,
        "filename": _sanitize_filename(file.filename or key),
        "content_type": file.content_type,
        "size": size,
    }


def delete_object(key: str) -> None:
    if not key or ".." in key or key.startswith("/"):
        raise ValueError("Invalid key")
    s3 = get_s3_client()
    s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
```

Notes:
- We validate actual image content using Pillow and enforce max size
- Keys embed the `user_id` to enforce ownership on deletion
- For private buckets, you may prefer presigned URLs for GETs; for now we return the S3 URL composed from `S3_BUCKET_URL`
 - Using `put_object` keeps tests simple and deterministic (works cleanly with `botocore.stub.Stubber`).


### 2) Schemas – `app/schemas/upload.py`

```python
from pydantic import BaseModel, Field


class UploadImageResponse(BaseModel):
    url: str
    key: str
    filename: str
    content_type: str | None = None
    size: int = Field(ge=1)


class UploadStatusResponse(BaseModel):
    status: str
    bucket: str | None = None
    region: str | None = None
```


### 3) Routes – `app/api/routes/upload.py`

```python
from typing import Annotated

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.upload import delete_object, get_s3_client, upload_image
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.upload import UploadImageResponse, UploadStatusResponse

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get("/images/status", response_model=UploadStatusResponse)
async def upload_status() -> UploadStatusResponse:
    try:
        s3 = get_s3_client()
        s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        return UploadStatusResponse(status="ok", bucket=settings.S3_BUCKET_NAME, region=settings.AWS_REGION)
    except ClientError:
        return UploadStatusResponse(status="unavailable", bucket=settings.S3_BUCKET_NAME, region=settings.AWS_REGION)


@router.post("/images", response_model=UploadImageResponse)
async def upload_image_route(
    current_user: Annotated[User, Depends(get_current_active_user)],
    file: UploadFile = File(...),
) -> UploadImageResponse:
    try:
        info = upload_image(file, str(current_user.id))
        return UploadImageResponse(**info)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ClientError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Upload failed")


@router.delete("/images/{key:path}", response_model=MessageResponse)
async def delete_image_route(
    current_user: Annotated[User, Depends(get_current_active_user)],
    key: str,
) -> MessageResponse:
    # ownership enforcement: only delete own path unless admin
    from app.models.common import UserRole

    allowed_prefix = f"competitions/{current_user.id}/"
    if current_user.role != UserRole.ADMIN and not key.startswith(allowed_prefix):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    try:
        delete_object(key)
        return MessageResponse(message="Deleted")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ClientError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Delete failed")
```


### 4) Wire router – `app/api/main.py`
Include the new upload router.

```python
from app.api.routes import upload

api_router.include_router(upload.router, tags=["upload"])
```


### 5) Usage From Client
1) Upload background image:

```bash
curl -X POST "http://localhost:8000/api/v1/upload/images" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/background.png"
```

Response:
```json
{
  "url": "https://<bucket>.s3.<region>.amazonaws.com/competitions/<user_id>/<uuid>.png",
  "key": "competitions/<user_id>/<uuid>.png",
  "filename": "background.png",
  "content_type": "image/png",
  "size": 123456
}
```

2) Create competition using the URL:

```bash
curl -X POST "http://localhost:8000/api/v1/competitions" \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{
    "title": "My Competition",
    "registration_deadline": "2030-01-01T00:00:00Z",
    "background_image_url": "https://<bucket>.s3.<region>.amazonaws.com/competitions/<user_id>/<uuid>.png",
    "detail_image_urls": [
      "https://<bucket>.s3.<region>.amazonaws.com/competitions/<user_id>/<uuid2>.webp"
    ]
  }'
```

3) Delete an uploaded image:

```bash
curl -X DELETE "http://localhost:8000/api/v1/upload/images/competitions/%3Cuser_id%3E/%3Cuuid%3E.png" \
  -H "Authorization: Bearer <admin_or_owner_token>"
```


---

## Validation & Security
- Enforce `MAX_FILE_SIZE_MB` from settings
- Only allow image extensions: `jpg`, `jpeg`, `png`, `webp`
- Validate true image content using Pillow
- Generate safe S3 keys and never trust user path input
- Enforce ownership on delete (prefix with `competitions/{user_id}/`); admins can delete any key
- Return structured, user-friendly errors via `HTTPException`

Optional hardening:
- Auto-convert to WebP and/or resize large images before upload
- Virus scanning via external service/webhook
- Rate-limiting uploads per user

---

## Testing Strategy
Create tests without hitting real S3 by stubbing the boto3 client.

- Unit tests for `app/core/upload.py`:
  - `validate_upload` success for small valid PNG/JPEG/WEBP
  - Reject oversize files
  - Reject invalid image bytes
  - Key generation format `competitions/{user_id}/<uuid>.<ext>`

- API route tests in `backend/tests/test_upload_routes.py`:
  - `POST /upload/images` success with valid image and auth
  - 400 for invalid file / wrong type / oversize
  - 401 when unauthenticated
  - `DELETE /upload/images` success by owner; 403 when deleting other user's key; admin can delete any
  - `GET /upload/images/status` returns `ok` when `head_bucket` stubs to success

- Use `botocore.stub.Stubber` to stub S3:

```python
from botocore.stub import Stubber
from app.core.upload import get_s3_client

s3 = get_s3_client()
stubber = Stubber(s3)
stubber.add_response("put_object", {}, {"Bucket": ANY, "Key": ANY, "Body": ANY})
stubber.add_response("delete_object", {}, {"Bucket": ANY, "Key": ANY})
stubber.add_response("head_bucket", {}, {"Bucket": ANY})
stubber.activate()
# run requests against API
stubber.deactivate()
```

Run tests:
```bash
./scripts/dev.sh dev-test
```

---

## README Additions (to apply after implementation)
- Document new endpoints with examples
- Clarify flow: upload → get URL → pass to competitions API
- Note bucket public/CloudFront configuration for serving images

---

## Rollout Checklist
- [ ] Add `upload.py` core module
- [ ] Add `upload.py` schemas and routes
- [ ] Wire router in `api/main.py`
- [ ] Ensure environment variables are set (`AWS_*`, `S3_BUCKET_NAME`)
- [ ] Bucket policy configured for serving images
- [ ] Tests added and passing
- [ ] README updated

---

## Notes on Alternatives
- If you prefer not to host images publicly, return object keys only and serve via temporary presigned URLs for viewing. The competition schema can still store keys; the client requests presigned URLs on demand.
- For very large images, consider background processing and a callback to update the competition with final URLs once processing is done.