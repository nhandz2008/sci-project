# Phase 2: Authentication & User Management - Detailed Implementation Plan

This document outlines the detailed steps for implementing authentication and user management in the SCI backend. Follow these steps in order to ensure proper implementation without dependency issues.

---

## Step 1: Set Up Authentication Dependencies and Utilities

### 1.1 Create Authentication Dependencies
- Create `app/api/deps.py` file for FastAPI dependency injection
- Implement `get_current_user()` dependency that:
  - Extracts JWT token from Authorization header
  - Validates token using security utilities
  - Returns User object or raises HTTPException
- Implement `get_current_active_user()` dependency that:
  - Calls `get_current_user()`
  - Checks if user is active
  - Returns active user or raises HTTPException
- Implement `get_current_admin_user()` dependency that:
  - Calls `get_current_active_user()`
  - Checks if user has ADMIN role
  - Returns admin user or raises HTTPException

### 1.2 Create Authentication Schemas
- Create `app/schemas/` directory for Pydantic models
- Create `app/schemas/auth.py` with:
  - `UserCreate` schema for registration
  - `UserLogin` schema for login
  - `UserResponse` schema for user data responses
  - `TokenResponse` schema for JWT responses
  - `PasswordResetRequest` schema for password reset
  - `PasswordResetConfirm` schema for password reset confirmation

### 1.3 Create User Management Schemas
- Create `app/schemas/user.py` with:
  - `UserUpdate` schema for profile updates
  - `PasswordChange` schema for password changes
  - `UserListResponse` schema for admin user listing
  - `UserDetailResponse` schema for detailed user info

---

## Step 2: Implement Authentication Endpoints

### 2.1 Create Authentication Router
- Create `app/api/routes/auth.py` file
- Import necessary dependencies and schemas
- Set up router with proper tags and prefix

### 2.2 Implement User Registration Endpoint
- Create `POST /auth/signup` endpoint
- Validate input using `UserCreate` schema
- Check if email already exists
- Hash password using security utilities
- Create user with CREATOR role by default
- Return user data (without password) and success message
- Handle duplicate email errors gracefully

### 2.3 Implement User Login Endpoint
- Create `POST /auth/login` endpoint
- Validate input using `UserLogin` schema
- Find user by email
- Verify password using security utilities
- Check if user is active
- Generate JWT access token
- Return token and user data
- Handle invalid credentials and inactive users

### 2.4 Implement Password Reset Request Endpoint
- Create `POST /auth/forgot-password` endpoint
- Validate email input
- Check if user exists and is active
- Generate password reset token
- Send reset email (log for now, implement email later)
- Return success message regardless of email existence (security)

### 2.5 Implement Password Reset Confirmation Endpoint
- Create `POST /auth/reset-password` endpoint
- Validate token and new password
- Verify reset token using security utilities
- Update user password
- Return success message
- Handle invalid/expired tokens

---

## Step 3: Implement User Management Endpoints

### 3.1 Create User Management Router
- Create `app/api/routes/users.py` file
- Import necessary dependencies and schemas
- Set up router with proper tags and prefix

### 3.2 Implement Get Current User Profile
- Create `GET /users/me` endpoint
- Use `get_current_active_user()` dependency
- Return current user data using `UserResponse` schema
- Exclude sensitive information (password hash)

### 3.3 Implement Update User Profile
- Create `PUT /users/me` endpoint
- Use `get_current_active_user()` dependency
- Validate input using `UserUpdate` schema
- Update user fields (name, organization, phone)
- Return updated user data
- Handle validation errors

### 3.4 Implement Change Password
- Create `PUT /users/me/password` endpoint
- Use `get_current_active_user()` dependency
- Validate input using `PasswordChange` schema
- Verify current password
- Validate new password strength
- Hash and update new password
- Return success message

### 3.5 Implement Admin User Listing (Admin Only)
- Create `GET /users` endpoint
- Use `get_current_admin_user()` dependency
- Add pagination parameters (skip, limit)
- Add filtering parameters (role, is_active)
- Return paginated user list
- Exclude sensitive information

### 3.6 Implement Delete User (Admin Only)
- Create `DELETE /users/{user_id}` endpoint
- Use `get_current_admin_user()` dependency
- Validate user_id parameter
- Check if user exists
- Prevent admin from deleting themselves
- Delete user and related data
- Return success message

---

## Step 4: Set Up API Router Structure

### 4.1 Create Main API Router
- Create `app/api/__init__.py` file
- Create `app/api/main.py` file
- Set up main API router with version prefix
- Include auth and users routers

### 4.2 Update Main Application
- Update `app/main.py` to include API routers
- Add proper error handling for authentication
- Ensure CORS is properly configured
- Test that all endpoints are accessible

---

## Step 5: Create CRUD Utilities

### 5.1 Create User CRUD Operations
- Create `app/crud/user.py` file
- Implement `create_user()` function
- Implement `get_user_by_email()` function
- Implement `get_user_by_id()` function
- Implement `update_user()` function
- Implement `delete_user()` function
- Implement `get_users()` function with pagination/filtering

### 5.2 Create Database Session Management
- Update `app/core/db.py` to include async session management
- Add proper session dependency injection
- Ensure sessions are properly closed

---

## Step 6: Error Handling and Validation

### 6.1 Create Custom Exceptions
- Create `app/core/exceptions.py` file
- Define custom exception classes for:
  - Authentication errors
  - Authorization errors
  - User not found errors
  - Duplicate user errors

### 6.2 Implement Error Handlers
- Add custom exception handlers in main.py
- Ensure proper HTTP status codes
- Return consistent error response format
- Log errors appropriately

### 6.3 Add Input Validation
- Ensure all endpoints validate input properly
- Add proper error messages for validation failures
- Test edge cases and invalid inputs

---

## Step 7: Testing Setup

### 7.1 Create Test Structure
- Create `tests/` directory in backend
- Create `tests/api/` for API tests
- Create `tests/crud/` for CRUD tests
- Create `tests/conftest.py` for test configuration

### 7.2 Set Up Test Database
- Configure test database settings
- Create test database fixtures
- Set up test session management

### 7.3 Create Authentication Tests
- Test user registration (success and failure cases)
- Test user login (success and failure cases)
- Test password reset flow
- Test token validation
- Test invalid credentials

### 7.4 Create User Management Tests
- Test get current user profile
- Test update user profile
- Test change password
- Test admin user listing
- Test delete user (admin only)
- Test authorization and permissions

---

## Step 8: Security and Best Practices

### 8.1 Implement Security Measures
- Ensure passwords are properly hashed
- Validate password strength
- Implement rate limiting for auth endpoints
- Add proper logging for security events
- Ensure sensitive data is not exposed in responses

### 8.2 Add Input Sanitization
- Sanitize all user inputs
- Validate email formats
- Check for SQL injection attempts
- Validate file uploads (if any)

### 8.3 Implement Proper Logging
- Add structured logging
- Log authentication events
- Log user management actions
- Ensure no sensitive data in logs

---

## Step 9: Documentation and API Specs

### 9.1 Update OpenAPI Documentation
- Add proper tags for auth and users
- Add detailed descriptions for all endpoints
- Include example requests and responses
- Document error responses

### 9.2 Create API Documentation
- Document authentication flow
- Document user management operations
- Include usage examples
- Document error codes and messages

---

## Implementation Order and Dependencies

1. **Start with Step 1** - Dependencies and schemas (foundation)
2. **Continue with Step 5** - CRUD utilities (data layer)
3. **Implement Step 2** - Authentication endpoints (core functionality)
4. **Add Step 3** - User management endpoints (user operations)
5. **Set up Step 4** - Router structure (organization)
6. **Add Step 6** - Error handling (robustness)
7. **Implement Step 7** - Testing (quality assurance)
8. **Finish with Steps 8-9** - Security and documentation (polish)

---

## Success Criteria

- All authentication endpoints work correctly
- User management endpoints function properly
- Proper authorization is enforced
- Error handling is comprehensive
- Tests pass with good coverage
- API documentation is complete
- Security best practices are followed

---

**Follow this plan step by step to implement a robust authentication and user management system for the SCI backend.** 