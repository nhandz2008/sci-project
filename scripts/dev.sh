#!/bin/bash

# Development script for SCI project

set -e

echo "🚀 SCI Development Script"
echo "========================"

case "$1" in
    "start")
        echo "Starting development server..."
        cd backend
        uv run python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
        ;;
    "install")
        echo "Installing dependencies..."
        cd backend
        uv sync
        ;;
    "test")
        echo "Running tests..."
        cd backend
        uv run pytest
        ;;
    "lint")
        echo "Running linting..."
        cd backend
        if [[ "$2" == "--fix" ]]; then
            echo "Auto-fixing lint issues with ruff format..."
            uv run ruff check . --fix
        else
            uv run ruff check .
        fi
        ;;
    "format")
        echo "Formatting code..."
        cd backend
        uv run ruff format .
        ;;
    "docker")
        echo "Starting with Docker..."
        docker compose up -d
        ;;
    "docker-build")
        echo "Building with Docker..."
        docker compose build
        ;;
    "docker-logs")
        echo "Showing Docker logs..."
        docker compose logs -f
        ;;
    "docker-stop")
        echo "Stopping Docker services..."
        docker compose down
        ;;
    "clean")
        echo "Cleaning project (docker, env, generated files)..."
        # Stop and remove docker services, networks, and volumes
        docker compose down -v --remove-orphans || true
        docker compose rm -f -s -v || true
        # Optionally remove built image (best-effort)
        docker image rm -f sci-project-backend 2>/dev/null || true
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
        echo "✅ Clean complete."
        ;;
    "setup")
        echo "Setting up development environment..."
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

        # Install dependencies
        cd backend
        uv sync
        echo "✅ Installed dependencies"

        # Install pre-commit hooks inside the virtual environment
        echo "Installing pre-commit hooks..."
        uv run pre-commit install || echo "⚠️  pre-commit not available; skipping hooks install"
        echo "✅ Installed pre-commit hooks"

        # Create minimal alembic.ini if it doesn't exist
        if [ ! -f alembic.ini ]; then
            echo "[alembic]" > alembic.ini
            echo "script_location = alembic" >> alembic.ini
            echo "✅ Created minimal alembic.ini"
        fi

        echo "✅ Setup complete!"
        echo "Next steps:"
        echo "1. Edit .env file with your configuration"
        echo "2. Run: ./scripts/dev.sh start"
        ;;
    *)
        echo "Usage: $0 {start|install|test|lint|format|docker|docker-build|docker-logs|docker-stop|setup|clean}"
        echo ""
        echo "Commands:"
        echo "  start        - Start development server"
        echo "  install      - Install dependencies"
        echo "  test         - Run tests"
        echo "  lint         - Run linting"
        echo "  format       - Format code"
        echo "  docker       - Start Docker services (alias of docker-start)"
        echo "  docker-build - Build Docker images"
        echo "  docker-logs  - Show Docker logs"
        echo "  docker-stop  - Stop Docker services"
        echo "  setup        - Initial setup"
        echo "  clean        - Remove docker resources, env, and generated files"
        exit 1
        ;;
esac
