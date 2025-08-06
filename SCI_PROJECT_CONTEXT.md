# Science Competitions Insight (SCI) - Project Context

## Project Overview

**Purpose**: Full-stack web application for showcasing, managing, and recommending science & technology competitions worldwide. Connects content creators, administrators, and end users with AI-powered recommendations.

**Key Users**:
- **End User**: Browse competitions, search/filter, use recommendation wizard (no account needed)
- **Content Creator**: Authenticated users who create/edit/delete competition postings
- **Administrator**: Manage all competitions, user accounts, moderate content, view analytics

## Technology Stack

### Backend
- **Framework**: FastAPI with ASGI (Uvicorn)
- **Database**: PostgreSQL with SQLModel (SQLAlchemy + Pydantic)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: AWS S3 for image storage
- **Package Manager**: UV
- **Testing**: Pytest
- **Deployment**: Docker Compose

### Frontend (Planned)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **State Management**: TanStack React Query
- **UI Library**: Chakra UI
- **Forms**: React Hook Form with Zod
- **HTTP Client**: Axios
- **Styling**: TailwindCSS
- **Animations**: Framer Motion

### Infrastructure
- **Hosting**: AWS EC2 (Ubuntu 22.04)
- **Storage**: AWS S3
- **Reverse Proxy**: Nginx with HTTPS
- **DNS**: Route 53
- **Container Registry**: GitHub Container Registry

## Database Schema

### User Model
```python
class User(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    full_name: str | None
    role: UserRole = Field(default=UserRole.CREATOR)  # ADMIN, CREATOR
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    competitions: list["Competition"] = Relationship(back_populates="owner")
```

### Competition Model
```python
class Competition(SQLModel, table=True):
    id: uuid.UUID = Field(primary_key=True)
    title: str = Field(min_length=1, max_length=255)
    description: str | None
    competition_link: str | None
    official_url: str | None
    background_image_url: str | None
    description_images: list[str] = Field(default=[], sa_column=Column(JSON))
    location: str | None
    area: str | None  # Scientific discipline: Physics, Chemistry, Biology, etc.
    format: CompetitionFormat | None  # ONLINE, OFFLINE, HYBRID
    scale: CompetitionScale | None    # PROVINCIAL, REGIONAL, INTERNATIONAL
    start_date: datetime | None
    end_date: datetime | None
    registration_deadline: datetime | None
    target_age_min: int | None
    target_age_max: int | None
    prize_structure: dict = Field(default={}, sa_column=Column(JSON))
    eligibility_text: str | None
    is_active: bool = True
    is_featured: bool = False
    is_approved: bool = False  # For content moderation
    view_count: int = 0
    owner_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime
    updated_at: datetime
```

## API Endpoints

### Authentication (5 endpoints)
- `POST /auth/signup` - User registration (creators only)
- `POST /auth/login` - OAuth2 login with JWT
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset confirmation

### Competition Management (6 endpoints)
- `GET /competitions` - List competitions with filtering/pagination (public)
- `GET /competitions/{id}` - Get competition details (public)
- `POST /competitions` - Create competition (authenticated creators)
- `PUT /competitions/{id}` - Update competition (owner/admin)
- `DELETE /competitions/{id}` - Delete competition (owner/admin)
- `GET /competitions/search` - Advanced search with full-text (public)

### User Management (5 endpoints)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `PUT /users/me/password` - Change password
- `GET /users` - List users (admin only)
- `DELETE /users/{id}` - Delete user (admin only)

### Recommendations (1 endpoint)
- `POST /recommendations` - Get personalized recommendations (stateless, no auth required)

### File Upload (3 endpoints)
- `POST /upload/images` - Upload competition image (authenticated)
- `DELETE /upload/images/{image_url}` - Delete uploaded image (authenticated)
- `GET /upload/images/status` - Get upload service status (public)

### Admin (3 endpoints)
- `GET /admin/competitions/pending` - Get pending approvals (admin only)
- `PUT /admin/competitions/{id}/approve` - Approve competition (admin only)
- `GET /admin/analytics` - Get platform analytics (admin only)

### System (3 endpoints)
- `GET /health` - Health check
- `GET /info` - API information

**Total**: 24 endpoints (focused on core functionality)

## Core Features

### End User Features (Public Access)
1. **Competition Discovery**
   - Browse all approved competitions with pagination
   - Advanced search with full-text search capabilities
   - Filter competitions by format (online/offline/hybrid), scale (provincial/regional/international), area (scientific discipline), location, date range
   - Sort competitions by relevance, date, popularity

2. **Competition Details**
   - View comprehensive competition information
   - See competition images and media
   - View prize structure and eligibility criteria
   - View competition registration deadline countdown timer
   - Access official competition links and resources

3. **AI-Powered Recommendations**
   - Interactive recommendation wizard
   - Input age, interests, location, academic level
   - Receive personalized competition suggestions
   - Get explanations for why competitions are recommended

4. **Search & Navigation**
   - Real-time search with debouncing
   - Featured competitions carousel
   - Recent and upcoming competitions

### Content Creator Features (Authenticated)
1. **Competition Management**
   - Create new competition listings with rich media
   - Edit existing competitions (owner only)
   - Delete competitions (owner only)
   - Preview competitions before submission

2. **Content Creation**
   - Competition creation form to define competition's configuration
   - Rich text editor for descriptions and eligibility
   - Image upload with preview and editing

3. **Profile Management**
   - Update personal information
   - Change password securely
   - View competition creation history

### Administrator Features (Authenticated)
1. **Content Moderation**
   - Review pending competition submissions
   - Approve or reject competitions with feedback
   - Manage competition visibility and featured status
   - Monitor content quality and compliance

2. **User Management**
   - View all registered users
   - Manage user roles (creator/admin)
   - Deactivate problematic accounts
   - Monitor user activity and engagement

3. **Platform Analytics**
   - View competition statistics and trends
   - Monitor user engagement metrics
   - Track popular competitions and categories
   - Generate platform usage reports


### Technical Features
1. **Authentication & Security**
   - JWT-based authentication for creators and admins
   - Role-based access control (ADMIN, CREATOR)
   - Secure password reset functionality
   - CORS configuration for frontend integration

2. **File Management**
   - AWS S3 integration for image storage
   - Image optimization and compression
   - Support for multiple image formats (JPG/JPEG, PNG, WebP)
   - Secure file upload with validation

3. **Database & Performance**
   - PostgreSQL with SQLModel for type-safe operations
   - Efficient querying with proper indexing
   - Pagination for large datasets
   - Database migrations with Alembic

4. **API & Integration**
   - RESTful API with comprehensive endpoints
   - OpenAPI documentation with Swagger UI
   - LLM integration for recommendation engine
   - Error handling and validation

5. **Deployment & DevOps**
   - Docker containerization for consistent environments
   - Docker Compose for local development
   - Environment-based configuration
   - Health checks and monitoring

### User Experience Features
1. **Responsive Design**
   - Mobile-first responsive layout
   - Optimized for all screen sizes
   - Touch-friendly interface elements

2. **Performance**
   - Fast loading times with optimized assets
   - Efficient data fetching and caching
   - Smooth animations and transitions

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast mode support

## Environment Configuration

### Required Environment Variables
```bash
# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Science Competitions Insight
ENVIRONMENT=local

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=4320    # 3 days
EMAIL_RESET_TOKEN_EXPIRE_MINUTES=30 # 30 minutes

# Database
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=sci_db

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5432"]
FRONTEND_HOST=http://localhost:3000

# AWS S3 (for file upload)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=sci-competition-images
S3_BUCKET_URL=https://sci-competition-images.s3.us-east-1.amazonaws.com

# LLM API (for recommendations)
LLM_API_KEY=your-llm-api-key
LLM_API_URL=https://api.openai.com/v1/chat/completions

# Admin User
FIRST_SUPERUSER=admin@sci.com
FIRST_SUPERUSER_PASSWORD=admin-password
```

## Docker Configuration

### Services
- **db**: PostgreSQL 17.5 with health checks
- **backend**: FastAPI application with UV package manager

### Volumes
- `app-db-data`: PostgreSQL data persistence

## Development Setup

### Backend Dependencies
```toml
dependencies = [
    "alembic>=1.16.4",
    "asyncpg>=0.30.0",
    "boto3>=1.34.0",
    "email-validator>=2.2.0",
    "emails>=0.6",
    "fastapi[standard]>=0.116.1",
    "jinja2>=3.1.6",
    "mypy>=1.17.0",
    "passlib[bcrypt]>=1.7.4",
    "bcrypt>=4.0.1",
    "psycopg2-binary>=2.9.9",
    "pydantic-settings>=2.10.1",
    "pillow>=10.0.0",
    "pyjwt>=2.10.1",
    "pytest>=8.4.1",
    "python-multipart>=0.0.20",
    "ruff>=0.12.3",
    "sentry-sdk[fastapi]>=2.33.0",
    "sqlmodel>=0.0.24",
    "httpx>=0.25.0",  # For LLM API calls
]
```

## Security Features

### Authentication
- JWT tokens with configurable expiration
- bcrypt password hashing with salt
- Role-based access control

### Authorization
- Owner-based competition access
- Admin override capabilities
- Content moderation workflow

### Input Validation
- Pydantic model validation
- Email format validation
- Password strength requirements
- File type and size validation

### CORS Configuration
- Configurable allowed origins
- Proper CORS headers
- Frontend host integration

## File Structure

```
sci-project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── competitions.py
│   │   │   │   ├── users.py
│   │   │   │   ├── recommendations.py
│   │   │   │   ├── admin.py
│   │   │   │   ├── upload.py
│   │   │   │   ├── health.py
│   │   │   │   └── utils.py
│   │   │   ├── deps.py
│   │   │   └── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── db.py
│   │   │   ├── security.py
│   │   │   └── upload.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── competition.py
│   │   │   ├── common.py
│   │   │   └── __init__.py
│   │   ├── crud.py
│   │   └── main.py
│   ├── alembic/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── alembic.ini
├── docker-compose.yml
└── .env
```

## Next Steps for Fresh Start

### Phase 1: Foundation
1. Set up project structure with FastAPI + SQLModel
2. Configure PostgreSQL database
3. Implement basic models (User, Competition)
4. Set up Alembic migrations
5. Create basic CRUD operations

### Phase 2: Authentication & Core API
1. Implement JWT authentication
2. Add user registration/login endpoints
3. Set up role-based authorization
4. Implement competition CRUD endpoints
5. Add file upload system

### Phase 3: Advanced Features
1. Implement recommendation system (LLM integration)
2. Add content moderation workflow
3. Add search functionality
4. Implement basic analytics

### Phase 4: Frontend
1. Set up React + TypeScript + Vite
2. Implement authentication flow (creators/admins)
3. Create competition listing and details (public)
4. Build recommendation wizard (public)
5. Build admin dashboard

## Key Implementation Notes

### Database Relationships
- User has many Competitions (one-to-many)
- Competition belongs to User (many-to-one)

### Authentication Flow
1. Creator/Admin registers/logs in → receives JWT token
2. Token included in Authorization header for protected endpoints
3. Token expires after 8 days → re-login required

### Content Moderation Flow
1. Creator submits competition → status: pending
2. Admin reviews → approves/rejects
3. Approved competitions → visible to users
4. Rejected competitions → returned to creator with feedback

### Recommendation Flow (Stateless)
1. **Frontend**: User fills recommendation form (age, interests, location, etc.)
2. **Backend**: `POST /recommendations` receives form data
3. **Backend**: Calls LLM API with form data + competition database
4. **Backend**: Returns recommended competitions
5. **No database storage** - completely stateless

### User Access Patterns
- **End Users**: Browse competitions, search, get recommendations (no account needed)
- **Creators**: Create/edit competitions, manage their content (account required)
- **Admins**: Moderate content, manage users, view analytics (account required)
