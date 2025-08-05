#!/bin/bash

# Simple script to run the SQL population script
# This script connects to the database and executes the SQL script

set -e

echo "🚀 Starting SQL competition population..."

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if the database container is running
if ! docker ps | grep -q "db"; then
    echo "⚠️  Database container is not running. Starting database..."
    cd ..
    docker compose up -d db
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    cd backend
fi

# Wait for database to be ready
echo "🔍 Checking database health..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec db pg_isready -U postgres -d sci_db > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Error: Database is not ready after $max_attempts attempts"
    exit 1
fi

# Run the SQL script
echo "📝 Executing SQL script..."
docker exec -i db psql -U postgres -d sci_db < scripts/populate_competitions.sql

echo "✅ SQL competition population completed!" 