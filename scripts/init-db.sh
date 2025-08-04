#!/bin/bash

# Database initialization script for SCI Backend
# This script ensures the database is properly set up before starting the application

set -e

echo "🔧 Initializing SCI Database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker compose exec -T db pg_isready -U postgres -d sci_db; do
    echo "Database is not ready yet. Waiting..."
    sleep 2
done

echo "✅ Database is ready"

# Run migrations using a temporary backend container
echo "🔄 Running database migrations..."
docker compose run --rm backend alembic upgrade head

echo "✅ Database initialization complete!"
echo "🚀 You can now start the application with: docker compose up" 