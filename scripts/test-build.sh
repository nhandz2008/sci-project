#!/bin/bash

# SCI Project Build Test Script
# This script tests the Docker builds to ensure they work correctly

set -e

echo "🧪 Testing SCI Project Docker Builds..."

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

# Test frontend build
print_status "Testing frontend Docker build..."
cd frontend
if docker build -t sci-frontend-test .; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Test backend build
print_status "Testing backend Docker build..."
cd backend
if docker build -t sci-backend-test .; then
    print_success "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi
cd ..

# Clean up test images
print_status "Cleaning up test images..."
docker rmi sci-frontend-test sci-backend-test 2>/dev/null || true

print_success "All Docker builds tested successfully!"
echo ""
echo "✅ Frontend build: PASSED"
echo "✅ Backend build: PASSED"
echo ""
echo "🚀 You can now run the deployment fix script:"
echo "   ./scripts/fix-deployment.sh" 