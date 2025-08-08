"""Test dependencies for authentication and authorization."""

import asyncio

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session

from app.api.deps import (
    get_current_active_user,
    get_current_admin_user,
    get_current_user,
)
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    UserNotFoundError,
)
from app.core.security import create_access_token
from app.crud.user import create_user
from app.models.common import UserRole
from app.schemas.auth import UserCreate


def run_async(coro):
    """Helper function to run async coroutines in tests."""
    return asyncio.run(coro)


class TestGetCurrentUser:
    """Test get_current_user dependency."""

    def test_get_current_user_success(self, session: Session):
        """Test successful user retrieval."""
        # Create user
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))

        assert current_user.id == user.id
        assert current_user.email == user.email

    def test_get_current_user_invalid_token(self, session: Session):
        """Test current user with invalid token."""
        # Mock credentials with invalid token
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token"
        )

        # Test dependency
        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)

    def test_get_current_user_expired_token(self, session: Session):
        """Test current user with expired token."""
        # Create user
        user_data = {
            "email": "expired@example.com",
            "full_name": "Expired User",
            "organization": "Expired Org",
            "phone_number": "+1234567890",
            "password": "ExpiredPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        # Create token with very short expiry
        from datetime import timedelta

        token = create_access_token(str(user.id), expires_delta=timedelta(seconds=1))

        # Wait for token to expire
        import time

        time.sleep(2)

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)

    def test_get_current_user_nonexistent_user(self, session: Session):
        """Test current user with token for non-existent user."""
        from uuid import uuid4

        # Create token for non-existent user
        non_existent_user_id = str(uuid4())
        token = create_access_token(non_existent_user_id)

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        with pytest.raises(UserNotFoundError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "User not found" in str(exc_info.value)

    def test_get_current_user_malformed_token(self, session: Session):
        """Test current user with malformed token."""
        # Mock credentials with malformed token
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="not.a.valid.token"
        )

        # Test dependency
        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)


class TestGetCurrentActiveUser:
    """Test get_current_active_user dependency."""

    def test_get_current_active_user_success(self, session: Session):
        """Test successful active user retrieval."""
        # Create active user
        user_data = {
            "email": "active@example.com",
            "full_name": "Active User",
            "organization": "Active Org",
            "phone_number": "+1234567890",
            "password": "ActivePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))
        active_user = run_async(get_current_active_user(current_user))

        assert active_user.id == user.id
        assert active_user.is_active is True

    def test_get_current_active_user_inactive(self, session: Session):
        """Test active user with inactive user."""
        # Create inactive user
        user_data = {
            "email": "inactive@example.com",
            "full_name": "Inactive User",
            "organization": "Inactive Org",
            "phone_number": "+1234567890",
            "password": "InactivePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.is_active = False
        session.add(user)
        session.commit()

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_active_user(current_user))

        assert "Inactive user" in str(exc_info.value)


class TestGetCurrentAdminUser:
    """Test get_current_admin_user dependency."""

    def test_get_current_admin_user_success(self, session: Session):
        """Test successful admin user retrieval."""
        # Create admin user
        user_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.role = UserRole.ADMIN
        session.add(user)
        session.commit()

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))
        active_user = run_async(get_current_active_user(current_user))
        admin_user = run_async(get_current_admin_user(active_user))

        assert admin_user.id == user.id
        assert admin_user.role == UserRole.ADMIN

    def test_get_current_admin_user_creator(self, session: Session):
        """Test admin user with creator role."""
        # Create creator user
        user_data = {
            "email": "creator@example.com",
            "full_name": "Creator User",
            "organization": "Creator Org",
            "phone_number": "+1234567890",
            "password": "CreatorPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        # User is already CREATOR by default

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))
        active_user = run_async(get_current_active_user(current_user))

        with pytest.raises(AuthorizationError) as exc_info:
            run_async(get_current_admin_user(active_user))

        assert "Not enough permissions" in str(exc_info.value)

    def test_get_current_admin_user_inactive(self, session: Session):
        """Test admin user with inactive user."""
        # Create inactive admin user
        user_data = {
            "email": "inactive_admin@example.com",
            "full_name": "Inactive Admin User",
            "organization": "Inactive Admin Org",
            "phone_number": "+1234567890",
            "password": "InactiveAdminPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.role = UserRole.ADMIN
        user.is_active = False
        session.add(user)
        session.commit()

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency
        current_user = run_async(get_current_user(credentials, session))

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_active_user(current_user))

        assert "Inactive user" in str(exc_info.value)


class TestDependencyIntegration:
    """Test dependency integration scenarios."""

    def test_dependency_chain_success(self, session: Session):
        """Test successful dependency chain execution."""
        # Create admin user
        user_data = {
            "email": "chain@example.com",
            "full_name": "Chain User",
            "organization": "Chain Org",
            "phone_number": "+1234567890",
            "password": "ChainPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.role = UserRole.ADMIN
        session.add(user)
        session.commit()

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test full dependency chain
        current_user = run_async(get_current_user(credentials, session))
        active_user = run_async(get_current_active_user(current_user))
        admin_user = run_async(get_current_admin_user(active_user))

        assert admin_user.id == user.id
        assert admin_user.is_active is True
        assert admin_user.role == UserRole.ADMIN

    def test_dependency_chain_with_inactive_user(self, session: Session):
        """Test dependency chain with inactive user."""
        # Create inactive user
        user_data = {
            "email": "inactive_chain@example.com",
            "full_name": "Inactive Chain User",
            "organization": "Inactive Chain Org",
            "phone_number": "+1234567890",
            "password": "InactiveChainPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.is_active = False
        session.add(user)
        session.commit()

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency chain - should fail at active user check
        current_user = run_async(get_current_user(credentials, session))

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_active_user(current_user))

        assert "Inactive user" in str(exc_info.value)

    def test_dependency_chain_with_creator_user(self, session: Session):
        """Test dependency chain with creator user trying to access admin endpoint."""
        # Create creator user
        user_data = {
            "email": "creator_chain@example.com",
            "full_name": "Creator Chain User",
            "organization": "Creator Chain Org",
            "phone_number": "+1234567890",
            "password": "CreatorChainPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        # User is already CREATOR by default

        # Create token
        token = create_access_token(str(user.id))

        # Mock credentials
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Test dependency chain - should fail at admin check
        current_user = run_async(get_current_user(credentials, session))
        active_user = run_async(get_current_active_user(current_user))

        with pytest.raises(AuthorizationError) as exc_info:
            run_async(get_current_admin_user(active_user))

        assert "Not enough permissions" in str(exc_info.value)


class TestDependencyErrorHandling:
    """Test dependency error handling."""

    def test_missing_authorization_header(self, session: Session):
        """Test dependency with missing authorization header."""
        # This would be handled by FastAPI's security dependency
        # We test the internal logic by passing invalid credentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token"
        )

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)

    def test_empty_token(self, session: Session):
        """Test dependency with empty token."""
        # Mock credentials with empty token
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="")

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)

    def test_none_token(self, session: Session):
        """Test dependency with None token."""
        # This test is not valid since HTTPAuthorizationCredentials doesn't allow None
        # Instead, test with malformed token
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="not.a.valid.token"
        )

        with pytest.raises(AuthenticationError) as exc_info:
            run_async(get_current_user(credentials, session))

        assert "Could not validate credentials" in str(exc_info.value)
