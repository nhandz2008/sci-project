#!/bin/bash

# Development script for SCI project

set -e

echo "🚀 SCI Development Script"
echo "========================"

case "$1" in
    "dev-start")
        echo "Starting local development (db + API with reload)..."

        # Check if port 8000 is already in use and clean it up
        if lsof -ti:8000 > /dev/null 2>&1; then
            echo "⚠️  Port 8000 is already in use. Stopping existing processes..."
            lsof -ti:8000 | xargs kill -9 2>/dev/null || true
            sleep 2
            echo "✅ Cleaned up port 8000"
        fi

        # Ensure database is running
        docker compose up -d db
        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 5
        # Apply migrations and start API (auto-reload)
        cd backend
        ./scripts/migrate.sh upgrade head
        # Create admin user if it doesn't exist
        echo "Ensuring admin user exists..."
        uv run python scripts/populate_data.py --admin-only || echo "⚠️  Admin user creation failed, continuing..."
        echo "Starting development server (Uvicorn on port 8000)..."
        uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
        ;;
    "dev-install")
        echo "Installing backend dependencies..."
        cd backend
        uv sync
        echo "✅ Installed dependencies"
        echo "Installing pre-commit hooks..."
        uv run pre-commit install || echo "⚠️  pre-commit not available; skipping hooks install"
        echo "✅ Installed pre-commit hooks"
        ;;
    "dev-test")
        echo "Running tests (uses PostgreSQL from Docker, see backend/tests/TESTING.md)..."
        # Ensure database is running
        docker compose up -d db
        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 5
        # Create test database if it doesn't exist
        echo "Ensuring test database exists..."
        if docker compose exec -T db psql -U postgres -lqt | cut -d \| -f 1 | grep -qw sci_test_db; then
            echo "✅ Test database already exists"
        else
            echo "Creating test database..."
            docker compose exec -T db createdb -U postgres sci_test_db
            echo "✅ Test database created"
        fi
        # Wait a moment for the database to be ready
        sleep 2
        cd backend
        # Prefer the project test runner that configures env/test DB automatically
        uv run python run_tests.py "${@:2}"
        ;;

    "dev-lint")
        echo "Running linting (ruff check)..."
        cd backend
        if [[ "$2" == "--fix" ]]; then
            echo "Auto-fixing lint issues with ruff check --fix..."
            uv run ruff check . --fix
        else
            uv run ruff check .
        fi
        ;;

    "dev-format")
        echo "Formatting code (ruff format)..."
        cd backend
        uv run ruff format .
        ;;

    "dev-populate")
        echo "Populating database with dummy data..."

        # Check if port 8000 is already in use and warn user
        if lsof -ti:8000 > /dev/null 2>&1; then
            echo "⚠️  Warning: Port 8000 is already in use. Population will continue but may conflict with running server."
            echo "   Consider stopping the server first with: pkill -f uvicorn"
        fi

        # Ensure database is running
        docker compose up -d db
        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 5
        # Apply migrations first
        cd backend
        ./scripts/migrate.sh upgrade head
        # Run population script
        uv run python scripts/populate_data.py
        cd ..
        ;;

    "dev-stop")
        echo "Stopping development server..."
        if lsof -ti:8000 > /dev/null 2>&1; then
            echo "Stopping processes on port 8000..."
            lsof -ti:8000 | xargs kill -9 2>/dev/null || true
            echo "✅ Stopped development server"
        else
            echo "ℹ️  No processes found on port 8000"
        fi
        ;;

    # Run (Docker): full stack - no local code changes required
    "run-start")
        echo "Starting full stack (db + backend + frontend) with Docker..."
        docker compose up -d
        echo "✅ Services started:"
        echo "- Database:        http://localhost:5432 (PostgreSQL)"
        echo "- Backend (API):   http://localhost:8000"
        echo "- Frontend (Web):  http://localhost:3000"
        ;;
    "run-build")
        echo "Building Docker images (backend + frontend)..."
        docker compose build
        ;;
    "run-logs")
        echo "Showing Docker logs (all services)..."
        docker compose logs -f
        ;;
    "run-stop")
        echo "Stopping Docker services..."
        docker compose down
        ;;

    # Backwards-compatible aliases (deprecated)
    "docker-start")
        echo "⚠️  'docker-start' is deprecated. Use 'run-start' instead."
        docker compose up -d
        ;;
    "docker-build")
        echo "⚠️  'docker-build' is deprecated. Use 'run-build' instead."
        docker compose build
        ;;
    "docker-logs")
        echo "⚠️  'docker-logs' is deprecated. Use 'run-logs' instead."
        docker compose logs -f
        ;;
    "docker-stop")
        echo "⚠️  'docker-stop' is deprecated. Use 'run-stop' instead."
        docker compose down
        ;;

    "migrate")
        echo "Running Alembic migrations via backend/scripts/migrate.sh..."
        cd backend
        ./scripts/migrate.sh "${@:2}"
        ;;

    "clean")
        echo "Cleaning project (docker, env, generated files)..."
        # Stop and remove docker services, networks, and volumes
        docker compose down -v --remove-orphans || true
        docker compose rm -f -s -v || true
        # Optionally remove built images (best-effort)
        docker image rm -f sci-project-backend 2>/dev/null || true
        docker image rm -f sci-project-frontend 2>/dev/null || true
        # Remove environment file
        rm -f .env
        # Remove backend virtualenv and caches
        rm -rf backend/.venv backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache backend/htmlcov || true
        # Remove coverage and test result artifacts
        rm -f backend/.coverage backend/coverage.xml backend/test-results.xml || true
        # Remove minimal alembic.ini (it will be re-created by setup)
        rm -f backend/alembic.ini || true
        # Remove python bytecode caches
        find backend -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
        # Remove frontend caches and build artifacts
        rm -rf frontend/.next frontend/.turbo frontend/.cache 2>/dev/null || true
        # Optionally remove node_modules to force clean install next time
        rm -rf frontend/node_modules 2>/dev/null || true
        echo "✅ Clean complete."
        ;;

    "setup")
        echo "Setting up project environment (no Python deps)..."
        # Copy env file if it doesn't exist
        if [ ! -f .env ]; then
            cp env.example .env
            echo "✅ Created .env file from template."
            # Generate secure SECRET_KEY using OpenSSL
            SECRET_KEY=$(openssl rand -hex 32)
            # Replace the placeholder with the generated key
            sed -i "s/SECRET_KEY=generate-with-openssl-rand-hex-32/SECRET_KEY=$SECRET_KEY/" .env
            echo "✅ Generated secure SECRET_KEY using OpenSSL"
        else
            echo "ℹ️  .env file already exists, skipping creation"
        fi

        # Ensure backend alembic.ini exists (minimal)
        if [ ! -f backend/alembic.ini ]; then
            echo "[alembic]" > backend/alembic.ini
            echo "script_location = alembic" >> backend/alembic.ini
            echo "✅ Created backend/alembic.ini"
        fi

        echo "✅ Setup complete!"
        echo "Next steps:"
        echo "- Run (Docker): ./scripts/dev.sh run-start"
        echo "- Develop locally: ./scripts/dev.sh dev-install && ./scripts/dev.sh dev-start && ./scripts/dev.sh dev-frontend"
        ;;

    "dev-frontend")
        echo "Starting frontend (Next.js) locally on http://localhost:3000 ..."
        cd frontend
        # Ensure port 3000 is free
        if lsof -ti:3000 > /dev/null 2>&1; then
            echo "⚠️  Port 3000 is already in use. Stopping existing processes..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null || true
            sleep 2
            echo "✅ Cleaned up port 3000"
        fi
        if [ ! -d node_modules ]; then
            echo "Installing frontend dependencies..."
            npm ci || npm install
        fi
        echo "Using NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}"
        NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000} npm run dev
        ;;

    *)
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Setup:"
        echo "  setup            - Create .env + backend/alembic.ini (no Python deps)"
        echo ""
        echo "Development (local code):"
        echo "  dev-install      - Install backend dependencies"
        echo "  dev-start        - Run API locally on http://localhost:8000 (starts db + applies migrations + creates admin)"
        echo "  dev-stop         - Stop development server (kills processes on port 8000)"
        echo "  dev-frontend     - Run Next.js frontend locally on http://localhost:3000 (uses NEXT_PUBLIC_API_URL)"
        echo "  dev-test [args]  - Run tests (ensures db is running)"
        echo "  dev-lint [--fix] - Lint code with ruff (optionally --fix)"
        echo "  dev-format       - Format code with ruff"
        echo "  dev-populate     - Populate database with dummy data (admin + creators + competitions)"
        echo "  migrate ...      - Run Alembic via backend/scripts/migrate.sh (e.g., 'migrate upgrade head')"
        echo ""
        echo "Run (Docker):"
        echo "  run-start        - Start full stack (db + backend + frontend) with Docker"
        echo "  run-build        - Build Docker images"
        echo "  run-logs         - Show Docker logs (all services)"
        echo "  run-stop         - Stop Docker services"
        echo ""
        echo "Maintenance:"
        echo "  clean         - Remove docker resources, env, and generated files"
        exit 1
        ;;
esac
