"""Tests for authentication routes."""

from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import create_password_reset_token
from app.crud.user import create_user
from app.models.common import UserRole
from app.schemas.auth import UserCreate


class TestAuthSignup:
    """Test user registration endpoint."""

    def test_signup_success(self, client: TestClient, session: Session):
        """Test successful user registration."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        response = client.post("/api/v1/auth/signup", json=user_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["organization"] == user_data["organization"]
        assert data["phone_number"] == user_data["phone_number"]
        assert data["role"] == UserRole.CREATOR.value
        assert data["is_active"] is True
        assert "hashed_password" not in data

    def test_signup_duplicate_email(self, client: TestClient, session: Session):
        """Test registration with existing email."""
        user_data = {
            "email": "duplicate@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        # Create first user
        client.post("/api/v1/auth/signup", json=user_data)

        # Try to create second user with same email
        response = client.post("/api/v1/auth/signup", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]

    def test_signup_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        user_data = {
            "email": "invalid-email",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        response = client.post("/api/v1/auth/signup", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_signup_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "weak",
        }

        response = client.post("/api/v1/auth/signup", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_signup_invalid_phone(self, client: TestClient):
        """Test registration with invalid phone number."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "invalid-phone",
            "password": "TestPass123",
        }

        response = client.post("/api/v1/auth/signup", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestAuthLogin:
    """Test user login endpoint."""

    def test_login_success(self, client: TestClient, session: Session):
        """Test successful login."""
        # Create user first
        user_data = {
            "email": "login@example.com",
            "full_name": "Login User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        # Login
        login_data = {"email": "login@example.com", "password": "TestPass123"}
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == user_data["email"]

    def test_login_invalid_credentials(self, client: TestClient, session: Session):
        """Test login with invalid credentials."""
        # Create user first
        user_data = {
            "email": "login@example.com",
            "full_name": "Login User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        # Try to login with wrong password
        login_data = {"email": "login@example.com", "password": "WrongPass123"}
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        login_data = {"email": "nonexistent@example.com", "password": "TestPass123"}
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_inactive_user(self, client: TestClient, session: Session):
        """Test login with inactive user."""
        # Create user directly in database with inactive status
        user_data = {
            "email": "inactive@example.com",
            "full_name": "Inactive User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.is_active = False
        session.add(user)
        session.commit()

        # Try to login
        login_data = {"email": "inactive@example.com", "password": "TestPass123"}
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]


class TestAuthPasswordReset:
    """Test password reset functionality."""

    def test_forgot_password_success(self, client: TestClient, session: Session):
        """Test successful password reset request."""
        # Create user first
        user_data = {
            "email": "reset@example.com",
            "full_name": "Reset User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        # Request password reset
        reset_data = {"email": "reset@example.com"}
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)

        assert response.status_code == status.HTTP_200_OK
        assert "password reset link has been sent" in response.json()["message"]

    def test_forgot_password_nonexistent_user(self, client: TestClient):
        """Test password reset request for non-existent user."""
        reset_data = {"email": "nonexistent@example.com"}
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)

        # Should return success to prevent email enumeration
        assert response.status_code == status.HTTP_200_OK
        assert "password reset link has been sent" in response.json()["message"]

    def test_reset_password_success(self, client: TestClient, session: Session):
        """Test successful password reset."""
        # Create user first
        user_data = {
            "email": "reset@example.com",
            "full_name": "Reset User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        # Generate reset token
        reset_token = create_password_reset_token("reset@example.com")

        # Reset password
        reset_data = {"token": reset_token, "new_password": "NewPass123"}
        response = client.post("/api/v1/auth/reset-password", json=reset_data)

        assert response.status_code == status.HTTP_200_OK
        assert "Password has been reset successfully" in response.json()["message"]

    def test_reset_password_invalid_token(self, client: TestClient):
        """Test password reset with invalid token."""
        reset_data = {"token": "invalid-token", "new_password": "NewPass123"}
        response = client.post("/api/v1/auth/reset-password", json=reset_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid or expired reset token" in response.json()["detail"]

    def test_reset_password_weak_password(self, client: TestClient, session: Session):
        """Test password reset with weak password."""
        # Create user first
        user_data = {
            "email": "reset@example.com",
            "full_name": "Reset User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        # Generate reset token
        reset_token = create_password_reset_token("reset@example.com")

        # Try to reset with weak password
        reset_data = {"token": reset_token, "new_password": "weak"}
        response = client.post("/api/v1/auth/reset-password", json=reset_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestAuthCurrentUser:
    """Test current user endpoint."""

    def test_get_current_user_success(self, client: TestClient, session: Session):
        """Test successful current user retrieval."""
        # Create and login user
        user_data = {
            "email": "current@example.com",
            "full_name": "Current User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        client.post("/api/v1/auth/signup", json=user_data)

        login_data = {"email": "current@example.com", "password": "TestPass123"}
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]

        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]

    def test_get_current_user_no_token(self, client: TestClient):
        """Test current user without token."""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test current user with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
