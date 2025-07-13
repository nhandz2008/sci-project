#!/bin/bash

# SCI Project Production Setup Script
# This script sets up the production environment for local builds

set -e

echo "🚀 Setting up SCI Project Production Environment..."

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

# Get EC2 public IP
print_status "Detecting EC2 public IP..."
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")

if [ -z "$EC2_PUBLIC_IP" ]; then
    print_warning "Could not automatically detect EC2 public IP"
    read -p "Please enter your EC2 public IP address: " EC2_PUBLIC_IP
else
    print_success "Detected EC2 public IP: $EC2_PUBLIC_IP"
fi

# Generate secure passwords
print_status "Generating secure passwords..."
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create production environment file
print_status "Creating production environment file..."
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

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/traefik
mkdir -p backups
mkdir -p uploads

# Set proper permissions
print_status "Setting proper permissions..."
chmod 600 .env.production
chmod 755 logs backups uploads

# Create a simple deployment script
print_status "Creating deployment script..."
cat > deploy-production.sh << 'EOF'
#!/bin/bash

# SCI Project Production Deployment Script

set -e

echo "🚀 Deploying SCI Project to Production..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production file not found"
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.local.yml down --remove-orphans

# Build and start services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.local.yml up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Check service health
echo "Checking service health..."
docker-compose -f docker-compose.prod.local.yml ps

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: http://$DOMAIN"
echo "🔧 Traefik dashboard: http://traefik.$DOMAIN"
echo "📊 Grafana dashboard: http://grafana.$DOMAIN (if monitoring is enabled)"
EOF

chmod +x deploy-production.sh

# Create a simple health check script
print_status "Creating health check script..."
cat > check-health.sh << 'EOF'
#!/bin/bash

# SCI Project Health Check Script

set -e

echo "🏥 Checking SCI Project Health..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production file not found"
    exit 1
fi

# Check Docker containers
echo "📦 Checking Docker containers..."
docker-compose -f docker-compose.prod.local.yml ps

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.local.yml exec -T backend curl -f http://localhost:8000/api/v1/health || echo "Backend health check failed"
docker-compose -f docker-compose.prod.local.yml exec -T frontend curl -f http://localhost:3000/ || echo "Frontend health check failed"

# Check database
echo "🗄️ Checking database..."
docker-compose -f docker-compose.prod.local.yml exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || echo "Database health check failed"

# Check Redis
echo "🔴 Checking Redis..."
docker-compose -f docker-compose.prod.local.yml exec -T redis redis-cli ping || echo "Redis health check failed"

echo "✅ Health check completed!"
EOF

chmod +x check-health.sh

print_success "Production environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the generated .env.production file"
echo "2. Run: ./deploy-production.sh"
echo "3. Check health: ./check-health.sh"
echo ""
echo "🔐 Generated credentials:"
echo "   Database password: $POSTGRES_PASSWORD"
echo "   Redis password: $REDIS_PASSWORD"
echo "   Grafana password: $GRAFANA_PASSWORD"
echo "   Secret key: $SECRET_KEY"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo "🌐 Your application will be available at: http://$EC2_PUBLIC_IP" 