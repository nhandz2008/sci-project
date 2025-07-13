#!/bin/bash

# SCI Project Frontend Build Diagnostic Script
# This script helps diagnose why npm ci is hanging during Docker build

set -e

echo "🔍 Diagnosing Frontend Build Issues..."

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

print_status "Step 1: Checking Docker system resources..."
echo "Docker disk usage:"
docker system df
echo ""

print_status "Step 2: Checking for running Docker builds..."
if pgrep -f "docker.*build" > /dev/null; then
    print_warning "Found running Docker build processes:"
    pgrep -f "docker.*build" -a
else
    print_success "No running Docker build processes found"
fi
echo ""

print_status "Step 3: Checking frontend package files..."
if [ -f "frontend/package.json" ]; then
    print_success "package.json exists"
    echo "Package.json size: $(wc -c < frontend/package.json) bytes"
else
    print_error "package.json missing!"
    exit 1
fi

if [ -f "frontend/package-lock.json" ]; then
    print_success "package-lock.json exists"
    echo "Package-lock.json size: $(wc -c < frontend/package-lock.json) bytes"
else
    print_warning "package-lock.json missing - this might cause npm ci to hang"
fi
echo ""

print_status "Step 4: Testing npm registry connectivity..."
if npm ping --registry https://registry.npmjs.org/ 2>/dev/null; then
    print_success "NPM registry is accessible"
else
    print_error "NPM registry is not accessible - this will cause npm ci to hang"
fi
echo ""

print_status "Step 5: Checking Docker build context..."
echo "Frontend directory contents:"
ls -la frontend/ | head -10
echo ""

print_status "Step 6: Testing local npm install (if Node.js is available)..."
if command -v npm >/dev/null 2>&1; then
    print_status "Testing npm install in frontend directory..."
    cd frontend
    if timeout 60 npm ci --dry-run 2>/dev/null; then
        print_success "Local npm ci test passed"
    else
        print_warning "Local npm ci test failed or timed out"
    fi
    cd ..
else
    print_warning "Node.js/npm not available locally for testing"
fi
echo ""

print_status "Step 7: Checking Docker build cache..."
echo "Docker build cache:"
docker builder prune --dry-run
echo ""

print_status "Step 8: Recommendations..."

echo ""
print_warning "If npm ci is hanging, try these solutions:"
echo "1. Clear Docker build cache: docker builder prune -f"
echo "2. Use npm install instead of npm ci in Dockerfile"
echo "3. Add --network-timeout=60000 to npm ci command"
echo "4. Check internet connectivity and npm registry access"
echo "5. Try building with --no-cache flag"
echo ""

print_status "Step 9: Creating alternative Dockerfile..."
cat > frontend/Dockerfile.alternative << 'EOF'
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Install all dependencies with timeout and fallback
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm ci --network-timeout=300000 || npm install --network-timeout=300000

# Copy source code
COPY ./ /app/

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

print_success "Alternative Dockerfile created at frontend/Dockerfile.alternative"
print_status "This version includes:"
echo "- Network timeout settings"
echo "- Fallback from npm ci to npm install"
echo "- Registry configuration"

echo ""
print_status "Step 10: Quick fix commands..."
echo "To try the quick fix:"
echo "1. cp frontend/Dockerfile.alternative frontend/Dockerfile"
echo "2. docker-compose -f docker-compose.prod.local.yml build --no-cache frontend"
echo "3. docker-compose -f docker-compose.prod.local.yml up -d frontend"

print_success "Diagnostic completed!" 