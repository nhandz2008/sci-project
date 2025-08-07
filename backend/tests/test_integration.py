"""Integration tests for complete user flows."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.common import UserRole


class TestCompleteUserFlow:
    """Test complete user flows from registration to admin operations."""

    def test_complete_user_registration_flow(self, client: TestClient, session: Session):
        """Test complete user registration and profile management flow."""
        # 1. Register new user
        user_data = {
            "email": "flow@example.com",
            "full_name": "Flow User",
            "organization": "Flow Org",
            "phone_number": "+1234567890",
            "password": "FlowPass123"
        }
        
        response = client.post("/api/v1/auth/signup", json=user_data)
        assert response.status_code == status.HTTP_200_OK
        
        # 2. Login with new user
        login_data = {
            "email": "flow@example.com",
            "password": "FlowPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get current user profile
        profile_response = client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == status.HTTP_200_OK
        
        profile_data = profile_response.json()
        assert profile_data["email"] == user_data["email"]
        assert profile_data["full_name"] == user_data["full_name"]
        assert profile_data["role"] == UserRole.CREATOR.value
        assert profile_data["is_active"] is True
        
        # 4. Update user profile
        update_data = {
            "full_name": "Updated Name",
            "organization": "Updated Org",
            "phone_number": "+1987654321"  # Valid phone number format
        }
        
        update_response = client.put("/api/v1/users/me", json=update_data, headers=headers)
        assert update_response.status_code == status.HTTP_200_OK
        
        updated_profile = update_response.json()
        assert updated_profile["full_name"] == update_data["full_name"]
        assert updated_profile["organization"] == update_data["organization"]
        assert updated_profile["phone_number"] == update_data["phone_number"]
        
        # 5. Change password
        password_data = {
            "current_password": "FlowPass123",
            "new_password": "NewFlowPass123"
        }
        
        password_response = client.put("/api/v1/users/me/password", json=password_data, headers=headers)
        assert password_response.status_code == status.HTTP_200_OK
        
        # 6. Login with new password
        new_login_data = {
            "email": "flow@example.com",
            "password": "NewFlowPass123"
        }
        new_login_response = client.post("/api/v1/auth/login", json=new_login_data)
        assert new_login_response.status_code == status.HTTP_200_OK

    def test_complete_admin_flow(self, client: TestClient, session: Session):
        """Test complete admin user management flow."""
        # 1. Create admin user
        from app.crud.user import create_user
        from app.schemas.auth import UserCreate
        
        admin_data = {
            "email": "admin_flow@example.com",
            "full_name": "Admin Flow User",
            "organization": "Admin Flow Org",
            "phone_number": "+1234567890",
            "password": "AdminFlowPass123"
        }
        
        user_create = UserCreate(**admin_data)
        admin = create_user(session, user_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # 2. Login as admin
        login_data = {
            "email": "admin_flow@example.com",
            "password": "AdminFlowPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get users list as admin
        users_response = client.get("/api/v1/users", headers=headers)
        assert users_response.status_code == status.HTTP_200_OK
        
        users_data = users_response.json()
        assert "users" in users_data
        assert "total" in users_data
        assert "skip" in users_data
        assert "limit" in users_data
        
        # 4. Create regular user for management
        regular_user_data = {
            "email": "regular_flow@example.com",
            "full_name": "Regular Flow User",
            "organization": "Regular Flow Org",
            "phone_number": "+1234567891",
            "password": "RegularFlowPass123"
        }
        
        regular_response = client.post("/api/v1/auth/signup", json=regular_user_data)
        assert regular_response.status_code == status.HTTP_200_OK
        
        # 5. Get the regular user ID for management
        from app.crud.user import get_user_by_email
        regular_user = get_user_by_email(session, "regular_flow@example.com")
        
        # 6. Deactivate regular user
        deactivate_response = client.put(f"/api/v1/users/{regular_user.id}/deactivate", headers=headers)
        assert deactivate_response.status_code == status.HTTP_200_OK
        
        # 7. Activate regular user
        activate_response = client.put(f"/api/v1/users/{regular_user.id}/activate", headers=headers)
        assert activate_response.status_code == status.HTTP_200_OK
        
        # 8. Change user role to admin
        role_response = client.put(f"/api/v1/users/{regular_user.id}/role?new_role=ADMIN", headers=headers)
        assert role_response.status_code == status.HTTP_200_OK

    def test_complete_password_reset_flow(self, client: TestClient, session: Session):
        """Test complete password reset flow."""
        # 1. Register user
        user_data = {
            "email": "reset_flow@example.com",
            "full_name": "Reset Flow User",
            "organization": "Reset Flow Org",
            "phone_number": "+1234567890",
            "password": "ResetFlowPass123"
        }
        
        response = client.post("/api/v1/auth/signup", json=user_data)
        assert response.status_code == status.HTTP_200_OK
        
        # 2. Request password reset
        reset_request_data = {"email": "reset_flow@example.com"}
        reset_request_response = client.post("/api/v1/auth/forgot-password", json=reset_request_data)
        assert reset_request_response.status_code == status.HTTP_200_OK
        
        # 3. Generate reset token (in real app, this would come from email)
        from app.core.security import create_password_reset_token
        reset_token = create_password_reset_token("reset_flow@example.com")
        
        # 4. Reset password with token
        reset_confirm_data = {
            "token": reset_token,
            "new_password": "NewResetFlowPass123"
        }
        reset_confirm_response = client.post("/api/v1/auth/reset-password", json=reset_confirm_data)
        assert reset_confirm_response.status_code == status.HTTP_200_OK
        
        # 5. Login with new password
        new_login_data = {
            "email": "reset_flow@example.com",
            "password": "NewResetFlowPass123"
        }
        new_login_response = client.post("/api/v1/auth/login", json=new_login_data)
        assert new_login_response.status_code == status.HTTP_200_OK

    def test_complete_error_handling_flow(self, client: TestClient, session: Session):
        """Test complete error handling flow."""
        # 1. Try to register with invalid data
        invalid_user_data = {
            "email": "invalid-email",
            "full_name": "Invalid User",
            "organization": "Invalid Org",
            "phone_number": "invalid-phone",
            "password": "weak"
        }
        
        response = client.post("/api/v1/auth/signup", json=invalid_user_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # 2. Try to login with non-existent user
        non_existent_login = {
            "email": "nonexistent@example.com",
            "password": "SomePass123"
        }
        
        login_response = client.post("/api/v1/auth/login", json=non_existent_login)
        assert login_response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # 3. Try to access protected endpoint without auth
        protected_response = client.get("/api/v1/users/me")
        assert protected_response.status_code == status.HTTP_403_FORBIDDEN
        
        # 4. Try to access admin endpoint as regular user
        # First create a regular user
        regular_user_data = {
            "email": "regular_error@example.com",
            "full_name": "Regular Error User",
            "organization": "Regular Error Org",
            "phone_number": "+1234567890",
            "password": "RegularErrorPass123"
        }
        
        signup_response = client.post("/api/v1/auth/signup", json=regular_user_data)
        assert signup_response.status_code == status.HTTP_200_OK
        
        # Login as regular user
        login_data = {
            "email": "regular_error@example.com",
            "password": "RegularErrorPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access admin endpoint
        admin_response = client.get("/api/v1/users", headers=headers)
        assert admin_response.status_code == status.HTTP_403_FORBIDDEN

    def test_complete_pagination_and_filtering_flow(self, client: TestClient, session: Session):
        """Test complete pagination and filtering flow."""
        # 1. Create admin user
        from app.crud.user import create_user
        from app.schemas.auth import UserCreate
        
        admin_data = {
            "email": "pagination_admin@example.com",
            "full_name": "Pagination Admin",
            "organization": "Pagination Admin Org",
            "phone_number": "+1234567890",
            "password": "PaginationAdminPass123"
        }
        
        user_create = UserCreate(**admin_data)
        admin = create_user(session, user_create)
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        
        # 2. Create multiple users for testing
        for i in range(5):
            user_data = {
                "email": f"pagination_user{i}@example.com",
                "full_name": f"Pagination User {i}",
                "organization": f"Pagination Org {i}",
                "phone_number": f"+123456789{i}",
                "password": f"PaginationPass{i}123"
            }
            
            response = client.post("/api/v1/auth/signup", json=user_data)
            assert response.status_code == status.HTTP_200_OK
        
        # 3. Login as admin
        login_data = {
            "email": "pagination_admin@example.com",
            "password": "PaginationAdminPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Test pagination
        pagination_response = client.get("/api/v1/users?skip=0&limit=3", headers=headers)
        assert pagination_response.status_code == status.HTTP_200_OK
        
        pagination_data = pagination_response.json()
        assert len(pagination_data["users"]) == 3
        assert pagination_data["skip"] == 0
        assert pagination_data["limit"] == 3
        
        # 5. Test filtering by role
        role_filter_response = client.get("/api/v1/users?role=CREATOR", headers=headers)
        assert role_filter_response.status_code == status.HTTP_200_OK
        
        role_filter_data = role_filter_response.json()
        assert all(user["role"] == "CREATOR" for user in role_filter_data["users"])
        
        # 6. Test filtering by active status
        active_filter_response = client.get("/api/v1/users?is_active=true", headers=headers)
        assert active_filter_response.status_code == status.HTTP_200_OK
        
        active_filter_data = active_filter_response.json()
        assert all(user["is_active"] for user in active_filter_data["users"])
        
        # 7. Test search functionality
        search_response = client.get("/api/v1/users?search=Pagination", headers=headers)
        assert search_response.status_code == status.HTTP_200_OK
        
        search_data = search_response.json()
        assert len(search_data["users"]) > 0
        assert all("Pagination" in user["full_name"] or "Pagination" in user["organization"] 
                  for user in search_data["users"])

    def test_complete_security_flow(self, client: TestClient, session: Session):
        """Test complete security flow including token validation and expiration."""
        # 1. Register and login user
        user_data = {
            "email": "security_flow@example.com",
            "full_name": "Security Flow User",
            "organization": "Security Flow Org",
            "phone_number": "+1234567890",
            "password": "SecurityFlowPass123"
        }
        
        response = client.post("/api/v1/auth/signup", json=user_data)
        assert response.status_code == status.HTTP_200_OK
        
        login_data = {
            "email": "security_flow@example.com",
            "password": "SecurityFlowPass123"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Test valid token access
        profile_response = client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == status.HTTP_200_OK
        
        # 3. Test invalid token access
        invalid_headers = {"Authorization": "Bearer invalid-token"}
        invalid_response = client.get("/api/v1/users/me", headers=invalid_headers)
        assert invalid_response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # 4. Test missing token access
        missing_response = client.get("/api/v1/users/me")
        assert missing_response.status_code == status.HTTP_403_FORBIDDEN
        
        # 5. Test malformed token access
        malformed_headers = {"Authorization": "Bearer not.a.valid.token"}
        malformed_response = client.get("/api/v1/users/me", headers=malformed_headers)
        assert malformed_response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # 6. Test expired token (simulate by creating a token with very short expiry)
        from app.core.security import create_access_token
        from datetime import timedelta
        
        expired_token = create_access_token("some-user-id", expires_delta=timedelta(seconds=1))
        expired_headers = {"Authorization": f"Bearer {expired_token}"}
        
        # Wait for token to expire
        import time
        time.sleep(2)
        
        expired_response = client.get("/api/v1/users/me", headers=expired_headers)
        assert expired_response.status_code == status.HTTP_401_UNAUTHORIZED 