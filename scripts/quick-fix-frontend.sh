#!/bin/bash

# SCI Project Frontend Quick Fix Script
# This script uses an improved Dockerfile to fix npm ci hanging issues

set -e

echo "🚀 Quick Fix for Frontend Build Issues..."

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

# Stop any running frontend container
print_status "Stopping frontend container..."
docker-compose -f docker-compose.prod.local.yml stop frontend 2>/dev/null || true

# Remove the frontend container
print_status "Removing frontend container..."
docker-compose -f docker-compose.prod.local.yml rm -f frontend 2>/dev/null || true

# Clear Docker build cache to ensure clean build
print_status "Clearing Docker build cache..."
docker builder prune -f

# Create improved Dockerfile with better npm handling
print_status "Creating improved Dockerfile..."
cat > frontend/Dockerfile << 'EOF'
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Install all dependencies with improved timeout and fallback
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --network-timeout=300000 --prefer-offline || \
    (echo "npm ci failed, trying npm install..." && npm install --network-timeout=300000 --prefer-offline)

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

print_success "Improved Dockerfile created with:"
echo "- Network timeout settings (5 minutes)"
echo "- Retry configuration for network issues"
echo "- Fallback from npm ci to npm install"
echo "- Offline preference for faster builds"

# Build the frontend image with no cache
print_status "Building frontend image (this may take a few minutes)..."
if docker-compose -f docker-compose.prod.local.yml build --no-cache frontend; then
    print_success "Frontend image built successfully!"
else
    print_error "Frontend build failed!"
    print_status "Trying alternative approach with npm install only..."
    
    # Create even simpler Dockerfile as fallback
    cat > frontend/Dockerfile << 'EOF'
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Use npm install instead of npm ci for better compatibility
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --network-timeout=300000 --prefer-offline

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

    print_status "Retrying build with npm install only..."
    docker-compose -f docker-compose.prod.local.yml build --no-cache frontend
fi

# Start the frontend container
print_status "Starting frontend container..."
docker-compose -f docker-compose.prod.local.yml up -d frontend

# Wait for the container to be ready
print_status "Waiting for frontend to be ready..."
sleep 15

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

print_success "Frontend quick fix completed!"
echo ""
echo "🌐 Your application should be available at: http://44.212.21.255"
echo ""
echo "If you still have issues, check the logs with:"
echo "docker-compose -f docker-compose.prod.local.yml logs frontend" 