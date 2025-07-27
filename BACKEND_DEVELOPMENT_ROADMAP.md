# SCI Backend Development Roadmap

This document outlines the next steps for developing the Science Competitions Insight (SCI) backend, following FastAPI template best practices and project-specific requirements.

## Current State Assessment

### ✅ Already Complete
- Basic FastAPI project structure
- UV package manager setup with all required dependencies
- Docker configuration with docker-compose
- Alembic migrations framework setup
- Configuration management (`app/core/config.py`)
- Database engine setup (`app/core/db.py`)
- Comprehensive data models (User, Competition, Common models)
- Environment configuration (`.env` file created)

### ❌ Critical Missing Components (Blocking Further Development)
- **CRUD operations** (`app/crud.py`) - Referenced in `db.py` but missing
- **Models module initialization** (`app/models/__init__.py`) - Required for imports
- **Database migrations** - No tables exist yet
- **Session dependency** - No way to get database sessions in routes
- **Basic API structure** - No routers or endpoints beyond health check
- **Application initialization** - FastAPI app not properly configured

### ❌ Future Components
- Authentication and authorization system
- API route structure
- Testing framework
- Email functionality
- Security implementation beyond basic setup

## Development Roadmap

### Phase 1: Foundation Setup ✅ **COMPLETED**

#### 1.1 Update Dependencies ✅ **COMPLETED**
**Objective**: Align dependencies with FastAPI template best practices

**Current pyproject.toml Dependencies:**
```toml
dependencies = [
    "alembic>=1.16.4",
    "asyncpg>=0.30.0", 
    "email-validator>=2.2.0",
    "emails>=0.6",
    "fastapi[standard]>=0.116.1",
    "jinja2>=3.1.6",
    "mypy>=1.17.0",
    "passlib[bcrypt]>=1.7.4",
    "pydantic-settings>=2.10.1",
    "pyjwt>=2.10.1",
    "pytest>=8.4.1",
    "python-multipart>=0.0.20",
    "ruff>=0.12.3",
    "sentry-sdk[fastapi]>=2.33.0",
    "sqlmodel>=0.0.24",
]
```

**Status**: ✅ **COMPLETED** - All required dependencies are properly configured in pyproject.toml

#### 1.2 Configuration Management ✅ **COMPLETED**
**Objective**: Implement robust settings and environment management

**Status**: ✅ **COMPLETED** - `app/core/config.py` is fully implemented with:
- Comprehensive Settings class with Pydantic settings
- Database configuration with PostgreSQL
- Security settings (SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES)
- CORS configuration
- Admin user setup
- Environment validation
- Email configuration (commented out for MVP)

**Environment Files**: ✅ **COMPLETED**
- `.env.example` file created with all required variables
- `.env` file exists (not tracked in git)

#### 1.3 Database Engine Setup ✅ **COMPLETED**
**Objective**: Establish database connection and session management

**Status**: ✅ **COMPLETED** - `app/core/db.py` is implemented with:
- Database engine creation with PostgreSQL
- Session management
- Database initialization function

### Phase 2: Data Models ✅ **COMPLETED**

#### 2.1 Core Models Implementation ✅ **COMPLETED**
**Objective**: Implement SQLModel models for SCI domain

**Status**: ✅ **COMPLETED** - All core models are implemented:

**User Model** (`app/models/user.py`): ✅ **COMPLETED**
- UserBase with email, full_name, role
- User database model with hashed_password, is_active, timestamps
- UserCreate, UserUpdate, UserPublic API models
- UserRole enum (ADMIN, CREATOR)
- Proper relationships with competitions

**Competition Model** (`app/models/competition.py`): ✅ **COMPLETED**
- CompetitionBase with comprehensive fields:
  - title, description, competition_link, image_url
  - location, format (ONLINE/OFFLINE/HYBRID), scale (PROVINCIAL/REGIONAL/INTERNATIONAL)
  - registration_deadline, target_age_min/max
  - is_active, is_featured flags
- Competition database model with owner relationship and timestamps
- CompetitionCreate, CompetitionUpdate, CompetitionPublic API models
- Proper foreign key relationship to User with CASCADE delete
- CompetitionFormat and CompetitionScale enums for structured data

**Common Models** (`app/models/common.py`): ✅ **COMPLETED**
- Message, Token, TokenPayload, NewPassword models
- JWT token handling models

#### 2.2 Pydantic Response Models ✅ **COMPLETED**
**Objective**: Create API response schemas

**Status**: ✅ **COMPLETED** - All required response models are implemented:
- UserPublic, UserCreate, UserUpdate
- CompetitionPublic, CompetitionCreate, CompetitionUpdate
- CompetitionsPublic (with pagination)
- Message (generic response)
- TokenPayload (JWT)

### Phase 3: Essential Infrastructure (Priority: CRITICAL) 

#### 3.1 Models Module Initialization ✅ **COMPLETED**
**Objective**: Fix model imports that are currently broken

**Problem**: `app/core/db.py` imports `from app.models import User, UserCreate` but there's no `app/models/__init__.py`

**Solution**: ✅ **COMPLETED** - Created `app/models/__init__.py` with:
- Proper exports of all models from individual files
- Circular dependency resolution using string type annotations
- TYPE_CHECKING imports for type safety
- All models now importable: User, Competition, UserCreate, etc.

**Key Fixes Applied**:
1. Created `app/models/__init__.py` with comprehensive exports
2. Fixed circular imports between User and Competition models
3. Used string type annotations (`"User"`, `"Competition"`) for relationships
4. Added proper `Optional` type hints for nullable relationships
5. Verified all models can be imported successfully

#### 3.2 CRUD Operations ✅ **COMPLETED**
**Objective**: Implement database operations referenced in `db.py`

**Problem**: `app/core/db.py` imports `from app import crud` but `app/crud.py` doesn't exist

**Solution**: ✅ **COMPLETED** - Created comprehensive CRUD operations with:

**User CRUD Functions**:
- `create_user()` - Create new user with password hashing
- `get_user_by_email()` - Find user by email address
- `get_user_by_id()` - Find user by UUID
- `update_user()` - Update user details with password handling
- `authenticate()` - Verify email/password combination
- `get_users()` - List users with pagination

**Competition CRUD Functions**:
- `create_competition()` - Create new competition with owner assignment
- `get_competition()` - Get competition by UUID
- `get_competitions()` - List competitions with filtering and pagination
- `update_competition()` - Update competition details
- `delete_competition()` - Delete competition
- `get_competitions_by_owner()` - Get competitions by specific owner

**Additional Features**:
- Password hashing and verification using bcrypt
- Proper error handling and type safety
- Comprehensive filtering options for competitions
- Pagination support for list operations
- Fixed `is_superuser` field issue in `db.py` (now uses `role=UserRole.ADMIN`)

#### 3.3 Database Session Dependency ✅ **COMPLETED**
**Objective**: Create session dependency for FastAPI routes

**Required Files**: `app/api/deps.py`

**Solution**: ✅ **COMPLETED** - Created comprehensive API dependencies with:

**Session Dependencies**:
- `get_db()` - Database session generator with proper cleanup
- `SessionDep` - Type alias for session dependency injection
- `TokenDep` - Type alias for OAuth2 token dependency

**Authentication Dependencies**:
- `get_current_user()` - Extract and validate user from JWT token
- `get_current_active_user()` - Ensure user is active
- `get_current_admin_user()` - Ensure user has admin role
- `CurrentUser`, `CurrentActiveUser`, `CurrentAdminUser` - Type aliases

**Key Features**:
- OAuth2PasswordBearer integration for token authentication
- Proper error handling with HTTP status codes
- Role-based access control using UserRole enum
- Integration with security module for token verification
- Type safety with Annotated dependencies

**Adaptations for SCI**:
- Uses `UserRole.ADMIN` instead of `is_superuser` field
- Proper integration with our User model structure
- Token URL configured for `/auth/login` endpoint

**Test Results**: ✅ All dependencies import successfully and database sessions work correctly

### Phase 4: Database Setup ✅ **COMPLETED**

#### 4.1 Alembic Configuration ✅ **COMPLETED**
**Objective**: Set up database migrations

**Status**: ✅ **COMPLETED** - All Alembic configuration files created and working

**Files Created**:
- ✅ `alembic.ini` (project root) - Database configuration
- ✅ `app/alembic/env.py` (Alembic environment setup) - Model imports and database URL
- ✅ `app/alembic/script.py.mako` (Migration template) - Template for generating migrations
- ✅ `app/alembic/versions/` (Migration directory) - Directory for migration files

**Key Features**:
- Proper database URL configuration with psycopg2 driver
- SQLModel metadata integration for autogenerate
- Support for both online and offline migrations
- Proper logging configuration

#### 4.2 Initial Migration ✅ **COMPLETED** 
**Objective**: Create database schema

**Status**: ✅ **COMPLETED** - Database schema created and verified

**Migration Applied**: `1e0ff91a2bac_initial_sci_models.py`

**Tables Created**:
- ✅ `user` - User model with all required fields and constraints
- ✅ `competition` - Competition model with all required fields and relationships
- ✅ `alembic_version` - Alembic version tracking table

**Key Features**:
- Proper foreign key relationship: `competition.owner_id -> user.id` with CASCADE delete
- Enum types: UserRole, CompetitionFormat, CompetitionScale
- Indexes on email (unique) and id fields
- All required fields with proper data types and constraints

#### 4.3 Database Initialization ✅ **COMPLETED**
**Objective**: Initialize database with admin user

**Status**: ✅ **COMPLETED** - Admin user created and verified

**Admin User Created**:
- Email: `admin@sci.com`
- Role: `ADMIN`
- Status: `Active`
- Password: Hashed and stored securely

#### 4.4 Docker Integration ✅ **COMPLETED**
**Objective**: Ensure database works properly in containerized environment

**Status**: ✅ **COMPLETED** - All Docker services working correctly

**Key Achievements**:
- Database container healthy and accessible
- Backend container can connect to database
- Environment variables properly configured
- Migration system working in containers
- CRUD operations verified and functional

### Phase 5: Basic Application Setup (Priority: HIGH)

#### 5.1 FastAPI Application Configuration ✅ **COMPLETED**
**Objective**: Properly configure FastAPI app

**Status**: ✅ **COMPLETED** - `app/main.py` is fully configured with:

**Key Features Implemented**:
- ✅ **Lifespan Events**: Database initialization with admin user creation on startup
- ✅ **CORS Middleware**: Properly configured with settings from config
- ✅ **API Router Structure**: Modular routing with `/api/v1` prefix
- ✅ **OpenAPI Documentation**: Auto-generated docs at `/api/v1/docs` and `/api/v1/redoc`
- ✅ **Error Handling**: Proper error responses and status codes
- ✅ **Root Endpoint**: Welcome message with API information and links

**Files Created/Updated**:
- ✅ `app/main.py` - Complete FastAPI application with lifespan events
- ✅ `app/api/main.py` - Main API router with route inclusion
- ✅ `app/api/routes/__init__.py` - Routes package initialization
- ✅ `app/api/routes/health.py` - Health check endpoints (`/health`, `/ping`)
- ✅ `app/api/routes/utils.py` - Utility endpoints (`/test-db`, `/info`)

**Docker Configuration**:
- ✅ **Volume Mounting**: Proper file syncing for development
- ✅ **Virtual Environment**: UV-based environment working correctly
- ✅ **Hot Reload**: Development server with auto-reload enabled

**Endpoints Available**:
- ✅ `GET /` - Root endpoint with API information
- ✅ `GET /api/v1/health` - Health check endpoint
- ✅ `GET /api/v1/health/ping` - Simple ping endpoint
- ✅ `GET /api/v1/utils/test-db` - Database connection test
- ✅ `GET /api/v1/utils/info` - API information endpoint
- ✅ `GET /api/v1/docs` - Interactive API documentation
- ✅ `GET /api/v1/redoc` - Alternative API documentation

**Test Results**: ✅ All endpoints working correctly
- Database connection successful
- Admin user created and verified
- CORS properly configured
- Documentation accessible

#### 5.2 Basic API Router Structure ✅ **COMPLETED**
**Objective**: Set up modular routing system

**Status**: ✅ **COMPLETED** - Complete modular API router structure implemented

**Key Features Implemented**:
- ✅ **Modular Router Structure**: All routes organized in separate modules
- ✅ **Proper Exports**: Routes properly exported from `__init__.py`
- ✅ **Comprehensive Endpoints**: Health, utils, auth, competitions, and users routes
- ✅ **Error Handling**: Proper HTTP error responses and status codes
- ✅ **API Documentation**: All endpoints documented in OpenAPI

**Files Created/Updated**:
- ✅ `app/api/main.py` - Main API router with all route inclusions
- ✅ `app/api/deps.py` - Dependencies (already existed)
- ✅ `app/api/routes/__init__.py` - Router exports with proper structure
- ✅ `app/api/routes/health.py` - Health check endpoints (`/health`, `/ping`)
- ✅ `app/api/routes/utils.py` - Utility endpoints (`/test-db`, `/info`, `/status`, `/config`, `/error-test`)
- ✅ `app/api/routes/auth.py` - Authentication placeholder endpoints
- ✅ `app/api/routes/competitions.py` - Competition placeholder endpoints
- ✅ `app/api/routes/users.py` - User management placeholder endpoints

**Endpoints Available**:
- ✅ `GET /api/v1/health/` - Health check endpoint
- ✅ `GET /api/v1/health/ping` - Simple ping endpoint
- ✅ `GET /api/v1/utils/test-db` - Database connection test
- ✅ `GET /api/v1/utils/info` - API information endpoint
- ✅ `GET /api/v1/utils/status` - System status endpoint
- ✅ `GET /api/v1/utils/config` - API configuration endpoint
- ✅ `GET /api/v1/utils/error-test` - Error handling test
- ✅ `GET /api/v1/utils/error-test/{error_type}` - Specific error testing
- ✅ `GET /api/v1/auth/` - Authentication info (placeholder)
- ✅ `GET /api/v1/competitions/` - Competition info (placeholder)
- ✅ `GET /api/v1/users/` - User management info (placeholder)

**Test Results**: ✅ All endpoints working correctly
- Modular structure properly organized
- Error handling working correctly
- All placeholder endpoints responding
- OpenAPI documentation complete

### Phase 6: Authentication & Security (Priority: MEDIUM)

#### 6.1 Security Core ✅ **COMPLETED**
**Objective**: Implement password hashing and JWT handling

**Status**: ✅ **COMPLETED** - Enhanced `app/core/security.py` with comprehensive security utilities

**Key Features Implemented**:
- ✅ **Password Hashing**: bcrypt-based password hashing and verification
- ✅ **JWT Token Management**: Access and refresh token creation and verification
- ✅ **Token Type Validation**: Separate handling for access, refresh, and password reset tokens
- ✅ **Enhanced Error Handling**: Proper PyJWT exception handling with detailed error messages
- ✅ **Security Constants**: Centralized security constants (ALGORITHM, token types)
- ✅ **Password Reset Tokens**: Secure password reset token generation and verification
- ✅ **Token Utilities**: Token expiration checking and expiration time extraction
- ✅ **Comprehensive Testing**: All security functions tested and verified working

**Security Functions Available**:
- `create_access_token()` - Create JWT access tokens with configurable expiration
- `create_refresh_token()` - Create JWT refresh tokens (30-day default expiration)
- `verify_access_token()` - Verify and decode access tokens
- `verify_refresh_token()` - Verify and decode refresh tokens
- `get_password_hash()` - Hash passwords using bcrypt
- `verify_password()` - Verify plain passwords against hashed passwords
- `generate_password_reset_token()` - Create secure password reset tokens
- `verify_password_reset_token()` - Verify password reset tokens
- `is_token_expired()` - Check token expiration without exceptions
- `get_token_expiration()` - Extract token expiration time

**Configuration Updates**:
- ✅ Added `EMAIL_RESET_TOKEN_EXPIRE_HOURS` setting (48 hours)
- ✅ Enhanced `TokenPayload` model with additional fields (exp, type, iat)
- ✅ Updated `Token` model to support refresh tokens and expiration info
- ✅ Updated API dependencies to use new security functions

**Test Results**: ✅ All security functions working correctly
- Password hashing and verification: ✅ Working
- Access token creation and verification: ✅ Working
- Refresh token creation and verification: ✅ Working
- Password reset token generation and verification: ✅ Working
- Token expiration checking: ✅ Working
- Error handling: ✅ Working

**Files Updated**:
- ✅ `app/core/security.py` - Enhanced with comprehensive security utilities
- ✅ `app/models/common.py` - Updated Token and TokenPayload models
- ✅ `app/core/config.py` - Added email reset token expiration setting
- ✅ `app/api/deps.py` - Updated to use new security functions
- ✅ `app/api/routes/utils.py` - Added comprehensive security testing endpoint

#### 6.2 Authentication Dependencies  
**Objective**: Add auth dependencies to `app/api/deps.py`

**Status**: ✅ **COMPLETED** - All authentication dependencies already implemented and working

**Dependencies Available**:
- ✅ `get_current_user()` - Extract and validate user from JWT token
- ✅ `get_current_active_user()` - Ensure user is active
- ✅ `get_current_admin_user()` - Ensure user has admin role
- ✅ `CurrentUser`, `CurrentActiveUser`, `CurrentAdminUser` - Type aliases
- ✅ `SessionDep`, `TokenDep` - Database session and token dependencies

**Test Results**: ✅ All dependencies working correctly with enhanced security functions

#### 6.3 Authentication Routes ✅ **COMPLETED**
**Objective**: Create auth endpoints

**Status**: ✅ **COMPLETED** - Complete authentication system implemented in `app/api/routes/auth.py`

**Authentication Endpoints Implemented**:
- ✅ **POST /auth/signup** - User registration with email validation
- ✅ **POST /auth/login** - OAuth2 compatible login with JWT tokens
- ✅ **POST /auth/refresh** - Token refresh with new access and refresh tokens
- ✅ **POST /auth/forgot-password** - Password reset request
- ✅ **POST /auth/reset-password** - Password reset with secure token
- ✅ **GET /auth/me** - Get current authenticated user information
- ✅ **GET /auth/** - Authentication endpoints information

**Key Features Implemented**:
- ✅ **OAuth2 Compatibility**: Standard OAuth2 password flow for login
- ✅ **JWT Token Management**: Access tokens (8 days) and refresh tokens (30 days)
- ✅ **Password Security**: bcrypt hashing, password strength validation
- ✅ **Token Refresh**: Secure token refresh with new token pair generation
- ✅ **Password Reset**: Secure password reset with time-limited tokens
- ✅ **Error Handling**: Comprehensive error responses with proper HTTP status codes
- ✅ **Input Validation**: Pydantic model validation for all inputs
- ✅ **User Role Support**: Creator role assignment for new users
- ✅ **Active User Validation**: Ensures only active users can authenticate

**Security Features**:
- ✅ **Password Hashing**: bcrypt with salt for secure password storage
- ✅ **Token Expiration**: Configurable token expiration times
- ✅ **Token Type Validation**: Separate handling for access, refresh, and reset tokens
- ✅ **Password Strength**: Minimum 8 character password requirement
- ✅ **Email Validation**: Proper email format validation
- ✅ **User Existence Checks**: Prevents duplicate user registration

**Test Results**: ✅ All authentication endpoints working correctly
- User registration: ✅ Working (creates user with creator role)
- User login: ✅ Working (returns access and refresh tokens)
- Token refresh: ✅ Working (generates new token pair)
- Password reset: ✅ Working (generates and validates reset tokens)
- User profile: ✅ Working (returns authenticated user info)
- Error handling: ✅ Working (proper error responses)
- Input validation: ✅ Working (validates all inputs)

**API Documentation**: ✅ Complete OpenAPI documentation
- All endpoints documented with proper schemas
- Request/response models properly defined
- Authentication flow documented
- Error responses documented

**Files Updated**:
- ✅ `app/api/routes/auth.py` - Complete authentication endpoints implementation
- ✅ `app/models/common.py` - Enhanced Token model with refresh token support
- ✅ `app/core/security.py` - All security functions working with auth endpoints
- ✅ `app/api/deps.py` - Authentication dependencies integrated

**Authentication Flow**:
1. **Registration**: User signs up with email, password, and full name
2. **Login**: User logs in with email/password, receives access and refresh tokens
3. **API Access**: Use access token in Authorization header for protected endpoints
4. **Token Refresh**: Use refresh token to get new access token when expired
5. **Password Reset**: Request reset, receive token, reset password with token

**Status**: ✅ **COMPLETED** - Complete authentication system ready for production use

### Phase 7: Core API Endpoints (Priority: HIGH) 🎯 **NEXT PHASE**

#### 7.1 Competition CRUD Routes ❌ **TO IMPLEMENT**
**Objective**: Implement comprehensive competition management API endpoints

**File**: `app/api/routes/competitions.py`
**Current Status**: ❌ Only placeholder endpoints exist

**Endpoints to Implement**:

**📋 GET /competitions** - List competitions with filtering and pagination
- **Purpose**: Browse competitions with search and filter capabilities
- **Authentication**: None required (public endpoint)
- **Query Parameters**:
  - `skip` (int, default=0) - Pagination offset
  - `limit` (int, default=20, max=100) - Results per page
  - `owner_id` (UUID, optional) - Filter by creator
  - `is_active` (bool, optional) - Filter by active status
  - `is_featured` (bool, optional) - Filter by featured status
  - `format` (CompetitionFormat, optional) - Filter by format (online/offline/hybrid)
  - `scale` (CompetitionScale, optional) - Filter by scale (provincial/regional/international)
- **Response**: `CompetitionsPublic` model with list of competitions and count
- **Error Handling**: HTTP 400 for invalid query parameters

**📄 GET /competitions/{id}** - Get competition details
- **Purpose**: Retrieve detailed information about a specific competition
- **Authentication**: None required (public endpoint)
- **Path Parameters**: `id` (UUID) - Competition identifier
- **Response**: `CompetitionPublic` model
- **Error Handling**: HTTP 404 if competition not found

**➕ POST /competitions** - Create new competition
- **Purpose**: Allow authenticated users to create new competitions
- **Authentication**: Required (CurrentActiveUser dependency)
- **Request Body**: `CompetitionCreate` model
- **Response**: `CompetitionPublic` model
- **Logic**: 
  - Set `owner_id` to current user's ID
  - Validate required fields (title must be provided)
  - Set creation timestamps
- **Error Handling**: 
  - HTTP 400 for validation errors
  - HTTP 403 if user not authenticated

**✏️ PUT /competitions/{id}** - Update competition
- **Purpose**: Allow competition owners and admins to update competitions
- **Authentication**: Required (CurrentActiveUser dependency)
- **Authorization**: Only competition owner or admin can update
- **Path Parameters**: `id` (UUID) - Competition identifier
- **Request Body**: `CompetitionUpdate` model
- **Response**: `CompetitionPublic` model
- **Logic**:
  - Check if user is owner or admin
  - Update only provided fields (partial update)
  - Update `updated_at` timestamp
- **Error Handling**:
  - HTTP 404 if competition not found
  - HTTP 403 if user not authorized
  - HTTP 400 for validation errors

**🗑️ DELETE /competitions/{id}** - Delete competition
- **Purpose**: Allow competition owners and admins to delete competitions
- **Authentication**: Required (CurrentActiveUser dependency)
- **Authorization**: Only competition owner or admin can delete
- **Path Parameters**: `id` (UUID) - Competition identifier
- **Response**: `Message` model with success confirmation
- **Logic**:
  - Check if user is owner or admin
  - Soft delete (set is_active=False) or hard delete based on business requirements
- **Error Handling**:
  - HTTP 404 if competition not found
  - HTTP 403 if user not authorized

**Key Implementation Features**:
- ✅ **CRUD operations**: All CRUD functions already exist in `app/crud.py`
- ✅ **Models**: `CompetitionCreate`, `CompetitionUpdate`, `CompetitionPublic`, `CompetitionsPublic` ready
- ✅ **Dependencies**: `SessionDep`, `CurrentActiveUser`, `CurrentAdminUser` available
- ✅ **Validation**: Pydantic models handle input validation
- ✅ **Enums**: `CompetitionFormat` and `CompetitionScale` for structured data

**Security Considerations**:
- Public endpoints for browsing (GET operations)
- Authentication required for creation/modification
- Owner-based authorization for updates/deletes
- Admin override for all operations
- Input validation through Pydantic models

#### 7.2 User Management Routes ❌ **TO IMPLEMENT**
**Objective**: Implement user profile and administrative user management endpoints

**File**: `app/api/routes/users.py`
**Current Status**: ❌ Only placeholder endpoints exist

**Endpoints to Implement**:

**👥 GET /users** - List users (admin only)
- **Purpose**: Administrative endpoint to view all users
- **Authentication**: Required (CurrentAdminUser dependency - admin only)
- **Query Parameters**:
  - `skip` (int, default=0) - Pagination offset
  - `limit` (int, default=20, max=100) - Results per page
- **Response**: `UsersPublic` model with list of users and count
- **Error Handling**: 
  - HTTP 403 if user not admin
  - HTTP 400 for invalid query parameters

**👤 GET /users/{id}** - Get user profile
- **Purpose**: Retrieve user profile information
- **Authentication**: Required (CurrentActiveUser dependency)
- **Authorization**: Users can view their own profile, admins can view any profile
- **Path Parameters**: `id` (UUID) - User identifier
- **Response**: `UserPublic` model
- **Logic**:
  - If current user is admin: allow access to any profile
  - If current user is not admin: only allow access to own profile
- **Error Handling**:
  - HTTP 404 if user not found
  - HTTP 403 if trying to access another user's profile without admin privileges

**✏️ PUT /users/{id}** - Update user profile
- **Purpose**: Allow users to update their own profile, admins can update any profile
- **Authentication**: Required (CurrentActiveUser dependency)
- **Authorization**: Users can update their own profile, admins can update any profile
- **Path Parameters**: `id` (UUID) - User identifier
- **Request Body**: `UserUpdate` model
- **Response**: `UserPublic` model
- **Logic**:
  - Check authorization (self or admin)
  - Update only provided fields (partial update)
  - Update `updated_at` timestamp
  - Handle email uniqueness validation
- **Error Handling**:
  - HTTP 404 if user not found
  - HTTP 403 if not authorized
  - HTTP 400 for validation errors (e.g., email already exists)

**🗑️ DELETE /users/{id}** - Delete user (admin only)
- **Purpose**: Administrative endpoint to delete user accounts
- **Authentication**: Required (CurrentAdminUser dependency - admin only)
- **Path Parameters**: `id` (UUID) - User identifier
- **Response**: `Message` model with success confirmation
- **Logic**:
  - Soft delete (set is_active=False) to preserve data integrity
  - Cascade behavior handled by database constraints
- **Error Handling**:
  - HTTP 404 if user not found
  - HTTP 403 if user not admin
  - HTTP 400 if trying to delete the last admin user

**🔑 PUT /users/{id}/role** - Change user role (admin only)
- **Purpose**: Administrative endpoint to promote/demote users
- **Authentication**: Required (CurrentAdminUser dependency - admin only)
- **Path Parameters**: `id` (UUID) - User identifier
- **Request Body**: `{"role": "admin" | "creator"}`
- **Response**: `UserPublic` model
- **Logic**:
  - Validate new role is valid UserRole enum value
  - Prevent demoting the last admin user
  - Update user role and timestamp
- **Error Handling**:
  - HTTP 404 if user not found
  - HTTP 403 if user not admin
  - HTTP 400 for invalid role or business rule violations

**Additional User Endpoints**:

**👤 GET /users/me** - Get current user profile
- **Purpose**: Convenience endpoint for authenticated users to get their own profile
- **Authentication**: Required (CurrentActiveUser dependency)
- **Response**: `UserPublic` model
- **Logic**: Return current authenticated user's profile
- **Error Handling**: HTTP 401 if not authenticated

**🔒 PUT /users/me/password** - Change current user password
- **Purpose**: Allow users to change their own password
- **Authentication**: Required (CurrentActiveUser dependency)
- **Request Body**: `UpdatePassword` model (current_password, new_password)
- **Response**: `Message` model with success confirmation
- **Logic**:
  - Verify current password
  - Hash new password
  - Update user record
- **Error Handling**:
  - HTTP 400 if current password is incorrect
  - HTTP 400 for password validation errors

**Key Implementation Features**:
- ✅ **CRUD operations**: All user CRUD functions already exist in `app/crud.py`
- ✅ **Models**: `UserUpdate`, `UserPublic`, `UsersPublic`, `UpdatePassword` ready
- ✅ **Dependencies**: `SessionDep`, `CurrentActiveUser`, `CurrentAdminUser` available
- ✅ **Role management**: `UserRole` enum for role-based access control
- ✅ **Password handling**: Secure password hashing already implemented

**Security Considerations**:
- Admin-only endpoints properly protected
- Self-service profile management with proper authorization
- Password change with current password verification
- Role management restricted to admins only
- Soft deletes to maintain data integrity
- Protection against removing last admin user

#### 7.3 Implementation Strategy & Best Practices

**Development Approach**:
1. **Competition endpoints first** - Implement all competition CRUD operations
2. **User management second** - Implement user profile and admin endpoints
3. **Comprehensive testing** - Test all endpoints with various scenarios
4. **Documentation updates** - Ensure OpenAPI docs are complete

**Code Quality Standards**:
- ✅ **Type safety**: Full type hints with Pydantic models
- ✅ **Error handling**: Comprehensive HTTP error responses
- ✅ **Input validation**: Pydantic model validation for all inputs
- ✅ **Security**: Proper authentication and authorization
- ✅ **Performance**: Pagination for list endpoints
- ✅ **Documentation**: OpenAPI schema generation

**Testing Strategy**:
- **Unit tests**: Test CRUD operations and business logic
- **Integration tests**: Test API endpoints with authentication
- **Authorization tests**: Verify role-based access control
- **Error handling tests**: Test error scenarios and edge cases
- **Performance tests**: Test pagination and filtering

**Common Patterns**:
- Use existing CRUD functions from `app/crud.py`
- Leverage authentication dependencies from `app/api/deps.py`
- Follow FastAPI best practices for error handling
- Use Pydantic models for request/response validation
- Implement proper HTTP status codes
- Add comprehensive API documentation

**File Structure**:
```
app/api/routes/
├── competitions.py  # ❌ TO IMPLEMENT (Phase 7.1)
├── users.py        # ❌ TO IMPLEMENT (Phase 7.2)
├── auth.py         # ✅ COMPLETED
├── health.py       # ✅ COMPLETED
└── utils.py        # ✅ COMPLETED
```

### Phase 8: Advanced Features (Priority: LOW)

#### 8.1 Recommendation Engine
#### 8.2 Email Integration  
#### 8.3 Testing Framework

## Implementation Priority Order

### Week 1: Fix Critical Blocking Issues ✅ **COMPLETED**
1. ✅ Create `app/models/__init__.py` (fix imports)
2. ✅ Create `app/crud.py` (fix db.py dependency)  
3. ✅ Create `app/api/deps.py` (session dependency)
4. ✅ Set up Alembic configuration
5. ✅ Create initial database migration

### Week 2: Basic Application ✅ **COMPLETED**  
6. ✅ Configure FastAPI app properly
7. ✅ Set up basic API router structure
8. ✅ Test database connectivity
9. ✅ Verify basic CRUD operations
10. ✅ Complete modular API structure with all route modules

### Week 3-4: Authentication & Security ✅ **COMPLETED**
10. ✅ **COMPLETED**: Implement security utilities (Phase 6.1)
11. ✅ **COMPLETED**: Create authentication dependencies (Phase 6.2)
12. ✅ **COMPLETED**: Build authentication routes (Phase 6.3)

### Week 5-6: Core API (Phase 7) 🎯 **CURRENT SPRINT**
13. ❌ **TO IMPLEMENT**: Competition CRUD API routes (`app/api/routes/competitions.py`)
    - GET /competitions (list with filtering/pagination)
    - GET /competitions/{id} (competition details)
    - POST /competitions (create - authenticated users)
    - PUT /competitions/{id} (update - owner/admin)
    - DELETE /competitions/{id} (delete - owner/admin)
14. ❌ **TO IMPLEMENT**: User management API routes (`app/api/routes/users.py`)
    - GET /users (list - admin only)
    - GET /users/{id} (user profile - self/admin)
    - PUT /users/{id} (update profile - self/admin)
    - DELETE /users/{id} (delete - admin only)
    - PUT /users/{id}/role (change role - admin only)
    - GET /users/me (current user profile)
    - PUT /users/me/password (change password)
15. ❌ **TO IMPLEMENT**: Enhanced filtering and search capabilities
    - Competition filtering by format, scale, dates, location
    - User filtering and search in admin panel
    - Proper pagination with count metadata

### Week 7-8: Advanced Features
16. ❌ Recommendation engine
17. ❌ Email integration
18. ❌ Comprehensive testing

## Environment Variables Required

✅ **COMPLETED** - `.env` file created with all required variables

## Next Immediate Actions (HIGH PRIORITY) 🎯

**Phase 6 Authentication & Security Complete!** Now implementing **Phase 7: Core API Endpoints**.

### Phase 7.1: Competition CRUD Routes (Priority: CRITICAL)

**Immediate Next Steps:**
1. ❌ **TO IMPLEMENT**: `app/api/routes/competitions.py` - Replace placeholder with full CRUD implementation
2. ❌ **TO IMPLEMENT**: Competition endpoints with proper authentication/authorization
3. ❌ **TO IMPLEMENT**: Input validation and error handling for all competition operations
4. ❌ **TO IMPLEMENT**: Filtering and pagination for competition listing
5. ❌ **TO IMPLEMENT**: Owner/admin authorization checks for modification operations

### Phase 7.2: User Management Routes (Priority: HIGH)

**Following Steps:**
6. ❌ **TO IMPLEMENT**: `app/api/routes/users.py` - Replace placeholder with full user management
7. ❌ **TO IMPLEMENT**: User profile endpoints with self/admin authorization
8. ❌ **TO IMPLEMENT**: Admin-only user management operations
9. ❌ **TO IMPLEMENT**: Role management with proper business rule validation
10. ❌ **TO IMPLEMENT**: Password change functionality with verification

### Development Strategy for Phase 7

**Step 1: Preparation (Ready ✅)**
- ✅ All CRUD functions exist in `app/crud.py`
- ✅ All API models ready (`CompetitionCreate`, `CompetitionUpdate`, `UserUpdate`, etc.)
- ✅ Authentication dependencies available (`CurrentActiveUser`, `CurrentAdminUser`)
- ✅ Database schema and migrations working
- ✅ Docker development environment operational

**Step 2: Competition API Implementation**
1. Implement GET /competitions with filtering and pagination
2. Implement GET /competitions/{id} for competition details
3. Implement POST /competitions for authenticated creation
4. Implement PUT /competitions/{id} with owner/admin authorization
5. Implement DELETE /competitions/{id} with owner/admin authorization
6. Test all endpoints with various authentication scenarios

**Step 3: User Management Implementation**
1. Implement GET /users (admin only) with pagination
2. Implement GET /users/{id} with self/admin authorization
3. Implement PUT /users/{id} with self/admin authorization
4. Implement DELETE /users/{id} (admin only)
5. Implement PUT /users/{id}/role (admin only) with business rules
6. Implement GET /users/me and PUT /users/me/password
7. Test all endpoints with role-based access control

**Step 4: Testing & Validation**
1. Test all endpoints with Postman/curl
2. Verify authentication and authorization
3. Test error handling and edge cases
4. Validate OpenAPI documentation
5. Performance test pagination and filtering

**Current Status Summary**: 
- ✅ **Foundation (Phases 1-3)**: Complete database, models, CRUD operations
- ✅ **Database (Phase 4)**: Schema, migrations, admin user, Docker integration
- ✅ **Application (Phase 5)**: FastAPI app, router structure, health/utils endpoints
- ✅ **Authentication (Phase 6)**: Complete JWT auth system with signup/login/refresh
- 🎯 **Core API (Phase 7)**: **READY TO IMPLEMENT** - All building blocks in place
- 🚀 **Ready to build**: Competition and user management API endpoints

**All Prerequisites Complete - Ready for Phase 7 Implementation!** 