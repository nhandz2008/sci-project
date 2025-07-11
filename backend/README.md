# Science Competitions Insight - Backend API

A modern FastAPI backend for managing science and technology competitions worldwide.

## 🚀 Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **SQLModel** - SQL databases in Python, with type safety
- **PostgreSQL** - Robust relational database
- **Alembic** - Database migration tool
- **JWT** - JSON Web Token authentication
- **Pydantic** - Data validation using Python type annotations
- **UV** - Fast Python package installer and resolver

## 📋 Prerequisites

Make sure you have the following installed:

- **Python 3.10+**
- **UV** package manager (install from [uv.io](https://uv.io))
- **PostgreSQL** database (install from [postgres](https://www.postgresql.org/download/))
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone and Navigate to Backend

```bash
cd sci-project/backend
```

### 2. Install Dependencies

We use UV package manager for fast and reliable dependency management:

```bash
# Install all production dependencies
uv sync

# Or install development dependencies too
uv sync --dev
```

### 3. Environment Configuration

Create a `.env` file in the backend directory from `.env.example` example environment file:

```bash
cp .env.example .env
```


### 4. Database Setup

Ensure PostgreSQL is running and create the database:

```sql
-- Connect to PostgreSQL and run:
CREATE DATABASE sci_db;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sci_db TO postgres;
```

### 5. Database Migrations

Initialize and run database migrations:

```bash
# Initialize Alembic (only once)
uv run alembic init alembic

# Create initial migration
uv run alembic revision --autogenerate -m "Initial migration"

# Apply migrations
uv run alembic upgrade head
```

## 🚀 Running the Application

### Development Server

Start the FastAPI development server with hot reload:

```bash
# Method 1: Using FastAPI CLI (recommended)
uv run fastapi dev app/main.py

# Method 2: Using Uvicorn directly
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

### Production Server

For production deployment:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Endpoints

### Health Check
- `GET /api/v1/health` - API health status

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout  
- `GET /api/v1/auth/me` - Get current user

### Users (Admin Only)
- `GET /api/v1/users/` - List all users
- `POST /api/v1/users/` - Create user
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Competitions
- `GET /api/v1/competitions/` - List competitions (public)
- `GET /api/v1/competitions/{id}` - Get competition (public)
- `POST /api/v1/competitions/` - Create competition (auth required)
- `PUT /api/v1/competitions/{id}` - Update competition (owner/admin)
- `DELETE /api/v1/competitions/{id}` - Delete competition (owner/admin)

### AI Recommendations
- `POST /api/v1/recommendations/` - Get personalized recommendations
- `GET /api/v1/recommendations/featured` - Get featured competitions

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app

# Run specific test file
uv run pytest tests/test_auth.py

# Run with verbose output
uv run pytest -v
```

## 🔧 Development Tools

### Code Quality

```bash
# Run linter and formatter
uv run ruff check .
uv run ruff format .

# Auto-fix issues
uv run ruff check --fix .
```

### Database Management

```bash
# Create new migration
uv run alembic revision --autogenerate -m "Description of changes"

# Apply migrations
uv run alembic upgrade head

# Rollback migration
uv run alembic downgrade -1

# Show migration history
uv run alembic history

# Show current revision
uv run alembic current
```

## 📦 Package Management with UV

UV is our package manager of choice for its speed and reliability:

```bash
# Add new dependency
uv add package-name

# Add development dependency
uv add --dev package-name

# Remove dependency
uv remove package-name

# Update all dependencies
uv lock --upgrade

# Install from lock file
uv sync

# Run commands in virtual environment
uv run python script.py
uv run pytest
```

## 🏗️ Project Structure

```
backend/
├── app/                        # Main application package
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── api/                    # API route handlers
│   │   ├── main.py            # Main API router
│   │   └── routes/            # Individual route modules
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── users.py       # User management
│   │       ├── competitions.py # Competition CRUD
│   │       └── recommendations.py # AI recommendations
│   ├── core/                   # Core application logic
│   │   ├── config.py          # Settings and configuration
│   │   ├── security.py        # JWT and password utilities
│   │   └── deps.py            # Dependency injection
│   ├── models/                 # SQLModel database models
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Business logic services
│   └── utils/                 # Common utilities
├── tests/                      # Test suite
├── alembic/                   # Database migration files
├── .env                       # Environment variables
├── pyproject.toml            # Project configuration
├── uv.lock                   # Dependency lock file
└── README.md                 # This file
```

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Protection**: Configurable cross-origin requests
- **Input Validation**: Pydantic schemas for all inputs
- **SQL Injection Protection**: SQLModel/SQLAlchemy ORM
- **Environment Variables**: Secure configuration management

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
# Dockerfile example
FROM python:3.11-slim

WORKDIR /app

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code
COPY ./app ./app

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Traditional Deployment

```bash
# Install production dependencies
uv sync --no-dev

# Run with Gunicorn for production
uv run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📊 Monitoring & Logging

The application includes:
- **Health Check Endpoint**: `/api/v1/health`
- **Sentry Integration**: Error tracking (configure with SENTRY_DSN)
- **Structured Logging**: JSON formatted logs
- **Request/Response Logging**: Automatic API logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dev dependencies: `uv sync --dev`
4. Make your changes
5. Run tests: `uv run pytest`
6. Run linting: `uv run ruff check .`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -h localhost -U postgres -l
```

**2. Import Errors**
```bash
# Ensure you're using UV to run commands
uv run python -c "import app.main"

# Check virtual environment
uv run python -c "import sys; print(sys.path)"
```

**3. Migration Issues**
```bash
# Reset migrations (development only)
uv run alembic stamp head
uv run alembic revision --autogenerate -m "Reset migration"
```

**4. Port Already in Use**
```bash
# Kill process on port 8000
sudo lsof -t -i tcp:8000 | xargs kill -9

# Or use different port
uv run fastapi dev app/main.py --port 8001
```
