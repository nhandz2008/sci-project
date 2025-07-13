#!/bin/bash

# Check and Start SCI Application
# This script checks if the application is running and starts it if needed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Checking SCI application status..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env
        print_status "Please edit .env file with your settings:"
        print_status "  nano .env"
        print_warning "You need to update at least:"
        print_warning "  - POSTGRES_PASSWORD"
        print_warning "  - SECRET_KEY"
        print_warning "  - DOMAIN (your EC2 IP: 44.212.21.255)"
        print_warning "  - VITE_API_URL (http://44.212.21.255)"
        exit 1
    else
        print_error "No environment template found. Please create .env file manually."
        exit 1
    fi
fi

# Check Docker status
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Check if containers are running
print_status "Checking container status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Application is already running!"
    docker-compose -f docker-compose.prod.yml ps
else
    print_warning "Application is not running. Starting it now..."
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Start the application
    print_status "Starting application..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check status again
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Application started successfully!"
        docker-compose -f docker-compose.prod.yml ps
    else
        print_error "Failed to start application. Checking logs..."
        docker-compose -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
fi

# Check service health
print_status "Checking service health..."

# Check backend health
print_status "Checking backend health..."
if curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_warning "Backend health check failed"
fi

# Check frontend health
print_status "Checking frontend health..."
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

# Check Nginx
print_status "Checking Nginx..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is healthy"
else
    print_warning "Nginx health check failed"
fi

# Show logs if there are issues
print_status "Recent application logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

print_success "Application status check completed!"
print_status "Your application should be accessible at: http://44.212.21.255"
print_status "If it's still not working, check the logs above for errors." 