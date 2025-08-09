"""Tests for Pydantic schemas."""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.common import CompetitionFormat, CompetitionScale, UserRole
from app.schemas.auth import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionFilterParams,
    CompetitionListResponse,
    CompetitionResponse,
    CompetitionUpdate,
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


class TestCompetitionSchemas:
    """Test competition schema validation and serialization."""

    def _future_deadline(self, days: int = 10) -> datetime:
        return datetime.now(timezone.utc) + timedelta(days=days)

    def _valid_competition_data(self, **overrides):
        """Create valid competition data for testing."""
        data = {
            "title": "Test Competition",
            "introduction": "A test competition for testing.",
            "overview": "This is a comprehensive overview of the test competition.",
            "question_type": "Multiple Choice",
            "selection_process": "Online Test",
            "history": "Established in 2024",
            "scoring_and_format": "100 points total",
            "awards": "Gold, Silver, Bronze medals",
            "penalties_and_bans": "No cheating allowed",
            "notable_achievements": "Previous winners from top universities",
            "competition_link": "https://example.com/competition",
            "background_image_url": "https://example.com/bg.jpg",
            "detail_image_urls": [
                "https://example.com/d1.jpg",
                "https://example.com/d2.jpg",
            ],
            "location": "Test City",
            "format": CompetitionFormat.ONLINE,
            "scale": CompetitionScale.REGIONAL,
            "registration_deadline": self._future_deadline(30),
            "size": 100,
            "target_age_min": 16,
            "target_age_max": 20,
        }
        data.update(overrides)
        return data

    def test_competition_create_valid(self):
        """Test valid competition creation."""
        data = self._valid_competition_data()
        competition = CompetitionCreate(**data)

        assert competition.title == data["title"]
        assert competition.introduction == data["introduction"]
        assert competition.overview == data["overview"]
        assert competition.question_type == data["question_type"]
        assert competition.detail_image_urls == data["detail_image_urls"]

    def test_competition_create_with_overview(self):
        """Test competition creation with overview field."""
        data = self._valid_competition_data(
            overview="This is a comprehensive overview of the competition."
        )
        competition = CompetitionCreate(**data)

        assert (
            competition.overview
            == "This is a comprehensive overview of the competition."
        )

    def test_competition_create_without_overview(self):
        """Test competition creation without overview field."""
        data = self._valid_competition_data()
        del data["overview"]  # Remove overview field
        competition = CompetitionCreate(**data)

        assert competition.overview is None

    def test_competition_create_invalid_deadline(self):
        """Test competition creation with past deadline."""
        data = self._valid_competition_data(
            registration_deadline=datetime.now(timezone.utc) - timedelta(days=1)
        )

        with pytest.raises(ValidationError) as exc_info:
            CompetitionCreate(**data)

        assert "Registration deadline must be in the future" in str(exc_info.value)

    def test_competition_create_invalid_age_range(self):
        """Test competition creation with invalid age range."""
        data = self._valid_competition_data(target_age_min=20, target_age_max=15)

        with pytest.raises(ValidationError) as exc_info:
            CompetitionCreate(**data)

        assert "Maximum age must be greater than minimum age" in str(exc_info.value)

    def test_competition_create_invalid_urls(self):
        """Test competition creation with invalid URLs."""
        data = self._valid_competition_data(
            competition_link="ftp://bad.example", background_image_url="not-http"
        )

        with pytest.raises(ValidationError) as exc_info:
            CompetitionCreate(**data)

        error_str = str(exc_info.value)
        assert "URL must start with http:// or https://" in error_str

    def test_competition_create_invalid_detail_image_urls(self):
        """Test competition creation with invalid detail image URLs."""
        data = self._valid_competition_data(
            detail_image_urls=["https://good.com/image.jpg", "ftp://bad.com/image.jpg"]
        )

        with pytest.raises(ValidationError) as exc_info:
            CompetitionCreate(**data)

        assert "URL must start with http:// or https://" in str(exc_info.value)

    def test_competition_update_valid(self):
        """Test valid competition update."""
        data = {
            "title": "Updated Competition",
            "overview": "Updated overview content",
            "introduction": "Updated introduction",
        }
        competition = CompetitionUpdate(**data)

        assert competition.title == "Updated Competition"
        assert competition.overview == "Updated overview content"
        assert competition.introduction == "Updated introduction"

    def test_competition_update_partial(self):
        """Test partial competition update."""
        data = {"title": "Only Title Update"}
        competition = CompetitionUpdate(**data)

        assert competition.title == "Only Title Update"
        assert competition.overview is None
        assert competition.introduction is None

    def test_competition_update_invalid_deadline(self):
        """Test competition update with past deadline."""
        data = {"registration_deadline": datetime.now(timezone.utc) - timedelta(days=1)}

        with pytest.raises(ValidationError) as exc_info:
            CompetitionUpdate(**data)

        assert "Registration deadline must be in the future" in str(exc_info.value)

    def test_competition_response_serialization(self):
        """Test competition response serialization."""
        from uuid import uuid4

        # Create a mock competition object
        class MockCompetition:
            def __init__(self):
                self.id = uuid4()
                self.title = "Test Competition"
                self.introduction = "Test introduction"
                self.overview = "Test overview"
                self.question_type = "Multiple Choice"
                self.selection_process = "Online Test"
                self.history = "Established in 2024"
                self.scoring_and_format = "100 points total"
                self.awards = "Gold, Silver, Bronze"
                self.penalties_and_bans = "No cheating"
                self.notable_achievements = "Previous winners"
                self.competition_link = "https://example.com"
                self.background_image_url = "https://example.com/bg.jpg"
                self.detail_image_urls = '["https://example.com/d1.jpg"]'
                self.location = "Test City"
                self.format = CompetitionFormat.ONLINE
                self.scale = CompetitionScale.REGIONAL
                # Use future timestamp directly
                self.registration_deadline = datetime.now(timezone.utc) + timedelta(
                    days=30
                )
                self.size = 100
                self.target_age_min = 16
                self.target_age_max = 20
                self.is_active = True
                self.is_featured = False
                self.is_approved = True
                self.owner_id = uuid4()
                self.created_at = datetime.now(timezone.utc)
                self.updated_at = None

        mock_competition = MockCompetition()
        response = CompetitionResponse.model_validate(mock_competition)

        assert response.title == "Test Competition"
        assert response.overview == "Test overview"
        assert response.detail_image_urls == ["https://example.com/d1.jpg"]
        dumped = response.model_dump()
        assert isinstance(dumped["id"], str)
        assert isinstance(dumped["owner_id"], str)

    def test_competition_list_response_serialization(self):
        """Test competition list response serialization."""
        from uuid import uuid4

        # Create a mock competition object
        class MockCompetition:
            def __init__(self):
                self.id = uuid4()
                self.title = "Test Competition"
                self.introduction = "Test introduction"
                self.overview = "Test overview"
                self.question_type = "Multiple Choice"
                self.selection_process = "Online Test"
                self.history = "Established in 2024"
                self.scoring_and_format = "100 points total"
                self.awards = "Gold, Silver, Bronze"
                self.penalties_and_bans = "No cheating"
                self.notable_achievements = "Previous winners"
                self.competition_link = "https://example.com"
                self.background_image_url = "https://example.com/bg.jpg"
                self.detail_image_urls = '["https://example.com/d1.jpg"]'
                self.location = "Test City"
                self.format = CompetitionFormat.ONLINE
                self.scale = CompetitionScale.REGIONAL
                self.registration_deadline = datetime.now(timezone.utc) + timedelta(
                    days=30
                )
                self.size = 100
                self.target_age_min = 16
                self.target_age_max = 20
                self.is_featured = False
                self.is_approved = True
                self.owner_id = uuid4()
                self.created_at = datetime.now(timezone.utc)

        mock_competition = MockCompetition()
        response = CompetitionListResponse.model_validate(mock_competition)

        assert response.title == "Test Competition"
        assert response.overview == "Test overview"
        assert response.detail_image_urls == ["https://example.com/d1.jpg"]
        dumped = response.model_dump()
        assert isinstance(dumped["id"], str)
        assert isinstance(dumped["owner_id"], str)

    def test_competition_filter_params(self):
        """Test competition filter parameters."""
        # Test valid filter params
        params = {
            "skip": 0,
            "limit": 100,
            "format": CompetitionFormat.ONLINE,
            "scale": CompetitionScale.REGIONAL,
            "location": "Test City",
            "search": "test",
            "sort_by": "title",
            "order": "asc",
        }
        filter_params = CompetitionFilterParams(**params)

        assert filter_params.skip == 0
        assert filter_params.limit == 100
        assert filter_params.format == CompetitionFormat.ONLINE
        assert filter_params.scale == CompetitionScale.REGIONAL
        assert filter_params.location == "Test City"
        assert filter_params.search == "test"
        assert filter_params.sort_by == "title"
        assert filter_params.order == "asc"

    def test_competition_filter_params_defaults(self):
        """Test competition filter parameters with defaults."""
        filter_params = CompetitionFilterParams()

        assert filter_params.skip == 0
        assert filter_params.limit == 100
        assert filter_params.format is None
        assert filter_params.scale is None
        assert filter_params.location is None
        assert filter_params.search is None
        assert filter_params.sort_by is None
        assert filter_params.order is None

    def test_competition_filter_params_invalid_limit(self):
        """Test competition filter parameters with invalid limit."""
        with pytest.raises(ValidationError):
            CompetitionFilterParams(limit=0)  # Must be >= 1

        with pytest.raises(ValidationError):
            CompetitionFilterParams(limit=1001)  # Must be <= 1000

    def test_competition_filter_params_invalid_skip(self):
        """Test competition filter parameters with invalid skip."""
        with pytest.raises(ValidationError):
            CompetitionFilterParams(skip=-1)  # Must be >= 0

    def test_competition_filter_params_invalid_sort_by(self):
        """Test competition filter parameters with invalid sort_by."""
        with pytest.raises(ValidationError):
            CompetitionFilterParams(sort_by="invalid_field")

    def test_competition_filter_params_invalid_order(self):
        """Test competition filter parameters with invalid order."""
        with pytest.raises(ValidationError):
            CompetitionFilterParams(order="invalid_order")

    def test_competition_create_minimal_valid(self):
        """Test competition creation with minimal required fields."""
        data = {
            "title": "Minimal Competition",
            "registration_deadline": self._future_deadline(30),
        }
        competition = CompetitionCreate(**data)

        assert competition.title == "Minimal Competition"
        assert competition.introduction is None
        assert competition.overview is None
        assert competition.detail_image_urls == []

    def test_competition_create_with_empty_overview(self):
        """Test competition creation with empty overview."""
        data = self._valid_competition_data(overview="")
        competition = CompetitionCreate(**data)

        assert competition.overview == ""

    def test_competition_create_with_none_overview(self):
        """Test competition creation with None overview."""
        data = self._valid_competition_data(overview=None)
        competition = CompetitionCreate(**data)

        assert competition.overview is None

    def test_competition_update_with_overview_changes(self):
        """Test competition update with overview field changes."""
        # Test setting overview
        data = {"overview": "New overview content"}
        competition = CompetitionUpdate(**data)
        assert competition.overview == "New overview content"

        # Test clearing overview
        data = {"overview": None}
        competition = CompetitionUpdate(**data)
        assert competition.overview is None

        # Test updating overview
        data = {"overview": "Updated overview content"}
        competition = CompetitionUpdate(**data)
        assert competition.overview == "Updated overview content"

    def test_competition_create_with_large_overview(self):
        """Test competition creation with large overview text."""
        large_overview = "A" * 2000  # Maximum allowed length
        data = self._valid_competition_data(overview=large_overview)
        competition = CompetitionCreate(**data)

        assert competition.overview == large_overview

    def test_competition_create_with_too_large_overview(self):
        """Test competition creation with overview exceeding max length."""
        too_large_overview = "A" * 2001  # Exceeds maximum length
        data = self._valid_competition_data(overview=too_large_overview)

        with pytest.raises(ValidationError) as exc_info:
            CompetitionCreate(**data)

        assert "String should have at most 2000 characters" in str(exc_info.value)

    def test_competition_response_with_overview_field(self):
        """Test that competition response includes overview field."""
        from uuid import uuid4

        class MockCompetition:
            def __init__(self):
                self.id = uuid4()
                self.title = "Test Competition"
                self.introduction = "Test introduction"
                self.overview = "Test overview content"
                self.question_type = "Multiple Choice"
                self.selection_process = "Online Test"
                self.history = "Established in 2024"
                self.scoring_and_format = "100 points total"
                self.awards = "Gold, Silver, Bronze"
                self.penalties_and_bans = "No cheating"
                self.notable_achievements = "Previous winners"
                self.competition_link = "https://example.com"
                self.background_image_url = "https://example.com/bg.jpg"
                self.detail_image_urls = '["https://example.com/d1.jpg"]'
                self.location = "Test City"
                self.format = CompetitionFormat.ONLINE
                self.scale = CompetitionScale.REGIONAL
                self.registration_deadline = datetime.now(timezone.utc) + timedelta(
                    days=30
                )
                self.size = 100
                self.target_age_min = 16
                self.target_age_max = 20
                self.is_active = True
                self.is_featured = False
                self.is_approved = True
                self.owner_id = uuid4()
                self.created_at = datetime.now(timezone.utc)
                self.updated_at = None

        mock_competition = MockCompetition()
        response = CompetitionResponse.model_validate(mock_competition)

        assert hasattr(response, "overview")
        assert response.overview == "Test overview content"

    def test_competition_list_response_with_overview_field(self):
        """Test that competition list response includes overview field."""
        from uuid import uuid4

        class MockCompetition:
            def __init__(self):
                self.id = uuid4()
                self.title = "Test Competition"
                self.introduction = "Test introduction"
                self.overview = "Test overview content"
                self.question_type = "Multiple Choice"
                self.selection_process = "Online Test"
                self.history = "Established in 2024"
                self.scoring_and_format = "100 points total"
                self.awards = "Gold, Silver, Bronze"
                self.penalties_and_bans = "No cheating"
                self.notable_achievements = "Previous winners"
                self.competition_link = "https://example.com"
                self.background_image_url = "https://example.com/bg.jpg"
                self.detail_image_urls = '["https://example.com/d1.jpg"]'
                self.location = "Test City"
                self.format = CompetitionFormat.ONLINE
                self.scale = CompetitionScale.REGIONAL
                self.registration_deadline = datetime.now(timezone.utc) + timedelta(
                    days=30
                )
                self.size = 100
                self.target_age_min = 16
                self.target_age_max = 20
                self.is_featured = False
                self.is_approved = True
                self.owner_id = uuid4()
                self.created_at = datetime.now(timezone.utc)

        mock_competition = MockCompetition()
        response = CompetitionListResponse.model_validate(mock_competition)

        assert hasattr(response, "overview")
        assert response.overview == "Test overview content"
