"""Tests for user management routes."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import create_access_token
from app.crud.user import create_user
from app.models.common import UserRole
from app.schemas.auth import UserCreate


class TestUserProfile:
    """Test user profile management."""

    def test_get_current_user_profile_success(self, client: TestClient, session: Session):
        """Test successful current user profile retrieval."""
        # Create and login user
        user_data = {
            "email": "profile@example.com",
            "full_name": "Profile User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "profile@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get current user profile
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["organization"] == user_data["organization"]
        assert data["phone_number"] == user_data["phone_number"]
        assert data["role"] == UserRole.CREATOR.value
        assert data["is_active"] is True

    def test_get_current_user_profile_no_auth(self, client: TestClient):
        """Test current user profile without authentication."""
        response = client.get("/api/v1/users/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_current_user_profile_success(self, client: TestClient, session: Session):
        """Test successful user profile update."""
        # Create and login user
        user_data = {
            "email": "update@example.com",
            "full_name": "Update User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "update@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Update profile
        update_data = {
            "full_name": "Updated Name",
            "organization": "Updated Org",
            "phone_number": "+1987654321"  # Valid phone number format
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me", json=update_data, headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
        assert data["organization"] == update_data["organization"]
        assert data["phone_number"] == update_data["phone_number"]

    def test_update_current_user_profile_partial(self, client: TestClient, session: Session):
        """Test partial user profile update."""
        # Create and login user
        user_data = {
            "email": "partial@example.com",
            "full_name": "Partial User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "partial@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Update only name
        update_data = {"full_name": "New Name"}
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me", json=update_data, headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "New Name"
        assert data["organization"] == user_data["organization"]  # Unchanged
        assert data["phone_number"] == user_data["phone_number"]  # Unchanged

    def test_update_current_user_profile_invalid_phone(self, client: TestClient, session: Session):
        """Test user profile update with invalid phone number."""
        # Create and login user
        user_data = {
            "email": "invalid@example.com",
            "full_name": "Invalid User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "invalid@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to update with invalid phone
        update_data = {"phone_number": "invalid-phone"}
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me", json=update_data, headers=headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserPasswordChange:
    """Test user password change functionality."""

    def test_change_password_success(self, client: TestClient, session: Session):
        """Test successful password change."""
        # Create and login user
        user_data = {
            "email": "password@example.com",
            "full_name": "Password User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "password@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Change password
        password_data = {
            "current_password": "TestPass123",
            "new_password": "NewPass123"
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me/password", json=password_data, headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert "Password changed successfully" in response.json()["message"]

    def test_change_password_wrong_current(self, client: TestClient, session: Session):
        """Test password change with wrong current password."""
        # Create and login user
        user_data = {
            "email": "wrong@example.com",
            "full_name": "Wrong User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "wrong@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to change password with wrong current password
        password_data = {
            "current_password": "WrongPass123",
            "new_password": "NewPass123"
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me/password", json=password_data, headers=headers)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Current password is incorrect" in response.json()["detail"]

    def test_change_password_weak_new(self, client: TestClient, session: Session):
        """Test password change with weak new password."""
        # Create and login user
        user_data = {
            "email": "weak@example.com",
            "full_name": "Weak User",
            "organization": "Test Org",
            "phone_number": "+1234567890",
            "password": "TestPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        login_data = {
            "email": "weak@example.com",
            "password": "TestPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to change password with weak new password
        password_data = {
            "current_password": "TestPass123",
            "new_password": "weak"
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put("/api/v1/users/me/password", json=password_data, headers=headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestAdminUserManagement:
    """Test admin user management functionality."""

    def test_get_users_list_admin_success(self, client: TestClient, session: Session):
        """Test successful user listing by admin."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get users list
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data

    def test_get_users_list_creator_forbidden(self, client: TestClient, session: Session):
        """Test user listing by non-admin user."""
        # Create regular user
        user_data = {
            "email": "creator@example.com",
            "full_name": "Creator User",
            "organization": "Creator Org",
            "phone_number": "+1234567890",
            "password": "CreatorPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        # Login as creator
        login_data = {
            "email": "creator@example.com",
            "password": "CreatorPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to get users list
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users", headers=headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_users_list_with_filters(self, client: TestClient, session: Session):
        """Test user listing with filters."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get users list with filters
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/users?role=CREATOR&is_active=true&limit=10", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert data["limit"] == 10

    def test_delete_user_admin_success(self, client: TestClient, session: Session):
        """Test successful user deletion by admin."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Create a user to delete
        user_data = {
            "email": "user@example.com",
            "full_name": "User To Delete",
            "organization": "User Org",
            "phone_number": "+1234567890",
            "password": "UserPass123"
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Delete user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete(f"/api/v1/users/{user.id}", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

    def test_delete_user_admin_self_forbidden(self, client: TestClient, session: Session):
        """Test admin cannot delete themselves."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to delete self
        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete(f"/api/v1/users/{admin.id}", headers=headers)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_user_creator_forbidden(self, client: TestClient, session: Session):
        """Test non-admin cannot delete users."""
        # Create regular user
        user_data = {
            "email": "creator@example.com",
            "full_name": "Creator User",
            "organization": "Creator Org",
            "phone_number": "+1234567890",
            "password": "CreatorPass123"
        }
        client.post("/api/v1/auth/signup", json=user_data)
        
        # Login as creator
        login_data = {
            "email": "creator@example.com",
            "password": "CreatorPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to delete a user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete("/api/v1/users/some-user-id", headers=headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_activate_user_admin_success(self, client: TestClient, session: Session):
        """Test successful user activation by admin."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Create inactive user
        user_data = {
            "email": "inactive@example.com",
            "full_name": "Inactive User",
            "organization": "Inactive Org",
            "phone_number": "+1234567890",
            "password": "InactivePass123"
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        user.is_active = False
        session.add(user)
        session.commit()
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Activate user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put(f"/api/v1/users/{user.id}/activate", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

    def test_deactivate_user_admin_success(self, client: TestClient, session: Session):
        """Test successful user deactivation by admin."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Create active user
        user_data = {
            "email": "active@example.com",
            "full_name": "Active User",
            "organization": "Active Org",
            "phone_number": "+1234567890",
            "password": "ActivePass123"
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Deactivate user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put(f"/api/v1/users/{user.id}/deactivate", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

    def test_change_user_role_admin_success(self, client: TestClient, session: Session):
        """Test successful user role change by admin."""
        # Create admin user directly with admin role
        admin_data = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "organization": "Admin Org",
            "phone_number": "+1234567890",
            "password": "AdminPass123"
        }
        admin_create = UserCreate(**admin_data)
        admin = create_user(session, admin_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # Create user with CREATOR role
        user_data = {
            "email": "creator@example.com",
            "full_name": "Creator User",
            "organization": "Creator Org",
            "phone_number": "+1234567890",
            "password": "CreatorPass123"
        }
        user_create = UserCreate(**user_data)
        user = create_user(session, user_create)
        
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "AdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Change user role to ADMIN
        headers = {"Authorization": f"Bearer {token}"}
        response = client.put(f"/api/v1/users/{user.id}/role?new_role=ADMIN", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data 