# SCI Backend

FastAPI backend for Science Competitions Insight with PostgreSQL database.

## Quick Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)

### Development with Docker (Recommended)

```bash
# Start all services
docker compose up --build

# For live code sync
docker compose watch

# Run tests
docker compose exec backend pytest
```

### Local Development

```bash
# Install UV package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup environment
cd backend
uv sync
source .venv/bin/activate

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

- **Documentation**: http://localhost:8000/api/v1/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **Admin User**: admin@sci.com / admin123

### Key Endpoints

- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/competitions/` - List competitions
- `POST /api/v1/competitions/` - Create competition
- `GET /api/v1/users/me` - Get current user

## Project Structure

```
backend/
├── app/
│   ├── api/routes/     # API endpoints
│   ├── core/          # Configuration & security
│   ├── models/        # Database models
│   └── main.py        # Application entry point
├── alembic/           # Database migrations
├── tests/             # Test files
└── pyproject.toml     # Dependencies
```

## Database

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Access database
docker compose exec db psql -U postgres -d sci_db
```

## Common Commands

```bash
# Check logs
docker compose logs backend

# Access container
docker compose exec backend bash

# Install new dependency
docker compose exec backend uv add package-name

# Format code
docker compose exec backend ruff format app/

# Lint code
docker compose exec backend ruff check app/
```

## Environment Variables

Required environment variables in `.env`:
- `POSTGRES_*` - Database configuration
- `SECRET_KEY` - JWT signing key
- `FIRST_SUPERUSER` - Admin user email
- `FIRST_SUPERUSER_PASSWORD` - Admin user password

## Troubleshooting

1. **Database connection issues**: Check if PostgreSQL is running
2. **Migration errors**: Remove corrupted migration files
3. **Bcrypt issues**: Rebuild container with updated dependencies
4. **Port conflicts**: Check if ports 8000/5432 are available

For detailed troubleshooting, see the main project README.
