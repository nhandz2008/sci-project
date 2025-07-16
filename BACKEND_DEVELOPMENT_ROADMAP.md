# SCI Backend Development Roadmap

This document outlines the next steps for developing the Science Competitions Insight (SCI) backend, following FastAPI template best practices and project-specific requirements.

## Current State Assessment

### ✅ Already Complete
- Basic FastAPI project structure
- UV package manager setup
- Docker configuration with docker-compose
- Alembic migrations framework setup
- Basic dependencies in pyproject.toml

### ❌ Missing Components
- Project configuration management
- Database models and relationships
- Authentication and authorization system
- API route structure
- CRUD operations
- Email functionality
- Testing framework
- Security implementation
- Dependency injection system

## Development Roadmap

### Phase 1: Foundation Setup (Priority: High)

#### 1.1 Update Dependencies [[memory:3044626]]
**Objective**: Align dependencies with FastAPI template best practices

**Current pyproject.toml Dependencies:**
```toml
dependencies = [
    "alembic>=1.16.4",
    "asyncpg>=0.30.0", 
    "fastapi[standard]>=0.116.1",
    "sqlmodel>=0.0.24",
]
```

**Required Additional Dependencies:**
- `pydantic-settings` - Settings management
- `python-multipart` - Form data handling
- `email-validator` - Email validation
- `passlib[bcrypt]` - Password hashing
- `pyjwt` - JWT token handling
- `jinja2` - Email templates
- `emails` - Email sending
- `sentry-sdk[fastapi]` - Error monitoring
- `pytest` & testing dependencies
- `mypy` & `ruff` - Code quality tools

**Action Items:**
1. Update pyproject.toml with comprehensive dependencies
2. Run `uv sync` to install new dependencies
3. Add development dependencies for testing and linting

#### 1.2 Configuration Management
**Objective**: Implement robust settings and environment management

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/core/config.py`

**Required Files:**
- `app/core/config.py` - Settings class with Pydantic settings
- `app/core/__init__.py` - Core module initialization
- Project root `.env` file for environment variables

**Settings to Implement:**
```python
class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Science Competitions Insight"
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = []
    FRONTEND_HOST: str = "http://localhost:5173"
    
    # Email (optional for MVP)
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
```

#### 1.3 Database Engine Setup
**Objective**: Establish database connection and session management

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/core/db.py`

**Required Components:**
- Database engine creation with PostgreSQL
- Session dependency for dependency injection
- Database initialization function

### Phase 2: Data Models (Priority: High)

#### 2.1 Core Models Implementation
**Objective**: Implement SQLModel models for SCI domain

**Based on context.md requirements:**

**User Model:**
```python
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=255)
    is_active: bool = True
    role: UserRole = UserRole.CREATOR  # Enum: ADMIN, CREATOR
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    competitions: list["Competition"] = Relationship(back_populates="creator")
```

**Competition Model:**
```python
class CompetitionBase(SQLModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=2000)
    area: str = Field(max_length=100)  # e.g., "Physics", "Chemistry"
    scale: CompetitionScale  # Enum: GLOBAL, REGIONAL, LOCAL
    location: str = Field(max_length=255)
    start_date: date
    end_date: date
    registration_deadline: date
    age_min: int | None = None
    age_max: int | None = None
    official_url: str | None = None
    prize_structure: dict[str, Any] = Field(default_factory=dict)  # JSON field
    eligibility_text: str | None = None
    images: list[str] = Field(default_factory=list)  # JSON array of image URLs

class Competition(CompetitionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    creator_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    creator: User | None = Relationship(back_populates="competitions")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Recommendation Profile Model:**
```python
class RecommendationProfile(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    age: int
    gpa: float | None = None
    achievements_text: str | None = None
    interests: list[str] = Field(default_factory=list)  # JSON array
    scale_preference: list[str] = Field(default_factory=list)  # JSON array
    school_type: str | None = None
```

**Enums:**
```python
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CREATOR = "CREATOR"

class CompetitionScale(str, Enum):
    GLOBAL = "GLOBAL"
    REGIONAL = "REGIONAL" 
    LOCAL = "LOCAL"
```

#### 2.2 Pydantic Response Models
**Objective**: Create API response schemas

**Required Models:**
- `UserPublic`, `UserCreate`, `UserUpdate`
- `CompetitionPublic`, `CompetitionCreate`, `CompetitionUpdate`
- `CompetitionsPublic` (with pagination)
- `Message` (generic response)
- `TokenPayload` (JWT)

### Phase 3: Authentication & Security (Priority: High)

#### 3.1 Security Core
**Objective**: Implement password hashing and JWT handling

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/core/security.py`

**Required Functions:**
- `get_password_hash(password: str) -> str`
- `verify_password(plain_password: str, hashed_password: str) -> bool`
- `create_access_token(subject: str) -> str`
- `verify_token(token: str) -> TokenPayload`

#### 3.2 Authentication Dependencies
**Objective**: Create FastAPI dependencies for authentication

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/api/deps.py`

**Required Dependencies:**
- `SessionDep` - Database session dependency
- `get_current_user` - Extract user from JWT token
- `get_current_active_user` - Ensure user is active
- `get_current_admin_user` - Admin-only endpoints

#### 3.3 OAuth2 Setup
**Objective**: Configure OAuth2 password flow

**Components:**
- OAuth2PasswordBearer configuration
- Token URL setup
- CORS middleware configuration

### Phase 4: API Routes Structure (Priority: High)

#### 4.1 Router Organization
**Objective**: Create modular API route structure

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/api/`

**Required Route Files:**
```
app/api/
├── main.py              # Main API router
├── deps.py              # Dependencies
└── routes/
    ├── auth.py          # Authentication endpoints
    ├── users.py         # User management
    ├── competitions.py  # Competition CRUD
    ├── recommendations.py # Recommendation engine
    └── utils.py         # Utility endpoints
```

#### 4.2 Authentication Routes
**File**: `app/api/routes/auth.py`

**Endpoints:**
- `POST /auth/signup` - Creator registration
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token

#### 4.3 Competition Routes  
**File**: `app/api/routes/competitions.py`

**Endpoints Based on context.md:**
- `GET /competitions` - List with filters (public)
- `GET /competitions/{id}` - Get competition details (public)
- `POST /competitions` - Create competition (Creator/Admin)
- `PUT /competitions/{id}` - Update competition (Creator/Admin)
- `DELETE /competitions/{id}` - Delete competition (Creator/Admin)

**Query Parameters for Filtering:**
- `skip`, `limit` - Pagination
- `area` - Subject area filter
- `scale` - Competition scale filter
- `location` - Location filter
- `search` - Text search in title/description

#### 4.4 User Management Routes
**File**: `app/api/routes/users.py`

**Endpoints:**
- `GET /users` - List users (Admin only)
- `PUT /users/{id}/role` - Change user role (Admin only)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile

#### 4.5 Recommendations Routes
**File**: `app/api/routes/recommendations.py`

**Endpoints:**
- `POST /recommendations` - Get recommendations for profile

### Phase 5: CRUD Operations (Priority: Medium)

#### 5.1 Database Operations
**Objective**: Implement reusable CRUD functions

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/crud.py`

**Required Functions:**
- `create_user(session: Session, user_create: UserCreate) -> User`
- `get_user_by_email(session: Session, email: str) -> User | None`
- `create_competition(session: Session, competition: CompetitionCreate, creator_id: UUID) -> Competition`
- `get_competitions(session: Session, skip: int, limit: int, **filters) -> list[Competition]`
- `update_competition(session: Session, competition_id: UUID, competition_update: CompetitionUpdate) -> Competition`

#### 5.2 Recommendation Engine
**Objective**: Implement basic rule-based recommendation system

**Location**: `app/core/recommendations.py`

**Algorithm Components:**
- Age matching scoring
- Subject area interest matching
- GPA-based difficulty matching
- Competition scale preference
- Location proximity scoring

### Phase 6: Database Migrations (Priority: Medium)

#### 6.1 Initial Migration
**Objective**: Create database schema migration

**Steps:**
1. Remove any existing migration files in `app/alembic/versions/`
2. Create initial migration: `alembic revision --autogenerate -m "Initial SCI models"`
3. Review generated migration file
4. Apply migration: `alembic upgrade head`

#### 6.2 Seed Data
**Objective**: Create initial admin user and sample data

**File**: `app/initial_data.py`

**Components:**
- Create first admin user from environment variables
- Optional: Create sample competitions for development

### Phase 7: Application Setup (Priority: Medium)

#### 7.1 Main Application
**Objective**: Update main.py with full FastAPI configuration

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/main.py`

**Updates Required:**
- Import all routers
- Configure CORS middleware
- Add OpenAPI documentation configuration
- Include all API routers with proper prefixes

#### 7.2 Startup Configuration
**Objective**: Configure application startup

**Components:**
- Database initialization
- Admin user creation
- Health check endpoint enhancement

### Phase 8: Testing Framework (Priority: Low)

#### 8.1 Test Setup
**Objective**: Implement comprehensive testing

**Template Reference**: `.references/full-stack-fastapi-template/backend/app/tests/`

**Test Structure:**
```
app/tests/
├── conftest.py          # Test configuration
├── test_auth.py         # Authentication tests
├── test_competitions.py # Competition API tests
├── test_users.py        # User management tests
└── utils/
    ├── user.py          # User test utilities
    └── utils.py         # General test utilities
```

#### 8.2 Test Database
**Objective**: Configure isolated test database

**Components:**
- Separate test database configuration
- Test fixtures for sample data
- Database cleanup between tests

### Phase 9: Email Integration (Priority: Low - Optional for MVP)

#### 9.1 Email Templates
**Objective**: Create email notification system

**Components:**
- Welcome email for new users
- Password reset emails
- Competition deadline reminders

#### 9.2 Email Utilities
**File**: `app/utils.py`

**Functions:**
- `send_email(email_to: str, subject: str, html_content: str)`
- `generate_new_account_email(email_to: str, username: str)`

## Implementation Priority Order

### Week 1-2: Core Foundation
1. ✅ Update dependencies in pyproject.toml
2. ✅ Implement configuration management (config.py)
3. ✅ Set up database engine and session management
4. ✅ Create core data models (User, Competition, RecommendationProfile)

### Week 3-4: Authentication & Security  
5. ✅ Implement security utilities (password hashing, JWT)
6. ✅ Create authentication dependencies
7. ✅ Build authentication routes (signup, login)
8. ✅ Test authentication flow

### Week 5-6: Core API
9. ✅ Implement competition CRUD operations
10. ✅ Create competition API routes with filtering
11. ✅ Implement user management routes
12. ✅ Update main.py with full configuration

### Week 7-8: Advanced Features
13. ✅ Create database migrations
14. ✅ Implement basic recommendation engine
15. ✅ Add recommendation API routes
16. ✅ Create initial data seeding

### Week 9-10: Quality & Testing
17. ✅ Set up testing framework
18. ✅ Write comprehensive API tests
19. ✅ Add error handling and validation
20. ✅ Performance optimization

## Environment Variables Required

Create `.env` file in project root:

```env
# Project
PROJECT_NAME=Science Competitions Insight
ENVIRONMENT=local

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=sci_db

# CORS
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_HOST=http://localhost:5173

# Admin User
FIRST_SUPERUSER=admin@sci.com
FIRST_SUPERUSER_PASSWORD=changethis

# Email (Optional)
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@sci.com
```

## File Structure After Implementation

```
backend/
├── app/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 001_initial_models.py
│   │   └── env.py
│   ├── api/
│   │   ├── deps.py
│   │   ├── main.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── competitions.py
│   │       ├── recommendations.py
│   │       ├── users.py
│   │       └── utils.py
│   ├── core/
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── recommendations.py
│   │   └── security.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_competitions.py
│   │   └── test_users.py
│   ├── crud.py
│   ├── initial_data.py
│   ├── main.py
│   ├── models.py
│   └── utils.py
├── scripts/
├── .env
├── alembic.ini
├── Dockerfile
├── pyproject.toml
└── uv.lock
```

## Next Immediate Actions

1. **Start with Phase 1.1**: Update pyproject.toml dependencies
2. **Create .env file** with required environment variables  
3. **Implement core configuration** (app/core/config.py)
4. **Set up database connection** (app/core/db.py)
5. **Create data models** (app/models.py)

Each phase should be implemented and tested before moving to the next phase to ensure a solid foundation for the SCI backend application. 