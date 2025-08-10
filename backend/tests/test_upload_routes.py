"""Integration tests for upload routes."""

import io
from unittest.mock import patch

from botocore.stub import ANY, Stubber
from PIL import Image

from app.core.upload import get_s3_client


class TestUploadRoutes:
    """Test upload API routes."""

    def test_upload_status_success(self, client):
        """Test upload status endpoint when S3 is available."""
        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_response("head_bucket", {}, {"Bucket": ANY})
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            response = client.get("/api/v1/upload/images/status")

            stubber.deactivate()

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["bucket"] is not None
        assert data["region"] is not None

    def test_upload_status_unavailable(self, client):
        """Test upload status endpoint when S3 is unavailable."""
        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_client_error("head_bucket", "NoSuchBucket")
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            response = client.get("/api/v1/upload/images/status")

            stubber.deactivate()

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unavailable"
        assert data["bucket"] is not None
        assert data["region"] is not None

    def test_upload_image_success(self, client, auth_headers):
        """Test successful image upload."""

        # Create a small valid PNG image
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_response(
                "put_object", {}, {"Bucket": ANY, "Key": ANY, "Body": ANY}
            )
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            files = {"file": ("test.png", img_bytes, "image/png")}
            # default category=user-image now
            response = client.post(
                "/api/v1/upload/images", files=files, headers=auth_headers
            )

            stubber.deactivate()

        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "key" in data
        assert "filename" in data
        assert "content_type" in data
        assert "size" in data
        assert data["filename"] == "test.png"
        assert data["content_type"] == "image/png"
        assert data["key"].startswith("users/")

    def test_upload_image_unauthorized(self, client):
        """Test upload image without authentication."""
        # Create a small valid PNG image
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        files = {"file": ("test.png", img_bytes, "image/png")}
        response = client.post("/api/v1/upload/images", files=files)

        # HTTPBearer returns 403 when Authorization header is missing
        assert response.status_code == 403

    def test_upload_image_invalid_file(self, client, auth_headers):
        """Test upload with invalid file."""
        # Upload non-image file
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        response = client.post(
            "/api/v1/upload/images", files=files, headers=auth_headers
        )

        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_upload_image_empty_file(self, client, auth_headers):
        """Test upload with empty file."""
        files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
        response = client.post(
            "/api/v1/upload/images", files=files, headers=auth_headers
        )

        assert response.status_code == 400
        assert "Empty file" in response.json()["detail"]

    def test_upload_image_unsupported_extension(self, client, auth_headers):
        """Test upload with unsupported file extension."""
        # Create a valid image but with unsupported extension
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        files = {"file": ("test.gif", img_bytes, "image/gif")}
        response = client.post(
            "/api/v1/upload/images", files=files, headers=auth_headers
        )

        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    @patch("app.core.upload.settings.MAX_FILE_SIZE_MB", 1)
    def test_upload_image_too_large(self, client, auth_headers):
        """Test upload with file that's too large."""
        # Create a larger noisy image to avoid PNG compression
        import os

        width, height = 2000, 2000
        noise = os.urandom(width * height * 3)
        img = Image.frombytes("RGB", (width, height), noise)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG", compress_level=0)
        img_bytes.seek(0)

        files = {"file": ("large.png", img_bytes, "image/png")}
        response = client.post(
            "/api/v1/upload/images", files=files, headers=auth_headers
        )

        assert response.status_code == 400
        assert "File too large" in response.json()["detail"]

    def test_upload_image_s3_error(self, client, auth_headers):
        """Test upload when S3 operation fails."""

        # Create a small valid PNG image
        img = Image.new("RGB", (10, 10), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_client_error("put_object", "AccessDenied")
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            files = {"file": ("test.png", img_bytes, "image/png")}
            response = client.post(
                "/api/v1/upload/images", files=files, headers=auth_headers
            )

            stubber.deactivate()

        assert response.status_code == 502
        assert "Upload failed" in response.json()["detail"]

    def test_delete_image_success_owner(self, client, auth_headers):
        """Test successful image deletion by owner."""
        # Fetch current user id
        me = client.get("/api/v1/users/me", headers=auth_headers)
        assert me.status_code == 200
        user_id = me.json()["id"]
        key = f"users/{user_id}/images/test-image.png"

        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_response("delete_object", {}, {"Bucket": ANY, "Key": ANY})
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            response = client.delete(
                f"/api/v1/upload/images/{key}", headers=auth_headers
            )

            stubber.deactivate()

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Deleted"

    def test_delete_image_success_admin(self, client, admin_headers):
        """Test successful image deletion by admin."""
        # Admin tries to delete another user's image
        key = "competitions/other-user-id/test-image.png"

        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_response("delete_object", {}, {"Bucket": ANY, "Key": ANY})
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            response = client.delete(
                f"/api/v1/upload/images/{key}", headers=admin_headers
            )

            stubber.deactivate()

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Deleted"

    def test_delete_image_permission_denied(self, client, auth_headers):
        """Test image deletion permission denied."""
        # User tries to delete another user's image
        key = "competitions/other-user-id/test-image.png"

        response = client.delete(f"/api/v1/upload/images/{key}", headers=auth_headers)

        assert response.status_code == 403
        assert "Permission denied" in response.json()["detail"]

    def test_delete_image_unauthorized(self, client):
        """Test image deletion without authentication."""
        key = "competitions/user123/test-image.png"
        response = client.delete(f"/api/v1/upload/images/{key}")

        # HTTPBearer returns 403 when Authorization header is missing
        assert response.status_code == 403

    def test_delete_image_invalid_key(self, client, admin_headers):
        """Test image deletion with invalid key."""
        # Test with invalid key
        invalid_key = "competitions/user123/../image.png"

        # Use admin so permission is allowed and key validation triggers 400
        response = client.delete(
            f"/api/v1/upload/images/{invalid_key}", headers=admin_headers
        )

        assert response.status_code == 400
        assert "Invalid key" in response.json()["detail"]

    def test_delete_image_s3_error(self, client, admin_headers):
        """Test image deletion when S3 operation fails."""
        key = "competitions/test-user-id/test-image.png"

        with patch("app.core.upload.get_s3_client") as mock_get_client:
            mock_s3_client = get_s3_client()
            stubber = Stubber(mock_s3_client)
            stubber.add_client_error("delete_object", "NoSuchKey")
            stubber.activate()
            mock_get_client.return_value = mock_s3_client

            response = client.delete(
                f"/api/v1/upload/images/{key}", headers=admin_headers
            )

            stubber.deactivate()

        assert response.status_code == 502
        assert "Delete failed" in response.json()["detail"]
