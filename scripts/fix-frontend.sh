#!/bin/bash

# SCI Project Frontend Fix Script
# This script fixes the nginx permission issue

set -e

echo "🔧 Fixing Frontend Nginx Permission Issue..."

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

# Stop the frontend container
print_status "Stopping frontend container..."
docker-compose -f docker-compose.prod.local.yml stop frontend

# Remove the frontend container
print_status "Removing frontend container..."
docker-compose -f docker-compose.prod.local.yml rm -f frontend

# Rebuild the frontend image
print_status "Rebuilding frontend image..."
docker-compose -f docker-compose.prod.local.yml build --no-cache frontend

# Start the frontend container
print_status "Starting frontend container..."
docker-compose -f docker-compose.prod.local.yml up -d frontend

# Wait for the container to be ready
print_status "Waiting for frontend to be ready..."
sleep 10

# Check the container status
print_status "Checking frontend container status..."
docker-compose -f docker-compose.prod.local.yml ps frontend

# Test the frontend
print_status "Testing frontend accessibility..."
if curl -f http://localhost:80/ 2>/dev/null; then
    print_success "Frontend is accessible!"
else
    print_warning "Frontend is not accessible yet, checking logs..."
    docker-compose -f docker-compose.prod.local.yml logs --tail=10 frontend
fi

print_success "Frontend fix completed!"
echo ""
echo "🌐 Your application should be available at: http://44.212.21.255" 