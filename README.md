# Science Competitions Insight (SCI)

Full‑stack app for discovering and managing science & technology competitions. Backend and frontend are included.

### Contents
- Run (Docker)
- Development (local)
- Testing
- Project structure
- Configuration

## 🚀 Run (Docker)

Prerequisites:
- Docker (with `docker compose`)

Steps:
```bash
# 1) Bootstrap: .env + backend/alembic.ini
./scripts/dev.sh setup

# 2) Start full stack (db + backend + frontend) in Docker
./scripts/dev.sh run-start
```

Verify:
- Web: http://localhost:3000
- API: http://localhost:8000
- Docs: http://localhost:8000/api/v1/docs
- Health: http://localhost:8000/api/v1/health

**Note**: The `run-start` command starts the full stack in Docker containers. For local development with automatic admin user creation, use `dev-start` instead.

To run tests in production environment:
```bash
# Run tests (automatically creates test database if needed)
./scripts/dev.sh dev-test
```

## 🛠️ Local Development

### Prerequisites
- [UV package manager](https://github.com/astral-sh/uv)

Common commands:
```bash
./scripts/dev.sh setup            # bootstrap: .env + backend/alembic.ini
./scripts/dev.sh dev-install      # install backend deps + pre-commit
./scripts/dev.sh dev-start        # start db, apply migrations, create admin, run API locally
./scripts/dev.sh dev-stop         # stop development server (kills processes on port 8000)
./scripts/dev.sh dev-frontend     # run Next.js frontend locally on http://localhost:3000 (uses NEXT_PUBLIC_API_URL)
./scripts/dev.sh dev-test [args]  # run tests (ensures db is running)
./scripts/dev.sh dev-lint [--fix] # ruff check (optionally --fix)
./scripts/dev.sh dev-format       # ruff format
./scripts/dev.sh dev-populate     # populate database with dummy data (admin + creators + competitions)
./scripts/dev.sh migrate ...      # alembic via backend/scripts/migrate.sh
```

**Note**: The `dev-start` command automatically creates an admin user using credentials from your `.env` file:
- Email: `FIRST_SUPERUSER` (default: `admin@sci.com`)
- Password: `FIRST_SUPERUSER_PASSWORD` (default: `Admin123`)

### Database Migrations

Migrations are used to manage database schema changes. Use them when:
- Adding new models or fields to existing models
- Modifying field types or constraints
- Adding indexes or database-level validations
- Refactoring table structures

Common migration commands:
```bash
# Create a new migration from current models
cd backend && uv run -m alembic revision -m "describe change" --autogenerate && cd ..

# Apply latest migrations
./scripts/dev.sh migrate upgrade head

# Downgrade one step (rollback)
./scripts/dev.sh migrate downgrade -1

# View migration history
./scripts/dev.sh migrate history
```

## ✅ Testing

The project uses pytest with comprehensive test coverage including unit tests, integration tests, and API endpoint testing. Tests run against a dedicated PostgreSQL test database.

### Test Structure
- **Unit Tests**: Test individual functions and classes (`test_crud_*.py`, `test_schemas.py`)
- **Integration Tests**: Test API endpoints and workflows (`test_*_routes.py`, `test_integration.py`)
- **Security Tests**: Test authentication and authorization (`test_security.py`, `test_auth_routes.py`)

### Running Tests
```bash
# Run all tests (automatically sets up test database)
./scripts/dev.sh dev-test

# Run with summary output
./scripts/dev.sh dev-test --summary

# Run specific test file or test case
./scripts/dev.sh dev-test tests/test_auth_routes.py::TestAuthSignup::test_signup_success -v -s

# Run tests with coverage reports
cd backend && uv run pytest tests/ -v --tb=short \
  --cov=app --cov-report=term-missing \
  --cov-report=html:htmlcov --cov-report=xml && cd ..
```

**Note**: The `dev-test` command automatically:
- Ensures the PostgreSQL database is running
- Creates the test database if it doesn't exist
- Loads environment variables from `.env`
- Runs tests with proper isolation

### Populating with Dummy Data

To populate the database with dummy data for development and testing:

```bash
./scripts/dev.sh dev-populate
```

This will create:
- **Admin user**: Using credentials from `.env` file
- **5 Creator users**: With sample organizations and contact information
- **15 Competitions**: Diverse science competitions with different formats, scales, and approval statuses

The dummy data includes:
- Featured and non-featured competitions
- Approved and pending competitions
- Various formats (ONLINE, OFFLINE, HYBRID)
- Different scales (PROVINCIAL, REGIONAL, INTERNATIONAL)
- Realistic competition details with deadlines, prizes, and requirements

**Creator user credentials** (for testing):
- Email: `creator1@sci.com` through `creator5@sci.com`
- Password: `Creator123`

See `backend/tests/TESTING.md` for detailed testing guidelines.

## 🐳 Docker Helpers

Docker is used to run the full application stack (PostgreSQL database + FastAPI backend) in isolated containers. This ensures consistent environments across development and production.

### Common Commands
```bash
# Start the full stack (database + backend API) in Docker containers
./scripts/dev.sh run-start

# View real-time logs from all services
./scripts/dev.sh run-logs

# Stop all services and remove containers
./scripts/dev.sh run-stop

# Build Docker images (useful for production deployment)
./scripts/dev.sh run-build
```

**Note**: The `run-start` command starts database, backend, and frontend in Docker containers. For local development with live code reloading and automatic admin user creation, use `dev-start` for backend and `dev-frontend` for the Next.js app.

### What's Running
- **PostgreSQL Database**: Port 5432 (accessible at `localhost:5432`)
- **FastAPI Backend**: Port 8000 (API at `http://localhost:8000`)
- **Next.js Frontend**: Port 3000 (Web at `http://localhost:3000`)
- **API Documentation**: Available at `http://localhost:8000/api/v1/docs`

### Cleaning the project

The clean command removes Docker resources and generated files, including frontend artifacts:

```bash
./scripts/dev.sh clean
```

This will:
- Stop and remove Docker containers, volumes, and networks for this project
- Remove images `sci-project-backend` and `sci-project-frontend` (best-effort)
- Remove `.env`
- Remove backend caches (`.venv`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, `htmlcov`, `__pycache__`)
- Remove frontend caches (`frontend/.next`, `frontend/.turbo`, `frontend/.cache`) and `frontend/node_modules`

## 🏗️ Project Structure

The project follows a modular FastAPI architecture with clear separation of concerns:

```
sci-project/
├── backend/                  # Backend application (FastAPI + PostgreSQL)
│   ├── app/                  # Main application package
│   │   ├── api/              # HTTP endpoints and routing
│   │   ├── core/             # Configuration, security, utilities
│   │   ├── crud/             # Database operations layer
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic request/response models
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # Comprehensive test suite
│   ├── alembic/              # Database migrations
│   ├── scripts/              # Backend-specific scripts
│   ├── Dockerfile            # Backend container definition
│   └── pyproject.toml        # Python dependencies and config
├── frontend/                 # Frontend application (Next.js)
├── scripts/                  # Project-wide automation
│   └── dev.sh                # Development and deployment scripts
├── docker-compose.yml        # Multi-service container orchestration
├── env.example               # Environment variables template
└── README.md                 # This file
```

### Architecture Overview
- **API Layer** (`app/api/`): HTTP endpoints and request/response handling
- **Business Logic** (`app/crud/`): Database operations and business rules
- **Data Models** (`app/models/`): Database schema definitions
- **Validation** (`app/schemas/`): Request/response validation and serialization
- **Configuration** (`app/core/`): Settings, security, and utilities
- **Testing** (`tests/`): Comprehensive test coverage for all layers
