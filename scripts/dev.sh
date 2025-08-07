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
        uv run ruff check .
        ;;
    "format")
        echo "Formatting code..."
        cd backend
        uv run ruff format .
        ;;
    "docker")
        echo "Starting with Docker..."
        docker-compose up -d
        ;;
    "docker-logs")
        echo "Showing Docker logs..."
        docker-compose logs -f
        ;;
    "docker-stop")
        echo "Stopping Docker services..."
        docker-compose down
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
        
        echo "✅ Setup complete!"
        echo "Next steps:"
        echo "1. Edit .env file with your configuration"
        echo "2. Run: ./scripts/dev.sh start"
        ;;
    *)
        echo "Usage: $0 {start|install|test|lint|format|docker|docker-logs|docker-stop|setup}"
        echo ""
        echo "Commands:"
        echo "  start       - Start development server"
        echo "  install     - Install dependencies"
        echo "  test        - Run tests"
        echo "  lint        - Run linting"
        echo "  format      - Format code"
        echo "  docker      - Start with Docker"
        echo "  docker-logs - Show Docker logs"
        echo "  docker-stop - Stop Docker services"
        echo "  setup       - Initial setup"
        exit 1
        ;;
esac 