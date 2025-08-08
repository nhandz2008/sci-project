# Science Competitions Insight (SCI)

Full‑stack app for discovering and managing science & technology competitions.

## 🚀 Quick Start

### Prerequisites

- Docker (with `docker compose`)
- Python 3.10+ (for local development)
- UV package manager

### Setup

```bash
# Bootstrap: .env + deps + pre-commit
./scripts/dev.sh setup

# Start docker services
./scripts/dev.sh docker

# Apply DB migrations
cd backend && uv run -m alembic upgrade head && cd ..

# Start API
./scripts/dev.sh start
```

5. **Verify the setup**
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/v1/health

## Backend

### Prereqs
- Python 3.10+
- UV package manager
- PostgreSQL (or use `docker compose`)

### Environment
- Copy `env.example` → `.env`, set at least:
  - `SECRET_KEY` (32+ chars)
  - `POSTGRES_*` (server, port, user, password, db)
  - `FIRST_SUPERUSER_PASSWORD`

### Install & run (backend only)
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

### Tests (PostgreSQL)
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

### Docker helpers
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
- Ruff (lint/format), MyPy, pre-commit (installed by `./scripts/dev.sh setup`).

### Database & Migrations
PostgreSQL + SQLModel with Alembic (`backend/alembic`).

## 🔧 Configuration

Key `.env` variables:
- `SECRET_KEY`: JWT token secret (32+ chars)
- `POSTGRES_*`: DB configuration
- `FIRST_SUPERUSER_*`: Admin credentials
(- `AWS_*`, `LLM_API_*` optional for later features)

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
