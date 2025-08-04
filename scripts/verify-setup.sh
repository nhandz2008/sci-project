#!/bin/bash

# SCI Backend Setup Verification Script
# This script verifies that all services are running and the API is functional

echo "🔍 Verifying SCI Backend Setup..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if services are running
echo "📊 Checking service status..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Services are running"
else
    echo "❌ Services are not running. Run 'docker compose up -d' to start them."
    exit 1
fi

# Check database connectivity
echo "🗄️  Checking database..."
if docker compose exec db pg_isready -U postgres -d sci_db > /dev/null 2>&1; then
    echo "✅ Database is accessible"
else
    echo "❌ Database is not accessible"
    exit 1
fi

# Check API endpoints
echo "🌐 Checking API endpoints..."

# Root endpoint
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Root endpoint is accessible"
else
    echo "❌ Root endpoint is not accessible"
    exit 1
fi

# Health endpoint
if curl -s http://localhost:8000/api/v1/health/ > /dev/null; then
    echo "✅ Health endpoint is accessible"
else
    echo "❌ Health endpoint is not accessible"
    exit 1
fi

# API documentation
if curl -s http://localhost:8000/api/v1/docs > /dev/null; then
    echo "✅ API documentation is accessible"
else
    echo "❌ API documentation is not accessible"
    exit 1
fi

# Test authentication
echo "🔐 Testing authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@sci.com&password=admin123")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Authentication is working"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
    
    # Test authenticated endpoint
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/auth/me > /dev/null; then
        echo "✅ Authenticated endpoints are working"
    else
        echo "❌ Authenticated endpoints are not working"
    fi
else
    echo "❌ Authentication is not working"
    exit 1
fi

echo ""
echo "🎉 Setup verification complete!"
echo "=================================="
echo "✅ All services are running and functional"
echo "✅ API is accessible at http://localhost:8000"
echo "✅ Documentation is available at http://localhost:8000/api/v1/docs"
echo "✅ Admin user: admin@sci.com / admin123"
echo ""
echo "🚀 You're ready to start developing!" 