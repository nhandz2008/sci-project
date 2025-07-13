#!/bin/bash

# Troubleshoot SCI Application
# This script helps diagnose connection and application issues

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

print_status "Troubleshooting SCI application..."

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/ || echo "unknown")
print_status "Public IP: $PUBLIC_IP"

# Check if we're in the project directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "Not in project directory. Please run from /opt/sci-production/sci-project"
    exit 1
fi

echo
print_status "=== SYSTEM CHECKS ==="

# Check system resources
print_status "Checking system resources..."
echo "Memory usage:"
free -h
echo
echo "Disk usage:"
df -h /
echo
echo "CPU usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo
print_status "=== DOCKER CHECKS ==="

# Check Docker
print_status "Checking Docker..."
if docker info > /dev/null 2>&1; then
    print_success "Docker is running"
else
    print_error "Docker is not running"
    exit 1
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if docker-compose --version > /dev/null 2>&1; then
    print_success "Docker Compose is available"
else
    print_error "Docker Compose is not available"
    exit 1
fi

echo
print_status "=== CONTAINER CHECKS ==="

# Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo
print_status "=== NETWORK CHECKS ==="

# Check if ports are listening
print_status "Checking if ports are listening..."
echo "Port 80 (Nginx):"
sudo netstat -tlnp | grep :80 || print_warning "Port 80 not listening"
echo
echo "Port 3000 (Frontend):"
sudo netstat -tlnp | grep :3000 || print_warning "Port 3000 not listening"
echo
echo "Port 8000 (Backend):"
sudo netstat -tlnp | grep :8000 || print_warning "Port 8000 not listening"

echo
print_status "=== NGINX CHECKS ==="

# Check Nginx
print_status "Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    sudo systemctl status nginx
fi

# Check Nginx configuration
print_status "Checking Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
fi

# Check Nginx logs
print_status "Recent Nginx error logs:"
sudo tail -10 /var/log/nginx/error.log

echo
print_status "=== APPLICATION CHECKS ==="

# Check if .env exists
if [ -f ".env" ]; then
    print_success ".env file exists"
else
    print_error ".env file missing"
fi

# Check environment variables
print_status "Checking key environment variables..."
if [ -f ".env" ]; then
    echo "DOMAIN: $(grep '^DOMAIN=' .env | cut -d'=' -f2 || echo 'NOT SET')"
    echo "POSTGRES_PASSWORD: $(grep '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2 | cut -c1-10 || echo 'NOT SET')..."
    echo "SECRET_KEY: $(grep '^SECRET_KEY=' .env | cut -d'=' -f2 | cut -c1-10 || echo 'NOT SET')..."
fi

echo
print_status "=== CONNECTIVITY TESTS ==="

# Test local connectivity
print_status "Testing local connectivity..."

echo "Testing localhost:80 (Nginx):"
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is responding locally"
else
    print_warning "Nginx is not responding locally"
fi

echo "Testing localhost:3000 (Frontend):"
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    print_success "Frontend is responding locally"
else
    print_warning "Frontend is not responding locally"
fi

echo "Testing localhost:8000 (Backend):"
if curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    print_success "Backend is responding locally"
else
    print_warning "Backend is not responding locally"
fi

echo
print_status "=== SECURITY GROUP CHECK ==="

# Check if ports are open
print_status "Checking if ports are accessible from outside..."
echo "Note: This checks if your EC2 security group allows these ports"

echo "Testing port 80 from outside:"
if curl -f http://$PUBLIC_IP/health > /dev/null 2>&1; then
    print_success "Port 80 is accessible from outside"
else
    print_warning "Port 80 is not accessible from outside"
    print_status "Check your EC2 security group - port 80 should be open"
fi

echo
print_status "=== APPLICATION LOGS ==="

# Show recent application logs
print_status "Recent application logs:"
docker-compose -f docker-compose.prod.yml logs --tail=30

echo
print_status "=== RECOMMENDATIONS ==="

# Provide recommendations based on findings
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_warning "Application containers are not running"
    print_status "Run: ./scripts/check-and-start.sh"
fi

if [ ! -f ".env" ]; then
    print_warning ".env file is missing"
    print_status "Run: cp env.production.example .env && nano .env"
fi

if ! sudo systemctl is-active --quiet nginx; then
    print_warning "Nginx is not running"
    print_status "Run: sudo systemctl start nginx"
fi

print_success "Troubleshooting completed!"
print_status "Check the output above for issues and follow the recommendations." 