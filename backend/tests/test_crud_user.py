"""Tests for user CRUD operations."""

import pytest
from sqlmodel import Session

from app.core.exceptions import DuplicateUserError, UserNotFoundError
from app.core.security import verify_password
from app.crud.user import (
    activate_user,
    authenticate_user,
    change_user_role,
    create_user,
    deactivate_user,
    delete_user,
    get_active_users,
    get_inactive_users,
    get_user_by_email,
    get_user_by_id,
    get_user_count,
    get_users,
    get_users_by_role,
    search_users_by_name,
    update_user,
    update_user_password,
)
from app.models.common import UserRole
from app.schemas.auth import UserCreate
from app.schemas.user import UserUpdate


class TestUserCreate:
    """Test user creation operations."""

    def test_create_user_success(self, session: Session):
        """Test successful user creation."""
        user_data = {
            "email": "create@example.com",
            "full_name": "Create User",
            "organization": "Create Org",
            "phone_number": "+1234567890",
            "password": "CreatePass123",
        }
        user_create = UserCreate(**user_data)

        user = create_user(session, user_create)

        assert user.email == user_data["email"]
        assert user.full_name == user_data["full_name"]
        assert user.organization == user_data["organization"]
        assert user.phone_number == user_data["phone_number"]
        assert user.role == UserRole.CREATOR
        assert user.is_active is True
        assert verify_password(user_data["password"], user.hashed_password)

    def test_create_user_duplicate_email(self, session: Session):
        """Test user creation with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "full_name": "Duplicate User",
            "organization": "Duplicate Org",
            "phone_number": "+1234567890",
            "password": "DuplicatePass123",
        }
        user_create = UserCreate(**user_data)

        # Create first user
        create_user(session, user_create)

        # Try to create second user with same email
        with pytest.raises(DuplicateUserError) as exc_info:
            create_user(session, user_create)

        assert "already exists" in str(exc_info.value)


class TestUserRead:
    """Test user read operations."""

    def test_get_user_by_email_success(self, session: Session):
        """Test successful user retrieval by email."""
        user_data = {
            "email": "read@example.com",
            "full_name": "Read User",
            "organization": "Read Org",
            "phone_number": "+1234567890",
            "password": "ReadPass123",
        }
        user_create = UserCreate(**user_data)
        created_user = create_user(session, user_create)

        retrieved_user = get_user_by_email(session, user_data["email"])

        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == user_data["email"]

    def test_get_user_by_email_not_found(self, session: Session):
        """Test user retrieval by non-existent email."""
        user = get_user_by_email(session, "nonexistent@example.com")

        assert user is None

    def test_get_user_by_id_success(self, session: Session):
        """Test successful user retrieval by ID."""
        user_data = {
            "email": "readid@example.com",
            "full_name": "Read ID User",
            "organization": "Read ID Org",
            "phone_number": "+1234567890",
            "password": "ReadIDPass123",
        }
        user_create = UserCreate(**user_data)
        created_user = create_user(session, user_create)

        retrieved_user = get_user_by_id(session, created_user.id)

        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == user_data["email"]

    def test_get_user_by_id_not_found(self, session: Session):
        """Test user retrieval by non-existent ID."""
        from uuid import uuid4

        user = get_user_by_id(session, uuid4())

        assert user is None


class TestUserUpdate:
    """Test user update operations."""

    def test_update_user_success(self, session: Session):
        """Test successful user update."""
        user_data = {
            "email": "update@example.com",
            "full_name": "Update User",
            "organization": "Update Org",
            "phone_number": "+1234567890",
            "password": "UpdatePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        update_data = UserUpdate(
            full_name="Updated Name",
            organization="Updated Org",
            phone_number="+1987654321",  # Valid phone number format
        )

        updated_user = update_user(session, user, update_data)

        assert updated_user.full_name == "Updated Name"
        assert updated_user.organization == "Updated Org"
        assert updated_user.phone_number == "+1987654321"

    def test_update_user_partial(self, session: Session):
        """Test partial user update."""
        user_data = {
            "email": "partial@example.com",
            "full_name": "Partial User",
            "organization": "Partial Org",
            "phone_number": "+1234567890",
            "password": "PartialPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        update_data = UserUpdate(full_name="New Name")

        updated_user = update_user(session, user, update_data)

        assert updated_user.full_name == "New Name"
        assert updated_user.organization == user_data["organization"]  # Unchanged
        assert updated_user.phone_number == user_data["phone_number"]  # Unchanged

    def test_update_user_password_success(self, session: Session):
        """Test successful password update."""
        user_data = {
            "email": "password@example.com",
            "full_name": "Password User",
            "organization": "Password Org",
            "phone_number": "+1234567890",
            "password": "OldPass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        new_password = "NewPass123"
        updated_user = update_user_password(session, user, new_password)

        assert verify_password(new_password, updated_user.hashed_password)
        assert not verify_password(user_data["password"], updated_user.hashed_password)


class TestUserDelete:
    """Test user delete operations."""

    def test_delete_user_success(self, session: Session):
        """Test successful user deletion."""
        user_data = {
            "email": "delete@example.com",
            "full_name": "Delete User",
            "organization": "Delete Org",
            "phone_number": "+1234567890",
            "password": "DeletePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        result = delete_user(session, user.id)

        assert result is True

        # Verify user is deleted
        deleted_user = get_user_by_id(session, user.id)
        assert deleted_user is None

    def test_delete_user_not_found(self, session: Session):
        """Test user deletion with non-existent user."""
        from uuid import uuid4

        with pytest.raises(UserNotFoundError):
            delete_user(session, uuid4())


class TestUserAuthentication:
    """Test user authentication operations."""

    def test_authenticate_user_success(self, session: Session):
        """Test successful user authentication."""
        user_data = {
            "email": "auth@example.com",
            "full_name": "Auth User",
            "organization": "Auth Org",
            "phone_number": "+1234567890",
            "password": "AuthPass123",
        }
        user_create = UserCreate(**user_data)
        create_user(session, user_create)

        authenticated_user = authenticate_user(
            session, user_data["email"], user_data["password"]
        )

        assert authenticated_user is not None
        assert authenticated_user.email == user_data["email"]

    def test_authenticate_user_wrong_password(self, session: Session):
        """Test user authentication with wrong password."""
        user_data = {
            "email": "wrong@example.com",
            "full_name": "Wrong User",
            "organization": "Wrong Org",
            "phone_number": "+1234567890",
            "password": "CorrectPass123",
        }
        user_create = UserCreate(**user_data)
        create_user(session, user_create)

        authenticated_user = authenticate_user(
            session, user_data["email"], "WrongPass123"
        )

        assert authenticated_user is None

    def test_authenticate_user_inactive(self, session: Session):
        """Test authentication of inactive user."""
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

        authenticated_user = authenticate_user(
            session, user_data["email"], user_data["password"]
        )

        assert authenticated_user is None

    def test_authenticate_user_nonexistent(self, session: Session):
        """Test authentication of non-existent user."""
        authenticated_user = authenticate_user(
            session, "nonexistent@example.com", "SomePass123"
        )

        assert authenticated_user is None


class TestUserManagement:
    """Test user management operations."""

    def test_get_users_with_pagination(self, session: Session):
        """Test user listing with pagination."""
        # Create multiple users
        for i in range(5):
            user_data = {
                "email": f"user{i}@example.com",
                "full_name": f"User {i}",
                "organization": f"Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"Pass{i}123",
            }
            user_create = UserCreate(**user_data)
            create_user(session, user_create)

        users, total = get_users(session, skip=0, limit=3)

        assert len(users) == 3
        assert total >= 5

    def test_get_users_with_filters(self, session: Session):
        """Test user listing with filters."""
        # Create users with different roles
        for i in range(3):
            user_data = {
                "email": f"creator{i}@example.com",
                "full_name": f"Creator {i}",
                "organization": f"Creator Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"CreatorPass{i}123",
            }
            user_create = UserCreate(**user_data)
            create_user(session, user_create)

        # Create admin user
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123",
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()

        # Test filtering by role
        users, total = get_users(session, role=UserRole.CREATOR)
        assert all(user.role == UserRole.CREATOR for user in users)

        # Test filtering by active status
        users, total = get_users(session, is_active=True)
        assert all(user.is_active for user in users)

    def test_get_users_with_search(self, session: Session):
        """Test user listing with search."""
        # Create users with searchable names
        user_data = [
            {
                "email": "john@example.com",
                "full_name": "John Doe",
                "organization": "John Org",
                "phone_number": "+1234567890",
                "password": "JohnPass123",
            },
            {
                "email": "jane@example.com",
                "full_name": "Jane Smith",
                "organization": "Jane Org",
                "phone_number": "+1234567891",
                "password": "JanePass123",
            },
            {
                "email": "bob@example.com",
                "full_name": "Bob Johnson",
                "organization": "Bob Org",
                "phone_number": "+1234567892",
                "password": "BobPass123",
            },
        ]

        for data in user_data:
            user_create = UserCreate(**data)
            create_user(session, user_create)

        # Search for "John"
        users, total = get_users(session, search="John")
        assert len(users) == 2  # Should find "John Doe" and "Bob Johnson"
        user_names = [user.full_name for user in users]
        assert "John Doe" in user_names
        assert "Bob Johnson" in user_names

    def test_activate_user_success(self, session: Session):
        """Test successful user activation."""
        user_data = {
            "email": "activate@example.com",
            "full_name": "Activate User",
            "organization": "Activate Org",
            "phone_number": "+1234567890",
            "password": "ActivatePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.is_active = False
        session.add(user)
        session.commit()

        result = activate_user(session, user.id)

        assert result is True
        assert user.is_active is True

    def test_deactivate_user_success(self, session: Session):
        """Test successful user deactivation."""
        user_data = {
            "email": "deactivate@example.com",
            "full_name": "Deactivate User",
            "organization": "Deactivate Org",
            "phone_number": "+1234567890",
            "password": "DeactivatePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        result = deactivate_user(session, user.id)

        assert result is True
        assert user.is_active is False

    def test_change_user_role_success(self, session: Session):
        """Test successful user role change."""
        user_data = {
            "email": "role@example.com",
            "full_name": "Role User",
            "organization": "Role Org",
            "phone_number": "+1234567890",
            "password": "RolePass123",
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)

        result = change_user_role(session, user.id, UserRole.ADMIN)

        assert result is True
        assert user.role == UserRole.ADMIN


class TestUserUtilities:
    """Test user utility functions."""

    def test_get_user_count(self, session: Session):
        """Test user count functionality."""
        # Create some users
        for i in range(3):
            user_data = {
                "email": f"count{i}@example.com",
                "full_name": f"Count User {i}",
                "organization": f"Count Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"CountPass{i}123",
            }
            user_create = UserCreate(**user_data)
            create_user(session, user_create)

        total_count = get_user_count(session)
        assert total_count >= 3

        creator_count = get_user_count(session, role=UserRole.CREATOR)
        assert creator_count >= 3

    def test_get_users_by_role(self, session: Session):
        """Test getting users by role."""
        # Create users with different roles
        for i in range(2):
            user_data = {
                "email": f"creator{i}@example.com",
                "full_name": f"Creator {i}",
                "organization": f"Creator Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"CreatorPass{i}123",
            }
            user_create = UserCreate(**user_data)
            create_user(session, user_create)

        # Create admin user
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123",
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()

        creators, creator_count = get_users_by_role(session, UserRole.CREATOR)
        assert all(user.role == UserRole.CREATOR for user in creators)

        admins, admin_count = get_users_by_role(session, UserRole.ADMIN)
        assert all(user.role == UserRole.ADMIN for user in admins)

    def test_get_active_users(self, session: Session):
        """Test getting active users."""
        # Create active users
        for i in range(2):
            user_data = {
                "email": f"active{i}@example.com",
                "full_name": f"Active User {i}",
                "organization": f"Active Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"ActivePass{i}123",
            }
            user_create = UserCreate(**user_data)
            create_user(session, user_create)

        # Create inactive user
        inactive_data = {
            "email": "inactive@example.com",
            "full_name": "Inactive User",
            "organization": "Inactive Org",
            "phone_number": "+1234567890",
            "password": "InactivePass123",
        }
        inactive_create = UserCreate(**inactive_data)
        inactive_user = create_user(session, inactive_create)
        inactive_user.is_active = False
        session.add(inactive_user)
        session.commit()

        active_users, active_count = get_active_users(session)
        assert all(user.is_active for user in active_users)

    def test_get_inactive_users(self, session: Session):
        """Test getting inactive users."""
        # Create active user
        active_data = {
            "email": "active@example.com",
            "full_name": "Active User",
            "organization": "Active Org",
            "phone_number": "+1234567890",
            "password": "ActivePass123",
        }
        active_create = UserCreate(**active_data)
        create_user(session, active_create)

        # Create inactive users
        for i in range(2):
            user_data = {
                "email": f"inactive{i}@example.com",
                "full_name": f"Inactive User {i}",
                "organization": f"Inactive Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"InactivePass{i}123",
            }
            user_create = UserCreate(**user_data)
            user = create_user(session, user_create)
            user.is_active = False
            session.add(user)
        session.commit()

        inactive_users, inactive_count = get_inactive_users(session)
        assert all(not user.is_active for user in inactive_users)

    def test_search_users_by_name(self, session: Session):
        """Test searching users by name."""
        # Create users with searchable names
        user_data = [
            {
                "email": "alice@example.com",
                "full_name": "Alice Johnson",
                "organization": "Alice Org",
                "phone_number": "+1234567890",
                "password": "AlicePass123",
            },
            {
                "email": "bob@example.com",
                "full_name": "Bob Johnson",
                "organization": "Bob Org",
                "phone_number": "+1234567891",
                "password": "BobPass123",
            },
            {
                "email": "charlie@example.com",
                "full_name": "Charlie Smith",
                "organization": "Charlie Org",
                "phone_number": "+1234567892",
                "password": "CharliePass123",
            },
        ]

        for data in user_data:
            user_create = UserCreate(**data)
            create_user(session, user_create)

        # Search for "Johnson"
        johnson_users, johnson_count = search_users_by_name(session, "Johnson")
        assert len(johnson_users) == 2
        assert all("Johnson" in user.full_name for user in johnson_users)

        # Search for "Alice"
        alice_users, alice_count = search_users_by_name(session, "Alice")
        assert len(alice_users) == 1
        assert alice_users[0].full_name == "Alice Johnson"
