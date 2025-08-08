# Science Competitions Insight (SCI)

A full-stack web application for showcasing, managing, and recommending science & technology competitions worldwide.

## 🚀 Quick Start

### Prerequisites

- Docker (with `docker compose`)
- Python 3.10+ (for local development)
- UV package manager

### Setup

1. **Clone and navigate to the project**
   ```bash
   cd sci-project
   ```

2. **Run the development setup script**
   ```bash
   ./scripts/dev.sh setup
   ```

3. **Update environment variables**
   Edit `.env` file and change the default values:
   - `SECRET_KEY`: Generate a secure random key
   - `POSTGRES_PASSWORD`: Set a strong database password
   - `FIRST_SUPERUSER_PASSWORD`: Set admin password

4. **Start the application**
   ```bash
   # Option 1: Local development (recommended)
   ./scripts/dev.sh start

   # Option 2: Docker development
   ./scripts/dev.sh docker
   ```

5. **Verify the setup**
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/v1/health

## Backend

### 1) Prereqs
- Python 3.10+
- UV package manager
- PostgreSQL (or use `docker compose`)

### 2) Environment
- Copy `env.example` → `.env` and set at minimum:
  - `SECRET_KEY` (32+ chars)
  - `POSTGRES_*` (server, port, user, password, db)
  - `FIRST_SUPERUSER_PASSWORD`

### 3) Install & run (backend only)
```bash
# Install dependencies
./scripts/dev.sh install

# Start Postgres (Docker)
./scripts/dev.sh docker

# Apply DB migrations (Alembic)
cd backend && uv run -m alembic upgrade head && cd ..

# Start API
./scripts/dev.sh start
```

### 4) Tests (PostgreSQL)
```bash
# Ensure DB is running
./scripts/dev.sh docker

# Run the suite against Postgres test DB
cd backend
ENVIRONMENT=test TEST_POSTGRES_DB=sci_test_db \
POSTGRES_SERVER=localhost POSTGRES_USER=postgres POSTGRES_PASSWORD=changethis \
uv run -m pytest -q
```
Note: On first run, create the test database once if missing:
```bash
createdb -h localhost -U postgres sci_test_db
```

### 5) Docker helpers
- Start/stop services: `./scripts/dev.sh docker` | `./scripts/dev.sh docker-stop`
- Logs: `./scripts/dev.sh docker-logs`

## 🏗️ Project Structure

```
sci-project/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration and utilities
│   │   │   ├── config.py   # Settings and environment
│   │   │   ├── db.py       # Database configuration
│   │   │   └── security.py # JWT and password utilities
│   │   ├── models/         # Database models
│   │   │   ├── common.py   # Base models and enums
│   │   │   ├── user.py     # User model
│   │   │   └── competition.py # Competition model
│   │   └── main.py         # FastAPI application
│   ├── Dockerfile
│   ├── pyproject.toml      # Dependencies and project config
│   └── .gitignore
├── frontend/               # React frontend (to be implemented)
├── scripts/
│   └── dev.sh             # Development helper script
├── docker-compose.yml      # Development environment
├── env.example            # Environment template
└── README.md
```

## 🛠️ Development

### Backend Development

The backend is built with:
- **FastAPI**: Modern, fast web framework
- **SQLModel**: Type-safe database ORM (SQLAlchemy + Pydantic)
- **PostgreSQL**: Database
- **UV**: Fast Python package manager
- **Docker**: Containerization

### Useful Scripts
```bash
./scripts/dev.sh setup      # bootstrap: .env + deps + pre-commit
./scripts/dev.sh install    # install deps
./scripts/dev.sh start      # run API locally
./scripts/dev.sh test       # run tests (requires DB running)
./scripts/dev.sh lint       # lint (ruff)
./scripts/dev.sh format     # format (ruff)
./scripts/dev.sh docker     # start Docker services (db)
./scripts/dev.sh docker-logs
./scripts/dev.sh docker-stop

# DB migrations
cd backend && ./scripts/migrate.sh upgrade head
```

### Install UV (if needed)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Code Quality

The project uses several tools for code quality:

- **Ruff**: Fast Python linter and formatter
- **MyPy**: Static type checking
- **Pre-commit**: Git hooks for code quality

To set up pre-commit hooks:
```bash
cd backend
uv run pre-commit install
```

### Database & Migrations
PostgreSQL + SQLModel with Alembic migrations (`backend/alembic`).

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

- `SECRET_KEY`: JWT token secret
- `POSTGRES_*`: Database configuration
- `AWS_*`: S3 configuration for file uploads
- `LLM_API_*`: LLM API for recommendations
- `FIRST_SUPERUSER_*`: Admin user credentials

#### Database Migrations (Alembic)

From the project root:
```bash
cd backend

# Create a new migration from current models
uv run -m alembic revision -m "describe change" --autogenerate

# Upgrade to latest
uv run -m alembic upgrade head

# Downgrade one step
uv run -m alembic downgrade -1

# If your DB was created without Alembic, align the revision (no schema change)
uv run -m alembic stamp head

# Alternatively, use helper script
./scripts/migrate.sh upgrade head
./scripts/migrate.sh downgrade -1
```
Notes:
- Ensure `.env` is configured (`POSTGRES_*`, `SECRET_KEY` 32+ chars).
- Tests run against PostgreSQL (Docker `db` service). Schema is managed by Alembic; `TEST_POSTGRES_DB` defaults to `sci_test_db`.

### API
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`

## 🚀 Deployment

### Docker
Use helper commands under Useful Scripts. If you prefer raw commands:
```bash
docker compose up -d
docker compose logs -f
docker compose down
```

### Production Considerations

For production deployment:

1. **Security**: Change all default passwords and secrets
2. **SSL**: Configure HTTPS with proper certificates
3. **Database**: Use managed PostgreSQL service
4. **Storage**: Configure AWS S3 for file uploads
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Implement database backup strategy

## 📋 Status

Backend:
- Phase 1 ✅ (foundation)
- Phase 2 ✅ (auth & users)
- Phase 3 ✅ (competitions, moderation, sorting/search, migrations, tests)
- Phase 4–6 🔜 (uploads, recommendations, analytics)

## 🧪 Testing

The application is ready for testing:

```bash
# Test the API locally
curl http://localhost:8000/

# Check health
curl http://localhost:8000/api/v1/health

# View API docs
open http://localhost:8000/docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `./scripts/dev.sh lint && ./scripts/dev.sh test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the project structure and configuration
- Use the development scripts for common tasks
