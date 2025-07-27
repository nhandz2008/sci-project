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

#### 5.1 FastAPI Application Configuration ❌ **HIGH PRIORITY**
**Objective**: Properly configure FastAPI app

**Current State**: Only basic health check endpoint

**Required Updates to `app/main.py`**:
- CORS middleware configuration
- API versioning setup
- Error handling middleware
- OpenAPI documentation
- Lifespan events for database initialization

#### 5.2 Basic API Router Structure ❌ **HIGH PRIORITY**
**Objective**: Set up modular routing system

**Required Files**:
```
app/api/
├── main.py              # Main API router  
├── deps.py              # Dependencies (session, etc.)
└── routes/
    ├── __init__.py      # Router exports
    ├── health.py        # Health check endpoints
    └── utils.py         # Utility endpoints
```

**Initial Endpoints**:
- `GET /api/v1/health` - Health check
- `GET /api/v1/utils/test-db` - Database connection test

### Phase 6: Authentication & Security (Priority: MEDIUM)

#### 6.1 Security Core
**Objective**: Implement password hashing and JWT handling

**Required Files**: `app/core/security.py`
**Functions**: password hashing, JWT creation/verification

#### 6.2 Authentication Dependencies  
**Objective**: Add auth dependencies to `app/api/deps.py`

**Dependencies**: current user, active user, admin user

#### 6.3 Authentication Routes
**Objective**: Create auth endpoints

**Routes**: signup, login, token refresh

### Phase 7: Core API Endpoints (Priority: MEDIUM)

#### 7.1 Competition CRUD Routes
**File**: `app/api/routes/competitions.py`
**Endpoints**: GET, POST, PUT, DELETE for competitions

#### 7.2 User Management Routes  
**File**: `app/api/routes/users.py`
**Endpoints**: User profile, user management

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

### Week 2: Basic Application ❌ **HIGH PRIORITY**  
6. ❌ Configure FastAPI app properly
7. ❌ Set up basic API router structure
8. ✅ Test database connectivity
9. ✅ Verify basic CRUD operations

### Week 3-4: Authentication & Security
10. ❌ Implement security utilities
11. ❌ Create authentication dependencies
12. ❌ Build authentication routes

### Week 5-6: Core API
13. ❌ Implement competition API routes
14. ❌ Implement user management routes
15. ❌ Add filtering and pagination

### Week 7-8: Advanced Features
16. ❌ Recommendation engine
17. ❌ Email integration
18. ❌ Comprehensive testing

## Environment Variables Required

✅ **COMPLETED** - `.env` file created with all required variables

## Next Immediate Actions (HIGH PRIORITY)

**Phase 4 is complete! The following items are ready for Phase 5 development:**

1. ✅ **COMPLETED**: Create `app/models/__init__.py` to fix broken imports
2. ✅ **COMPLETED**: Create `app/crud.py` to provide functions referenced in `db.py`  
3. ✅ **COMPLETED**: Create `app/api/deps.py` for database session dependency
4. ✅ **COMPLETED**: Set up Alembic configuration and create initial migration
5. 🚀 **NEXT**: Update `app/main.py` to properly configure FastAPI

**Phase 4 Foundation Complete!** The database is fully operational and ready for Phase 5 development.

**Current Status**: 
- ✅ Database schema created and verified
- ✅ Admin user created and functional
- ✅ CRUD operations working correctly
- ✅ Docker services running properly
- ✅ Migration system operational
- 🚀 Ready to proceed with FastAPI application setup 