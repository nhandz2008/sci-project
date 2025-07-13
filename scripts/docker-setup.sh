#!/bin/bash

# SCI Project Docker Setup Script
# This script helps set up the SCI project with Docker

set -e

echo "🚀 SCI Project Docker Setup"
echo "=========================="

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

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check for port conflicts
check_port_conflicts() {
    print_status "Checking for port conflicts..."
    
    # Check PostgreSQL port
    if ss -tulpn | grep -q ":5432 "; then
        print_warning "Port 5432 is already in use by system PostgreSQL"
        print_status "Docker PostgreSQL will use port 5433 to avoid conflicts"
    fi
    
    # Check Redis port
    if ss -tulpn | grep -q ":6379 "; then
        print_warning "Port 6379 is already in use"
        print_error "Please stop the conflicting service or change the port in docker-compose.override.yml"
        exit 1
    fi
    
    # Check backend port
    if ss -tulpn | grep -q ":8000 "; then
        print_warning "Port 8000 is already in use"
        print_error "Please stop the conflicting service or change the port in docker-compose.yml"
        exit 1
    fi
    
    # Check frontend port
    if ss -tulpn | grep -q ":3000 "; then
        print_warning "Port 3000 is already in use"
        print_error "Please stop the conflicting service or change the port in docker-compose.yml"
        exit 1
    fi
    
    print_success "No port conflicts detected"
}

# Check if .env file exists
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
            print_warning "Please update .env file with your configuration values"
        else
            print_error "env.example file not found. Please create a .env file manually."
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi
}

# Generate secure secrets
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate a secure secret key if not already set
    if ! grep -q "SECRET_KEY=your_super_secret_key_here" .env; then
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/SECRET_KEY=your_super_secret_key_here/SECRET_KEY=$SECRET_KEY/" .env
        print_success "Generated secure SECRET_KEY"
    fi
    
    # Generate Redis password if not already set
    if ! grep -q "REDIS_PASSWORD=your_redis_password_here" .env; then
        REDIS_PASSWORD=$(openssl rand -hex 16)
        sed -i "s/REDIS_PASSWORD=your_redis_password_here/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
        print_success "Generated secure REDIS_PASSWORD"
    fi
    
    # Generate database password if not already set
    if ! grep -q "POSTGRES_PASSWORD=your_secure_password_here" .env; then
        DB_PASSWORD=$(openssl rand -hex 16)
        sed -i "s/POSTGRES_PASSWORD=your_secure_password_here/POSTGRES_PASSWORD=$DB_PASSWORD/" .env
        print_success "Generated secure POSTGRES_PASSWORD"
    fi
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker-compose build backend
    
    # Build frontend image
    print_status "Building frontend image..."
    docker-compose build frontend
    
    print_success "All Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start all services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout=60
    while ! docker-compose exec -T db pg_isready -U sci_user -d sci_db > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within 60 seconds"
            print_status "Checking database logs..."
            docker-compose logs db
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Database is ready"
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout=60
    while ! curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Backend failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Backend is ready"
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout=60
    while ! curl -f http://localhost:3000/health > /dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            print_error "Frontend failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    print_success "Frontend is ready"
}

# Show service status
show_status() {
    print_status "Service Status:"
    echo ""
    docker-compose ps
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo "   Database Admin: http://localhost:8080"
    echo ""
    echo "🗄️ Database Access:"
    echo "   Docker PostgreSQL: localhost:5433 (to avoid system PostgreSQL on 5432)"
    echo "   Connection: psql -h localhost -p 5433 -U sci_user -d sci_db"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   Rebuild images: docker-compose build"
    echo "   Access database: docker-compose exec db psql -U sci_user -d sci_db"
    echo ""
}

# Main execution
main() {
    check_docker
    check_port_conflicts
    setup_env
    generate_secrets
    build_images
    start_services
    wait_for_services
    show_status
}

# Run main function
main "$@" 