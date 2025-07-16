# SCI Backend Development Guide

This guide provides a detailed, step-by-step process for developing the backend of the Science Competitions Insight (SCI) project, following best practices and referencing the structure of `.references/full-stack-fastapi-template`. This includes specific commands, file structures, and implementation details.

---

## 1. Project Initialization

### 1.1 Set Up Project Structure
```bash
# Create the main backend directory and structure
mkdir -p backend/{app,tests,alembic,scripts}
cd backend

# Create app subdirectories
mkdir -p app/{api,models,schemas,core,db,services,utils}

# Create essential files
touch app/{main.py,__init__.py}
touch app/api/{__init__.py,auth.py,competitions.py,users.py,recommendations.py}
touch app/models/{__init__.py,user.py,competition.py,recommendation.py}
touch app/schemas/{__init__.py,user.py,competition.py,recommendation.py,auth.py}
touch app/core/{__init__.py,config.py,security.py,deps.py}
touch app/db/{__init__.py,session.py,init_db.py}
touch app/services/{__init__.py,auth_service.py,competition_service.py,recommendation_service.py}
touch app/utils/{__init__.py,helpers.py}
```

### 1.2 Initialize Version Control
```bash
# Initialize git if not already done
git init

# Create .gitignore
cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite3

# Logs
*.log
logs/

# Docker
.dockerignore
EOF
```

### 1.3 Dependency Management with UV
```bash
# Install UV if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Initialize Python project
uv init --python 3.11

# Add core dependencies
uv add fastapi[standard]
uv add alembic
uv add sqlmodel
# TODO:
uv add asyncpg
uv add passlib[bcrypt]
uv add pyjwt[crypto]
uv add python-multipart
uv add uvicorn[standard]

# Add development dependencies 
# TODO:
uv add --dev pytest
uv add --dev pytest-asyncio
uv add --dev httpx
uv add --dev mypy
uv add --dev ruff
```

### 1.4 Environment Configuration
```bash
# Create .env file for development
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/sci_db

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
PROJECT_NAME=SCI Backend
VERSION=1.0.0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
EOF
```

---

## 2. Database & Models

### 2.1 Database Setup with Docker Compose
```bash
# Create docker-compose.yml for development
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sci_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start the database
docker-compose up -d postgres
```

### 2.2 Core Configuration (app/core/config.py)
Implement Pydantic settings with fields for:
- `DATABASE_URL: str`
- `SECRET_KEY: str`
- `ALGORITHM: str = "HS256"`
- `ACCESS_TOKEN_EXPIRE_MINUTES: int = 30`
- `REFRESH_TOKEN_EXPIRE_DAYS: int = 7`
- `PROJECT_NAME: str = "SCI Backend"`
- `BACKEND_CORS_ORIGINS: List[str]`

### 2.3 SQLModel Models
Create these models with proper relationships:

**User Model (app/models/user.py):**
- Fields: `id`, `email`, `name`, `hashed_password`, `role`, `is_active`, `created_at`, `updated_at`
- Role enum: `ADMIN`, `CREATOR`
- Relationships to competitions (one-to-many)

**Competition Model (app/models/competition.py):**
- Fields: `id`, `title`, `description`, `images`, `start_date`, `end_date`, `registration_deadline`
- Fields: `age_min`, `age_max`, `area`, `scale`, `location`, `prize_structure`, `eligibility_text`
- Fields: `official_url`, `creator_id`, `is_active`, `created_at`, `updated_at`
- Foreign key to User

**RecommendationProfile Model (app/models/recommendation.py):**
- Fields: `id`, `user_id`, `age`, `gpa`, `achievements_text`, `interests`, `scale_preference`, `school_type`

### 2.4 Database Session Setup (app/db/session.py)
- Configure async SQLAlchemy engine
- Create async session factory
- Implement database connection management

### 2.5 Alembic Configuration
```bash
# Initialize Alembic
alembic init alembic

# Update alembic.ini to point to your database
# Update alembic/env.py to import your models and set target_metadata
```

Create initial migration:
```bash
alembic revision --autogenerate -m "Initial tables"
alembic upgrade head
```

---

## 3. API & Application Structure

### 3.1 FastAPI App Setup (app/main.py)
Implement with:
- Lifespan context manager for startup/shutdown
- CORS middleware configuration
- Error handling middleware
- Request logging middleware
- Router registration with prefixes (`/api/v1/auth`, `/api/v1/competitions`, etc.)

### 3.2 Authentication System

**Security Utils (app/core/security.py):**
- `create_access_token()` - Generate JWT access tokens
- `create_refresh_token()` - Generate JWT refresh tokens
- `verify_password()` - Verify hashed passwords
- `get_password_hash()` - Hash passwords with bcrypt
- `verify_token()` - Validate JWT tokens

**Dependencies (app/core/deps.py):**
- `get_current_user()` - Extract user from JWT token
- `get_current_active_user()` - Ensure user is active
- `require_admin()` - Admin-only route protection
- `require_creator()` - Creator+ route protection

**Auth Routes (app/api/auth.py):**
```
POST /api/v1/auth/signup
- Body: email, name, password, confirm_password
- Response: user info + tokens

POST /api/v1/auth/login
- Body: email, password
- Response: user info + tokens

POST /api/v1/auth/refresh
- Body: refresh_token
- Response: new access_token

POST /api/v1/auth/logout
- Header: Authorization Bearer token
- Response: success message
```

### 3.3 Competition Management

**Competition Routes (app/api/competitions.py):**
```
GET /api/v1/competitions
- Query params: search, area, scale, age_min, age_max, location, page, size
- Response: paginated competition list

GET /api/v1/competitions/{id}
- Response: detailed competition info

POST /api/v1/competitions (Creator+ required)
- Body: competition creation schema
- Response: created competition

PUT /api/v1/competitions/{id} (Creator/Owner or Admin)
- Body: competition update schema
- Response: updated competition

DELETE /api/v1/competitions/{id} (Creator/Owner or Admin)
- Response: success message

GET /api/v1/competitions/{id}/related
- Response: similar competitions based on area/tags
```

### 3.4 User Management

**User Routes (app/api/users.py):**
```
GET /api/v1/users/me
- Header: Authorization Bearer token
- Response: current user profile

PUT /api/v1/users/me
- Header: Authorization Bearer token
- Body: name, email (optional password change)
- Response: updated user profile

GET /api/v1/users (Admin only)
- Query params: page, size, search, role
- Response: paginated user list

PUT /api/v1/users/{id}/role (Admin only)
- Body: new_role
- Response: updated user

DELETE /api/v1/users/{id} (Admin only)
- Response: success message
```

### 3.5 Recommendation System

**Recommendation Routes (app/api/recommendations.py):**
```
POST /api/v1/recommendations/profile
- Body: age, gpa, achievements, interests, preferences
- Response: top 10 recommended competitions with scores

GET /api/v1/recommendations/popular
- Response: most popular competitions (view count/registration)

GET /api/v1/recommendations/trending
- Response: competitions with recent high activity
```

---

## 4. Services & Business Logic

### 4.1 Authentication Service (app/services/auth_service.py)
Implement functions:
- `authenticate_user(email: str, password: str)` - Verify login credentials
- `create_user(user_data: UserCreate)` - Register new user
- `update_user_role(user_id: int, new_role: UserRole)` - Change user permissions

### 4.2 Competition Service (app/services/competition_service.py)
Implement functions:
- `get_competitions_filtered(filters: CompetitionFilters)` - Apply search/filter logic
- `get_related_competitions(competition_id: int)` - Find similar competitions
- `validate_competition_ownership(user: User, competition_id: int)` - Check permissions

### 4.3 Recommendation Service (app/services/recommendation_service.py)
Implement scoring algorithm:
- Age compatibility scoring (0-1 scale)
- GPA/academic level matching
- Interest area alignment
- Geographic preference weighting
- Competition scale preference matching
- Final composite score calculation

---

## 5. Testing Strategy

### 5.1 Test Setup
```bash
# Create test configuration
mkdir tests/{unit,integration,fixtures}
touch tests/{__init__.py,conftest.py}
touch tests/unit/{test_auth.py,test_competitions.py,test_recommendations.py}
touch tests/integration/{test_api_auth.py,test_api_competitions.py}
```

### 5.2 Test Database Setup (tests/conftest.py)
- Configure test database (SQLite or separate PostgreSQL)
- Create async test client fixture
- Setup/teardown test data fixtures
- Mock authentication for protected routes

### 5.3 Test Coverage Areas
- **Unit Tests:** Service functions, utility functions, models
- **Integration Tests:** Full API endpoint workflows
- **Authentication Tests:** Token generation, validation, role enforcement
- **Database Tests:** Model relationships, migrations

Run tests:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_auth.py -v
```

---

## 6. Development Workflow

### 6.1 Database Migrations
```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Add new field to competition"

# Review the generated migration file
# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### 6.2 Development Server
```bash
# Start development server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start with custom environment
ENVIRONMENT=development uvicorn app.main:app --reload
```

### 6.3 Code Quality Checks
```bash
# Format code
ruff format .

# Lint code
ruff check .

# Type checking
mypy app/

# Run all checks
ruff check . && mypy app/ && pytest
```

---

## 7. API Documentation & Validation

### 7.1 Pydantic Schemas
Create comprehensive schemas in `app/schemas/`:
- Request schemas with validation rules
- Response schemas with proper field types
- Error response schemas for consistent error handling

### 7.2 OpenAPI Documentation
- Add detailed docstrings to all route functions
- Include example requests/responses
- Document query parameters and validation rules
- Access interactive docs at `/docs` and `/redoc`

---

## 8. Security Implementation

### 8.1 Input Validation
- Use Pydantic models for all request bodies
- Implement field validators for email, phone, URLs
- Sanitize user inputs to prevent injection attacks
- Set reasonable limits on string lengths and file sizes

### 8.2 Rate Limiting (Optional)
```bash
# Add slowapi for rate limiting
uv add slowapi redis

# Implement rate limiting middleware
# Configure Redis for rate limit storage
```

### 8.3 Security Headers
Implement middleware for:
- CORS with specific origin allowlist
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

---

## 9. Deployment Preparation

### 9.1 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy application
COPY . .

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.2 Production Configuration
- Create `.env.production` with secure values
- Configure production database connection
- Set up proper logging configuration
- Configure health check endpoint (`/health`)

### 9.3 Docker Compose for Full Stack
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/sci_db
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sci_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 10. Monitoring & Maintenance

### 10.1 Logging Configuration
- Configure structured logging with JSON format
- Log authentication events, errors, and performance metrics
- Set up log rotation and retention policies
- Implement request ID tracking for debugging

### 10.2 Health Checks
Create monitoring endpoints:
- `/health` - Basic health check
- `/health/db` - Database connectivity check
- `/metrics` - Application metrics (optional)

### 10.3 Backup Strategy
```bash
# Database backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backups (cron job)
0 2 * * * /path/to/backup_script.sh
```

---

## 11. Performance Optimization

### 11.1 Database Optimization
- Add proper indexes on frequently queried fields
- Implement database connection pooling
- Use async queries for all database operations
- Consider read replicas for heavy read workloads

### 11.2 Caching Strategy (Optional)
```bash
# Add Redis for caching
uv add redis aioredis

# Implement caching for:
# - Popular competitions list
# - User session data
# - Recommendation results
```

### 11.3 API Performance
- Implement pagination for list endpoints
- Use background tasks for heavy operations
- Add response compression middleware
- Monitor and optimize slow queries

---

**Follow this comprehensive guide to build a production-ready SCI backend with proper security, testing, and deployment practices.**

---

## 2. Database & Models

1. **Database Setup**
   - Use PostgreSQL as the primary database.
   - Configure connection settings in `.env` and `core/config.py`.
   - Set up Docker Compose for local development with PostgreSQL service.

2. **Model Design**
   - Define SQLModel models in `models/` for User, Competition, RecommendationProfile, RoleAssignment.
   - Use Pydantic v2 for validation and serialization (via SQLModel).
   - Ensure all models follow the single-source-of-truth principle (no duplicate models).

3. **Migrations**
   - Set up Alembic for schema migrations.
   - Configure Alembic to autogenerate migrations from SQLModel models.
   - Document migration workflow (create, review, apply migrations).

---

## 3. API & Application Structure

1. **FastAPI App Setup**
   - Create `main.py` with FastAPI app instance.
   - Use lifespan context manager for startup/shutdown events (avoid `@app.on_event`).
   - Configure CORS, logging, and error handling middleware.

2. **API Routing**
   - Organize routes in `api/` by resource (e.g., `api/auth.py`, `api/competitions.py`, `api/users.py`, `api/recommendations.py`).
   - Use APIRouter for modular route definitions.
   - Register routers in `main.py` with appropriate prefixes and tags.

3. **Schemas & Validation**
   - Define Pydantic models in `schemas/` for request/response validation.
   - Use type hints and field constraints for all schemas.
   - Document all endpoints with OpenAPI via FastAPI docstrings.

4. **Services & Utilities**
   - Implement business logic in `services/` (e.g., authentication, recommendations).
   - Place reusable helpers in `utils/`.

---

## 4. Authentication & Security

1. **JWT Authentication**
   - Implement OAuth2 password flow with JWT (access + refresh tokens).
   - Use PyJWT for token management and Passlib (bcrypt) for password hashing.
   - Store and validate tokens securely.

2. **Role-Based Access Control (RBAC)**
   - Define roles (ADMIN, CREATOR) and enforce via FastAPI dependencies.
   - Protect routes with role-based dependencies.

3. **Security Best Practices**
   - Sanitize all inputs at API boundaries.
   - Use HTTPS in production (configure behind Nginx reverse proxy).
   - Set secure CORS, CSP, and HSTS headers.
   - Regularly update dependencies and audit for vulnerabilities.

---

## 5. API Endpoints

1. **Implement Core Endpoints**
   - `/auth/signup` and `/auth/login` for authentication.
   - `/competitions` (CRUD) for competition management.
   - `/users` and `/users/{id}/role` for user and role management (admin only).
   - `/recommendations` for recommendation engine.

2. **Validation & Error Handling**
   - Use Pydantic for input validation.
   - Handle errors with HTTPException and custom error responses.
   - Log errors and important events using Python’s logging module.

3. **Testing**
   - Write Pytest tests for all endpoints and core logic.
   - Use test database and fixtures for isolation.
   - Ensure coverage for edge cases and error conditions.

---

## 6. Background Tasks & Scheduled Jobs

1. **Background Tasks**
   - Use FastAPI’s BackgroundTasks for non-blocking operations (e.g., sending emails).

2. **Scheduled Jobs**
   - For periodic tasks, use cron jobs or Python scripts (not built into FastAPI).

---

## 7. Logging, Monitoring & Analytics

1. **Logging**
   - Configure Python’s logging module for error and event logs.
   - Store logs in files or forward to cloud monitoring (optional).

2. **Monitoring**
   - Optionally integrate with AWS CloudWatch or similar for resource metrics.

3. **Analytics**
   - Track user and competition analytics via database queries and logs.

---

## 8. Deployment & DevOps

1. **Dockerization**
   - Write Dockerfile for backend service.
   - Use Docker Compose for multi-service orchestration (backend, db, frontend).

2. **Reverse Proxy & TLS**
   - Configure Nginx as a reverse proxy for FastAPI backend.
   - Use Certbot for automatic SSL certificate management.

3. **CI/CD Pipeline**
   - Set up GitHub Actions for linting, testing, building, and deployment.
   - Automate Docker image builds and pushes to registry.
   - Document manual deployment steps for MVP.

4. **Backups**
   - Schedule daily PostgreSQL backups to S3 or secure storage.

---

## 9. Documentation & Best Practices

1. **Code Documentation**
   - Write clear docstrings for all functions, models, and endpoints.
   - Maintain up-to-date README and API docs.

2. **Code Quality**
   - Use Biome for linting and formatting.
   - Enforce pre-commit hooks for code quality.
   - Run MyPy for static type checking.

3. **Security & Compliance**
   - Regularly review for security vulnerabilities.
   - Ensure GDPR compliance for user data.

---

## 10. References

- Use `.references/full-stack-fastapi-template` for structure, naming, and best practices.
- Refer to FastAPI, SQLModel, Alembic, and Docker documentation as needed.

---

**Follow this guide for a robust, maintainable, and scalable SCI backend.** 