# GitHub Actions Secrets Setup Guide

This guide explains how to configure the required secrets for the CI/CD pipeline to deploy the SCI project to AWS EC2.

## 🔐 Required Secrets

### 1. Production Environment Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add the following secrets:

#### Production Server Secrets
```
PRODUCTION_HOST=your-ec2-public-ip
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=your-private-ssh-key-content
PRODUCTION_URL=https://your-domain.com
```

#### Staging Server Secrets (Optional)
```
STAGING_HOST=your-staging-ec2-public-ip
STAGING_USER=ubuntu
STAGING_SSH_KEY=your-staging-private-ssh-key-content
```

#### Notification Secrets (Optional)
```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 🔑 How to Generate SSH Keys

### 1. Generate SSH Key Pair

```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/sci-deploy

# This creates:
# - ~/.ssh/sci-deploy (private key)
# - ~/.ssh/sci-deploy.pub (public key)
```

### 2. Add Public Key to EC2 Instance

```bash
# Copy the public key content
cat ~/.ssh/sci-deploy.pub

# On your EC2 instance, add to authorized_keys
echo "your-public-key-content" >> ~/.ssh/authorized_keys
```

### 3. Add Private Key to GitHub Secrets

```bash
# Copy the private key content
cat ~/.ssh/sci-deploy

# Add this content to PRODUCTION_SSH_KEY secret in GitHub
```

## 🌐 Domain Configuration

### 1. DNS Setup

Configure your domain's DNS records:

```
Type: A
Name: @
Value: your-ec2-public-ip

Type: A
Name: www
Value: your-ec2-public-ip

Type: A
Name: api
Value: your-ec2-public-ip
```

### 2. Update Environment Variables

In your production `.env` file:

```bash
DOMAIN=your-domain.com
VITE_API_URL=https://api.your-domain.com
BACKEND_CORS_ORIGINS=["https://your-domain.com","https://www.your-domain.com","https://api.your-domain.com"]
```

## 🔧 Environment Setup

### 1. Production Environment File

Create `.env` file on your EC2 instance:

```bash
# Copy production template
cp env.production.example .env

# Edit with your values
nano .env
```

### 2. Required Environment Variables

```bash
# Application Settings
ENVIRONMENT=production
DEBUG=false
DOMAIN=your-domain.com

# Database
POSTGRES_PASSWORD=your_secure_database_password
SECRET_KEY=your_secure_secret_key_here

# SSL Configuration
SSL_EMAIL=admin@your-domain.com

# Docker Images
GITHUB_REPOSITORY=your-username/sci-project
DOCKER_IMAGE_BACKEND=ghcr.io/your-username/sci-project-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/your-username/sci-project-frontend

# CORS Settings
BACKEND_CORS_ORIGINS=["https://your-domain.com","https://www.your-domain.com","https://api.your-domain.com"]
VITE_API_URL=https://api.your-domain.com
```

## 🚀 Deployment Workflow

### 1. Manual Deployment

```bash
# On your EC2 instance
cd /opt/sci-production/sci-project

# Pull latest changes
git pull origin main

# Update environment (if needed)
nano .env

# Deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Automated Deployment via GitHub Actions

The CI/CD pipeline will automatically:

1. **Test** the code on push/PR
2. **Build** Docker images on main branch
3. **Push** images to GitHub Container Registry
4. **Deploy** to production server
5. **Health check** the deployment
6. **Notify** on success/failure

### 3. Deployment Triggers

- **Staging:** Push to `develop` branch
- **Production:** Push to `main` branch
- **Security Scan:** On every build

## 🔍 Troubleshooting

### 1. SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/sci-deploy ubuntu@your-ec2-ip

# Check SSH key permissions
chmod 600 ~/.ssh/sci-deploy
chmod 644 ~/.ssh/sci-deploy.pub

# Check EC2 security group
# Ensure port 22 is open
```

### 2. Docker Registry Access

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Test image pull
docker pull ghcr.io/your-username/sci-project-backend:latest
```

### 3. Environment Variable Issues

```bash
# Check environment file
docker-compose -f docker-compose.prod.yml config

# Validate environment
docker-compose -f docker-compose.prod.yml exec backend env | grep -E "(POSTGRES|SECRET|DOMAIN)"
```

## 📊 Monitoring Setup

### 1. Enable Monitoring

```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access dashboards:
# - Grafana: https://grafana.your-domain.com
# - Prometheus: https://prometheus.your-domain.com
# - Traefik: https://traefik.your-domain.com
```

### 2. Setup Alerts

Configure alerting in Grafana or Prometheus for:
- High CPU/Memory usage
- Database connection issues
- Application errors
- SSL certificate expiration

## 🔒 Security Best Practices

### 1. SSH Key Security

```bash
# Use strong passphrase
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/sci-deploy

# Restrict key usage
# In ~/.ssh/authorized_keys on EC2:
from="your-ip-address" ssh-rsa your-public-key
```

### 2. Environment Security

```bash
# Secure environment file
chmod 600 .env

# Use strong passwords
openssl rand -hex 32  # For SECRET_KEY
openssl rand -base64 32  # For POSTGRES_PASSWORD
```

### 3. Network Security

```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 📝 Example Configuration

### Complete `.env` Example

```bash
# Application Settings
ENVIRONMENT=production
DEBUG=false
DOMAIN=your-domain.com

# Database Configuration
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=sci_db
POSTGRES_USER=sci_user
POSTGRES_PASSWORD=your_super_secure_production_password_here

# Redis Configuration
REDIS_URL=redis://:your_redis_password@redis:6379/0
REDIS_PASSWORD=your_redis_password_here

# Security Settings
SECRET_KEY=your_super_secret_production_key_here_use_openssl_rand_hex_32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Settings (Production)
BACKEND_CORS_ORIGINS=["https://your-domain.com","https://www.your-domain.com","https://api.your-domain.com"]

# Frontend Configuration
VITE_API_URL=https://api.your-domain.com

# Docker Configuration
DOCKER_IMAGE_BACKEND=ghcr.io/your-username/sci-project-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/your-username/sci-project-frontend
TAG=latest
GITHUB_REPOSITORY=your-username/sci-project

# SSL & Domain Configuration
SSL_EMAIL=admin@your-domain.com
TRAEFIK_AUTH=admin:$$2y$$10$$your_hashed_password_here

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# AI Recommendation Settings
AI_MODEL_VERSION=1.0
RECOMMENDATION_CACHE_TTL=3600

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_here
ENABLE_METRICS=true
GRAFANA_PASSWORD=your_grafana_admin_password

# First Superuser
FIRST_SUPERUSER=admin@your-domain.com
FIRST_SUPERUSER_PASSWORD=your_secure_admin_password
```

## 🎯 Next Steps

After setting up secrets:

1. **Test the pipeline** by pushing to `develop` branch
2. **Monitor deployment** in GitHub Actions tab
3. **Verify application** is accessible at your domain
4. **Setup monitoring** and alerting
5. **Configure backups** and disaster recovery
6. **Document procedures** for your team

---

**Important:** Never commit secrets to your repository. Always use GitHub Secrets for sensitive information. 