"""Unit tests for upload utilities."""

import io
import os
import uuid
from unittest.mock import Mock, patch

import pytest
from PIL import Image

from app.core.upload import (
    _sanitize_filename,
    build_user_image_key,
    delete_object,
    get_s3_client,
    is_image_extension,
    upload_to_s3_with_key,
    validate_upload,
)
from app.core.upload import (
    infer_extension as _infer_ext,
)


class MockUploadFile:
    def __init__(self, filename: str, content_type: str, file: io.BytesIO):
        self.filename = filename
        self.content_type = content_type
        self.file = file


class TestUploadUtils:
    """Test upload utility functions."""

    def test_sanitize_filename(self):
        """Test filename sanitization."""
        # Test normal filename
        assert _sanitize_filename("image.jpg") == "image.jpg"

        # Test with path components
        assert _sanitize_filename("/path/to/image.jpg") == "image.jpg"
        assert _sanitize_filename("C:\\path\\to\\image.jpg") == "image.jpg"

        # Test with unsafe characters
        assert _sanitize_filename("image with spaces.jpg") == "image-with-spaces.jpg"
        assert _sanitize_filename("image@#$%.jpg") == "image----.jpg"

        # Test very long filename
        long_name = "a" * 200
        result = _sanitize_filename(long_name)
        assert len(result) == 128
        assert result == "a" * 128

        # Test empty filename
        assert _sanitize_filename("") == "file"

    def test_infer_ext(self):
        """Test extension inference."""
        # Test from filename
        assert _infer_ext("image/png", "image.png") == "png"
        assert _infer_ext("image/jpeg", "photo.jpg") == "jpg"
        assert _infer_ext(None, "image.webp") == "webp"

        # Test from content type
        assert _infer_ext("image/png", "") == "png"
        assert _infer_ext("image/jpeg", "") == "jpeg"

        # Test fallback
        assert _infer_ext("unknown/type", "") == "bin"

    def test_is_image_extension(self):
        """Test image extension validation."""
        # Test allowed extensions
        assert is_image_extension("jpg") is True
        assert is_image_extension("jpeg") is True
        assert is_image_extension("png") is True
        assert is_image_extension("webp") is True

        # Test case insensitive
        assert is_image_extension("JPG") is True
        assert is_image_extension("PNG") is True

        # Test disallowed extensions
        assert is_image_extension("gif") is False
        assert is_image_extension("bmp") is False
        assert is_image_extension("txt") is False

    def test_build_user_image_key(self):
        """Test S3 key generation."""
        user_id = str(uuid.uuid4())
        ext = "png"

        key = build_user_image_key(user_id, ext)

        # Check format
        assert key.startswith(f"users/{user_id}/images/")
        assert key.endswith(".png")

        # Check UUID part at the end of path
        uuid_part = key.rsplit("/", 1)[-1].split(".")[0]
        assert len(uuid_part) == 32  # hex UUID length

        # Test different extensions
        key2 = build_user_image_key(user_id, "jpg")
        assert key2.endswith(".jpg")

    def test_validate_upload_valid_image(self):
        """Test validation of valid image upload."""
        # Create a small valid PNG image
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        file = MockUploadFile(
            filename="test.png", content_type="image/png", file=img_bytes
        )

        content, ext, size = validate_upload(file, require_image=True)

        assert ext == "png"
        assert size > 0
        assert len(content) == size

    def test_validate_upload_empty_file(self):
        """Test validation rejects empty files."""
        file = MockUploadFile(
            filename="empty.png", content_type="image/png", file=io.BytesIO(b"")
        )

        with pytest.raises(ValueError, match="Empty file"):
            validate_upload(file)

    def test_validate_upload_invalid_image(self):
        """Test validation rejects invalid image data."""
        file = MockUploadFile(
            filename="invalid.png",
            content_type="image/png",
            file=io.BytesIO(b"not an image"),
        )

        with pytest.raises(ValueError, match="Invalid image file"):
            validate_upload(file, require_image=True)

    def test_validate_upload_unsupported_extension(self):
        """Test validation rejects unsupported extensions."""
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        file = MockUploadFile(
            filename="test.gif", content_type="image/gif", file=img_bytes
        )  # GIF not in allowed types

        with pytest.raises(ValueError, match="Unsupported file type"):
            validate_upload(file, require_image=True)

    @patch("app.core.upload.settings.MAX_FILE_SIZE_MB", 1)
    def test_validate_upload_file_too_large(self):
        """Test validation rejects files that are too large."""
        # Create a larger image with random noise to avoid PNG compression
        width, height = 2000, 2000
        noise = os.urandom(width * height * 3)
        img = Image.frombytes("RGB", (width, height), noise)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG", compress_level=0)
        img_bytes.seek(0)

        file = MockUploadFile(
            filename="large.png", content_type="image/png", file=img_bytes
        )

        with pytest.raises(ValueError, match="File too large"):
            validate_upload(file)

    @patch("app.core.upload.boto3.client")
    def test_get_s3_client(self, mock_boto3_client):
        """Test S3 client creation."""
        mock_client = Mock()
        mock_boto3_client.return_value = mock_client

        _ = get_s3_client()

        mock_boto3_client.assert_called_once()
        call_args = mock_boto3_client.call_args
        assert call_args[0][0] == "s3"
        assert call_args[1]["region_name"] == "us-east-1"  # default from config

    @patch("app.core.upload.get_s3_client")
    def test_upload_image_success(self, mock_get_s3_client):
        """Test successful image upload."""
        # Create a small valid PNG image
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        file = MockUploadFile(
            filename="test.png", content_type="image/png", file=img_bytes
        )

        mock_s3_client = Mock()
        mock_get_s3_client.return_value = mock_s3_client

        with patch("app.core.upload.settings.S3_BUCKET_NAME", "test-bucket"):
            key = build_user_image_key("test-user-id", "png")
            result = upload_to_s3_with_key(file, key, require_image=True)

        # Verify S3 put_object was called
        mock_s3_client.put_object.assert_called_once()
        call_args = mock_s3_client.put_object.call_args
        assert call_args[1]["Bucket"] == "test-bucket"
        assert call_args[1]["Key"].startswith("users/test-user-id/images/")
        assert call_args[1]["Key"].endswith(".png")

        # Verify response structure
        assert "url" in result
        assert "key" in result
        assert "filename" in result
        assert "content_type" in result
        assert "size" in result
        assert result["url"].startswith("https://test-bucket.s3.")
        assert result["url"].endswith(call_args[1]["Key"]) or result["url"].endswith(
            call_args[1]["Key"]
        )  # key reflected in URL

    @patch("app.core.upload.get_s3_client")
    def test_delete_object_success(self, mock_get_s3_client):
        """Test successful object deletion."""
        mock_s3_client = Mock()
        mock_get_s3_client.return_value = mock_s3_client

        with patch("app.core.upload.settings.S3_BUCKET_NAME", "test-bucket"):
            delete_object("competitions/user123/image.png")

        mock_s3_client.delete_object.assert_called_once_with(
            Bucket="test-bucket", Key="competitions/user123/image.png"
        )

    def test_delete_object_invalid_key(self):
        """Test deletion rejects invalid keys."""
        with pytest.raises(ValueError, match="Invalid key"):
            delete_object("")

        with pytest.raises(ValueError, match="Invalid key"):
            delete_object("competitions/user123/../image.png")

        with pytest.raises(ValueError, match="Invalid key"):
            delete_object("/absolute/path")
