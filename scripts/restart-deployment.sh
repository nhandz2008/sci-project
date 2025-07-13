#!/bin/bash

# SCI Project Deployment Restart Script
# This script restarts the deployment to fix connectivity issues

set -e

echo "🔄 Restarting SCI Project Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.local.yml" ]; then
    print_error "Please run this script from the sci-project directory"
    exit 1
fi

# Stop all containers
print_status "Stopping all containers..."
docker-compose -f docker-compose.prod.local.yml down --remove-orphans

# Wait a moment
sleep 5

# Start containers again
print_status "Starting containers..."
docker-compose -f docker-compose.prod.local.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.local.yml ps

# Test connectivity
print_status "Testing connectivity..."

# Test backend
if curl -f http://localhost:8000/api/v1/health 2>/dev/null; then
    print_success "Backend is accessible"
else
    print_warning "Backend is not accessible yet"
fi

# Test frontend
if curl -f http://localhost:80/ 2>/dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend is not accessible yet"
fi

# Get the domain from environment
if [ -f ".env.production" ]; then
    DOMAIN=$(grep '^DOMAIN=' .env.production | cut -d'=' -f2)
    print_status "Your application should be available at: http://$DOMAIN"
else
    print_warning "Could not determine domain from .env.production"
fi

print_success "Restart completed!"
echo ""
echo "📋 If the website is still not accessible, run:"
echo "   ./scripts/debug-deployment.sh" 