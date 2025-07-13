#!/bin/bash

# SCI Project Deployment Debug Script
# This script helps diagnose why the website isn't accessible

set -e

echo "🔍 Debugging SCI Project Deployment..."

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

echo "=========================================="
echo "🔍 SYSTEM DIAGNOSTICS"
echo "=========================================="

# Check system resources
print_status "Checking system resources..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h
echo ""

# Check Docker status
print_status "Checking Docker status..."
if systemctl is-active --quiet docker; then
    print_success "Docker is running"
else
    print_error "Docker is not running"
    echo "Starting Docker..."
    sudo systemctl start docker
fi

# Check if containers are running
print_status "Checking container status..."
docker-compose -f docker-compose.prod.local.yml ps

echo ""
echo "=========================================="
echo "🔍 NETWORK DIAGNOSTICS"
echo "=========================================="

# Check what's using port 80
print_status "Checking what's using port 80..."
sudo lsof -i :80 || echo "No process found using port 80"

# Check what's using port 443
print_status "Checking what's using port 443..."
sudo lsof -i :443 || echo "No process found using port 443"

# Check Docker networks
print_status "Checking Docker networks..."
docker network ls

# Check if Traefik is accessible internally
print_status "Checking Traefik internal access..."
if docker-compose -f docker-compose.prod.local.yml exec -T traefik curl -f http://localhost:8080/api/rawdata 2>/dev/null; then
    print_success "Traefik API is accessible internally"
else
    print_warning "Traefik API is not accessible internally"
fi

echo ""
echo "=========================================="
echo "🔍 CONTAINER LOGS"
echo "=========================================="

# Check container logs
print_status "Checking Traefik logs..."
docker-compose -f docker-compose.prod.local.yml logs --tail=20 traefik

print_status "Checking Frontend logs..."
docker-compose -f docker-compose.prod.local.yml logs --tail=20 frontend

print_status "Checking Backend logs..."
docker-compose -f docker-compose.prod.local.yml logs --tail=20 backend

print_status "Checking Database logs..."
docker-compose -f docker-compose.prod.local.yml logs --tail=20 db

echo ""
echo "=========================================="
echo "🔍 ENVIRONMENT CHECK"
echo "=========================================="

# Check if .env.production exists
if [ -f ".env.production" ]; then
    print_success ".env.production file exists"
    print_status "Checking key environment variables..."
    echo "DOMAIN: $(grep '^DOMAIN=' .env.production | cut -d'=' -f2)"
    echo "POSTGRES_PASSWORD: $(grep '^POSTGRES_PASSWORD=' .env.production | cut -d'=' -f2 | head -c 10)..."
    echo "SECRET_KEY: $(grep '^SECRET_KEY=' .env.production | cut -d'=' -f2 | head -c 10)..."
else
    print_error ".env.production file does not exist"
fi

echo ""
echo "=========================================="
echo "🔍 CONNECTIVITY TESTS"
echo "=========================================="

# Test internal connectivity
print_status "Testing internal container connectivity..."

# Test backend health
if docker-compose -f docker-compose.prod.local.yml exec -T backend curl -f http://localhost:8000/api/v1/health 2>/dev/null; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# Test frontend accessibility
if docker-compose -f docker-compose.prod.local.yml exec -T frontend curl -f http://localhost:80/ 2>/dev/null; then
    print_success "Frontend is accessible internally"
else
    print_error "Frontend is not accessible internally"
fi

# Test database connectivity
if docker-compose -f docker-compose.prod.local.yml exec -T db pg_isready -U sci_user -d sci_db 2>/dev/null; then
    print_success "Database is accessible"
else
    print_error "Database is not accessible"
fi

echo ""
echo "=========================================="
echo "🔍 FIREWALL CHECK"
echo "=========================================="

# Check firewall status
print_status "Checking firewall status..."
if command -v ufw &> /dev/null; then
    sudo ufw status
else
    print_warning "UFW not found, checking iptables..."
    sudo iptables -L | head -20
fi

# Check if ports are open
print_status "Checking if ports are listening..."
netstat -tulpn | grep -E ':(80|443|8000|3000)' || echo "No relevant ports found listening"

echo ""
echo "=========================================="
echo "🔍 QUICK FIXES TO TRY"
echo "=========================================="

echo "1. Restart all containers:"
echo "   docker-compose -f docker-compose.prod.local.yml down"
echo "   docker-compose -f docker-compose.prod.local.yml up -d"

echo ""
echo "2. Check if Traefik is properly configured:"
echo "   docker-compose -f docker-compose.prod.local.yml exec traefik cat /etc/traefik/traefik.yml"

echo ""
echo "3. Test direct container access:"
echo "   curl http://localhost:80"
echo "   curl http://localhost:8000/api/v1/health"

echo ""
echo "4. Check if the issue is with Traefik routing:"
echo "   docker-compose -f docker-compose.prod.local.yml logs traefik | grep -i error"

echo ""
echo "5. Verify environment variables:"
echo "   docker-compose -f docker-compose.prod.local.yml exec backend env | grep -E '(DOMAIN|CORS)'"

print_status "Debugging completed. Check the output above for issues." 