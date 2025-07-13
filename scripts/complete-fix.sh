#!/bin/bash

# SCI Project Complete Fix Script
# This script fixes all deployment issues in one go

set -e

echo "🔧 Complete SCI Project Fix..."

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

# Step 1: Stop all containers
print_status "Step 1: Stopping all containers..."
docker-compose -f docker-compose.prod.local.yml down --remove-orphans --volumes

# Step 2: Get EC2 public IP
print_status "Step 2: Detecting EC2 public IP..."
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")

if [ -z "$EC2_PUBLIC_IP" ]; then
    print_warning "Could not automatically detect EC2 public IP"
    read -p "Please enter your EC2 public IP address: " EC2_PUBLIC_IP
else
    print_success "Detected EC2 public IP: $EC2_PUBLIC_IP"
fi

# Step 3: Generate new secure passwords
print_status "Step 3: Generating new secure passwords..."
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Step 4: Create new production environment file
print_status "Step 4: Creating new production environment file..."
cat > .env.production << EOF
# SCI Project Production Environment Configuration
# This file is configured for local builds on EC2

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
ENVIRONMENT=production
DEBUG=false
DOMAIN=$EC2_PUBLIC_IP

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=sci_db
POSTGRES_USER=sci_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379/0
REDIS_PASSWORD=$REDIS_PASSWORD

# =============================================================================
# SECURITY SETTINGS
# =============================================================================
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# =============================================================================
# CORS SETTINGS (Production)
# =============================================================================
BACKEND_CORS_ORIGINS=["http://$EC2_PUBLIC_IP","https://$EC2_PUBLIC_IP"]

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================
VITE_API_URL=http://$EC2_PUBLIC_IP

# =============================================================================
# DOCKER CONFIGURATION (Local Build)
# =============================================================================
DOCKER_IMAGE_BACKEND=ghcr.io/your-username/sci-project-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/your-username/sci-project-frontend
TAG=latest
GITHUB_REPOSITORY=your-username/sci-project

# =============================================================================
# SSL & DOMAIN CONFIGURATION
# =============================================================================
SSL_EMAIL=admin@your-domain.com
TRAEFIK_AUTH=admin:\$\$2y\$\$10\$\$your_hashed_password_here

# =============================================================================
# FILE UPLOAD SETTINGS
# =============================================================================
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# =============================================================================
# AI RECOMMENDATION SETTINGS
# =============================================================================
AI_MODEL_VERSION=1.0
RECOMMENDATION_CACHE_TTL=3600

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=INFO
LOG_FORMAT=json

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
SENTRY_DSN=your_sentry_dsn_here
ENABLE_METRICS=true
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# =============================================================================
# EMAIL SETTINGS (Optional - for future features)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
EMAILS_FROM_EMAIL=noreply@your-domain.com

# =============================================================================
# FIRST SUPERUSER (for initial setup)
# =============================================================================
FIRST_SUPERUSER=admin@your-domain.com
FIRST_SUPERUSER_PASSWORD=admin_password_2024

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *

# =============================================================================
# PERFORMANCE TUNING
# =============================================================================
WORKER_PROCESSES=4
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30

# =============================================================================
# SECURITY HEADERS
# =============================================================================
ENABLE_HSTS=true
ENABLE_CSP=true
ENABLE_XSS_PROTECTION=true
EOF

chmod 600 .env.production

# Step 5: Create necessary directories
print_status "Step 5: Creating necessary directories..."
mkdir -p logs/traefik
mkdir -p backups
mkdir -p uploads
chmod 755 logs backups uploads

# Step 6: Clean up any existing volumes
print_status "Step 6: Cleaning up existing volumes..."
docker volume prune -f 2>/dev/null || true

# Step 7: Build and start services
print_status "Step 7: Building and starting services..."
docker-compose -f docker-compose.prod.local.yml up -d --build

# Step 8: Wait for services to be ready
print_status "Step 8: Waiting for services to be ready..."
sleep 45

# Step 9: Check container status
print_status "Step 9: Checking container status..."
docker-compose -f docker-compose.prod.local.yml ps

# Step 10: Test connectivity
print_status "Step 10: Testing connectivity..."

# Wait a bit more for services to fully start
sleep 15

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

# Step 11: Show final status
print_success "Complete fix completed!"
echo ""
echo "🌐 Your application should be available at: http://$EC2_PUBLIC_IP"
echo ""
echo "🔐 New credentials generated:"
echo "   Database password: $POSTGRES_PASSWORD"
echo "   Redis password: $REDIS_PASSWORD"
echo "   Grafana password: $GRAFANA_PASSWORD"
echo "   Secret key: $SECRET_KEY"
echo ""
echo "📋 If the website is still not accessible, check the logs:"
echo "   docker-compose -f docker-compose.prod.local.yml logs frontend"
echo "   docker-compose -f docker-compose.prod.local.yml logs traefik" 