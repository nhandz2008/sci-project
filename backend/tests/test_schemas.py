"""Tests for Pydantic schemas."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.common import UserRole
from app.schemas.auth import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.schemas.user import (
    PasswordChange,
    UserDetailResponse,
    UserListPaginatedResponse,
    UserUpdate,
)


class TestUserCreateSchema:
    """Test UserCreate schema validation."""

    def test_user_create_valid(self):
        """Test valid user creation data."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        user_create = UserCreate(**user_data)

        assert user_create.email == user_data["email"]
        assert user_create.full_name == user_data["full_name"]
        assert user_create.organization == user_data["organization"]
        assert user_create.phone_number == user_data["phone_number"]
        assert user_create.password == user_data["password"]

    def test_user_create_invalid_email(self):
        """Test user creation with invalid email."""
        user_data = {
            "email": "invalid-email",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)

    def test_user_create_weak_password(self):
        """Test user creation with weak password."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "weak",
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)

    def test_user_create_invalid_phone(self):
        """Test user creation with invalid phone number."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "invalid-phone",
            "password": "TestPass123",
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)

    def test_user_create_empty_fields(self):
        """Test user creation with empty required fields."""
        user_data = {
            "email": "test@example.com",
            "full_name": "",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)

    def test_user_create_long_fields(self):
        """Test user creation with fields exceeding max length."""
        user_data = {
            "email": "test@example.com",
            "full_name": "A" * 101,  # Exceeds max_length=100
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)


class TestUserLoginSchema:
    """Test UserLogin schema validation."""

    def test_user_login_valid(self):
        """Test valid user login data."""
        login_data = {"email": "test@example.com", "password": "TestPass123"}

        user_login = UserLogin(**login_data)

        assert user_login.email == login_data["email"]
        assert user_login.password == login_data["password"]

    def test_user_login_invalid_email(self):
        """Test user login with invalid email."""
        login_data = {"email": "invalid-email", "password": "TestPass123"}

        with pytest.raises(ValidationError):
            UserLogin(**login_data)

    def test_user_login_empty_password(self):
        """Test user login with empty password."""
        login_data = {"email": "test@example.com", "password": ""}

        # This should be valid as password is not validated for length in login
        user_login = UserLogin(**login_data)
        assert user_login.password == ""


class TestUserResponseSchema:
    """Test UserResponse schema validation."""

    def test_user_response_valid(self):
        """Test valid user response data."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        user_response = UserResponse(**user_data)

        assert user_response.id == user_id
        assert user_response.email == user_data["email"]
        assert user_response.full_name == user_data["full_name"]
        assert user_response.organization == user_data["organization"]
        assert user_response.phone_number == user_data["phone_number"]
        assert user_response.role == UserRole.CREATOR
        assert user_response.is_active is True
        assert user_response.created_at == now
        assert user_response.updated_at is None

    def test_user_response_from_attributes(self):
        """Test user response creation from model attributes."""
        from app.models.user import User

        # Create a mock user object
        user = User(
            id=uuid4(),
            email="test@example.com",
            full_name="Test User",
            organization="Test Org",
            phone_number="+1234567890",
            role=UserRole.CREATOR,
            hashed_password="hashed_password",
            is_active=True,
            created_at=datetime.now(),
            updated_at=None,
        )

        user_response = UserResponse.model_validate(user)

        assert user_response.id == user.id
        assert user_response.email == user.email
        assert user_response.full_name == user.full_name
        assert user_response.organization == user.organization
        assert user_response.phone_number == user.phone_number
        assert user_response.role == user.role
        assert user_response.is_active == user.is_active


class TestTokenResponseSchema:
    """Test TokenResponse schema validation."""

    def test_token_response_valid(self):
        """Test valid token response data."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        token_data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "user": UserResponse(**user_data),
        }

        token_response = TokenResponse(**token_data)

        assert token_response.access_token == token_data["access_token"]
        assert token_response.token_type == "bearer"
        assert token_response.user.id == user_id
        assert token_response.user.email == user_data["email"]

    def test_token_response_default_token_type(self):
        """Test token response with default token type."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        token_data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "user": UserResponse(**user_data),
        }

        token_response = TokenResponse(**token_data)

        assert token_response.token_type == "bearer"


class TestPasswordResetSchemas:
    """Test password reset schemas."""

    def test_password_reset_request_valid(self):
        """Test valid password reset request."""
        request_data = {"email": "test@example.com"}

        reset_request = PasswordResetRequest(**request_data)

        assert reset_request.email == request_data["email"]

    def test_password_reset_request_invalid_email(self):
        """Test password reset request with invalid email."""
        request_data = {"email": "invalid-email"}

        with pytest.raises(ValidationError):
            PasswordResetRequest(**request_data)

    def test_password_reset_confirm_valid(self):
        """Test valid password reset confirmation."""
        confirm_data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "new_password": "NewPass123",
        }

        reset_confirm = PasswordResetConfirm(**confirm_data)

        assert reset_confirm.token == confirm_data["token"]
        assert reset_confirm.new_password == confirm_data["new_password"]

    def test_password_reset_confirm_weak_password(self):
        """Test password reset confirmation with weak password."""
        confirm_data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "new_password": "weak",
        }

        with pytest.raises(ValidationError):
            PasswordResetConfirm(**confirm_data)


class TestMessageResponseSchema:
    """Test MessageResponse schema validation."""

    def test_message_response_valid(self):
        """Test valid message response."""
        message_data = {"message": "Operation completed successfully"}

        message_response = MessageResponse(**message_data)

        assert message_response.message == message_data["message"]

    def test_message_response_empty_message(self):
        """Test message response with empty message."""
        message_data = {"message": ""}

        message_response = MessageResponse(**message_data)

        assert message_response.message == ""


class TestUserUpdateSchema:
    """Test UserUpdate schema validation."""

    def test_user_update_valid(self):
        """Test valid user update data."""
        update_data = {
            "full_name": "Updated Name",
            "organization": "Updated Org",
            "phone_number": "+1987654321",  # Valid phone number format
        }

        user_update = UserUpdate(**update_data)

        assert user_update.full_name == update_data["full_name"]
        assert user_update.organization == update_data["organization"]
        assert user_update.phone_number == update_data["phone_number"]

    def test_user_update_partial(self):
        """Test partial user update data."""
        update_data = {"full_name": "Updated Name"}

        user_update = UserUpdate(**update_data)

        assert user_update.full_name == update_data["full_name"]
        assert user_update.organization is None
        assert user_update.phone_number is None

    def test_user_update_invalid_phone(self):
        """Test user update with invalid phone number."""
        update_data = {"full_name": "Updated Name", "phone_number": "invalid-phone"}

        with pytest.raises(ValidationError):
            UserUpdate(**update_data)

    def test_user_update_long_fields(self):
        """Test user update with fields exceeding max length."""
        update_data = {
            "full_name": "A" * 101,  # Exceeds max_length=100
            "organization": "Updated Org",
        }

        with pytest.raises(ValidationError):
            UserUpdate(**update_data)


class TestPasswordChangeSchema:
    """Test PasswordChange schema validation."""

    def test_password_change_valid(self):
        """Test valid password change data."""
        password_data = {"current_password": "OldPass123", "new_password": "NewPass123"}

        password_change = PasswordChange(**password_data)

        assert password_change.current_password == password_data["current_password"]
        assert password_change.new_password == password_data["new_password"]

    def test_password_change_weak_new_password(self):
        """Test password change with weak new password."""
        password_data = {"current_password": "OldPass123", "new_password": "weak"}

        with pytest.raises(ValidationError):
            PasswordChange(**password_data)

    def test_password_change_empty_passwords(self):
        """Test password change with empty passwords."""
        password_data = {"current_password": "", "new_password": "NewPass123"}

        password_change = PasswordChange(**password_data)

        assert password_change.current_password == ""
        assert password_change.new_password == "NewPass123"


class TestUserDetailResponseSchema:
    """Test UserDetailResponse schema validation."""

    def test_user_detail_response_valid(self):
        """Test valid user detail response data."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        user_detail_response = UserDetailResponse(**user_data)

        assert user_detail_response.id == user_id
        assert user_detail_response.email == user_data["email"]
        assert user_detail_response.full_name == user_data["full_name"]
        assert user_detail_response.organization == user_data["organization"]
        assert user_detail_response.phone_number == user_data["phone_number"]
        assert user_detail_response.role == UserRole.CREATOR
        assert user_detail_response.is_active is True
        assert user_detail_response.created_at == now
        assert user_detail_response.updated_at is None


class TestUserListPaginatedResponseSchema:
    """Test UserListPaginatedResponse schema validation."""

    def test_user_list_paginated_response_valid(self):
        """Test valid user list paginated response data."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        list_data = {
            "users": [UserResponse(**user_data)],
            "total": 1,
            "skip": 0,
            "limit": 10,
        }

        user_list_response = UserListPaginatedResponse(**list_data)

        assert len(user_list_response.users) == 1
        assert user_list_response.total == 1
        assert user_list_response.skip == 0
        assert user_list_response.limit == 10
        assert user_list_response.users[0].id == user_id

    def test_user_list_paginated_response_empty(self):
        """Test user list paginated response with empty users."""
        list_data = {"users": [], "total": 0, "skip": 0, "limit": 10}

        user_list_response = UserListPaginatedResponse(**list_data)

        assert len(user_list_response.users) == 0
        assert user_list_response.total == 0
        assert user_list_response.skip == 0
        assert user_list_response.limit == 10


class TestSchemaSerialization:
    """Test schema serialization and deserialization."""

    def test_user_create_serialization(self):
        """Test UserCreate schema serialization."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }

        user_create = UserCreate(**user_data)
        serialized = user_create.model_dump()

        assert serialized["email"] == user_data["email"]
        assert serialized["full_name"] == user_data["full_name"]
        assert serialized["organization"] == user_data["organization"]
        assert serialized["phone_number"] == user_data["phone_number"]
        assert serialized["password"] == user_data["password"]

    def test_user_response_serialization(self):
        """Test UserResponse schema serialization."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        user_response = UserResponse(**user_data)
        serialized = user_response.model_dump()

        assert serialized["id"] == str(user_id)
        assert serialized["email"] == user_data["email"]
        assert serialized["full_name"] == user_data["full_name"]
        assert serialized["organization"] == user_data["organization"]
        assert serialized["phone_number"] == user_data["phone_number"]
        assert serialized["role"] == UserRole.CREATOR.value
        assert serialized["is_active"] is True

    def test_token_response_serialization(self):
        """Test TokenResponse schema serialization."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        token_data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "user": UserResponse(**user_data),
        }

        token_response = TokenResponse(**token_data)
        serialized = token_response.model_dump()

        assert serialized["access_token"] == token_data["access_token"]
        assert serialized["token_type"] == "bearer"
        assert "user" in serialized
        assert serialized["user"]["id"] == str(user_id)
        assert serialized["user"]["email"] == user_data["email"]


class TestSchemaEdgeCases:
    """Test schema edge cases and error conditions."""

    def test_user_create_missing_required_fields(self):
        """Test user creation with missing required fields."""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            # Missing organization, phone_number, password
        }

        with pytest.raises(ValidationError):
            UserCreate(**user_data)

    def test_user_update_all_none(self):
        """Test user update with all fields as None."""
        update_data = {"full_name": None, "organization": None, "phone_number": None}

        user_update = UserUpdate(**update_data)

        assert user_update.full_name is None
        assert user_update.organization is None
        assert user_update.phone_number is None

    def test_password_change_same_passwords(self):
        """Test password change with same current and new password."""
        password_data = {
            "current_password": "SamePass123",
            "new_password": "SamePass123",
        }

        password_change = PasswordChange(**password_data)

        assert password_change.current_password == password_data["current_password"]
        assert password_change.new_password == password_data["new_password"]

    def test_user_response_with_unicode(self):
        """Test user response with unicode characters."""
        user_id = uuid4()
        now = datetime.now()

        user_data = {
            "id": user_id,
            "email": "test🚀@example.com",
            "full_name": "Test User🌟",
            "organization": "Test Org🚀",
            "phone_number": "+1234567890",
            "role": UserRole.CREATOR,
            "is_active": True,
            "created_at": now,
            "updated_at": None,
        }

        user_response = UserResponse(**user_data)

        assert user_response.email == user_data["email"]
        assert user_response.full_name == user_data["full_name"]
        assert user_response.organization == user_data["organization"]
