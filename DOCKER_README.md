# SCI Project - Docker Setup Guide

This guide covers the containerization setup for the Science Competitions Insight (SCI) project using Docker and Docker Compose.

## 🐳 Overview

The SCI project is containerized with the following services:

- **PostgreSQL 15** - Database
- **Redis 7** - Caching and session storage
- **FastAPI Backend** - Python 3.10 with uv package manager
- **React Frontend** - Node.js 20 with Vite
- **Nginx** - Reverse proxy (production)
- **Adminer** - Database management (development)

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd sci-project

# Run the automated setup script
./scripts/docker-setup.sh
```

The setup script will:
- Check Docker installation
- Create `.env` file from `env.example`
- Generate secure secrets
- Build Docker images
- Start all services
- Wait for services to be ready

### 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env

# Build and start services
docker-compose up -d --build
```

## 🔧 Configuration

### Environment Variables

Edit the `.env` file to configure your setup:

```bash
# Application settings
ENVIRONMENT=development
DEBUG=true
DOMAIN=localhost

# Database
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=sci_db
POSTGRES_USER=sci_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://:your_redis_password@redis:6379/0
REDIS_PASSWORD=your_redis_password

# Security
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# Frontend
VITE_API_URL=http://localhost:8000
```

### Production Configuration

For production deployment:

```bash
# Update environment variables
ENVIRONMENT=production
DEBUG=false
DOMAIN=your-domain.com
VITE_API_URL=https://api.your-domain.com
BACKEND_CORS_ORIGINS=["https://your-domain.com"]

# Use production profile
docker-compose --profile production up -d
```

## 🛠️ Usage

### Development Commands

```bash
# Start all services
docker-compose up -d

# Start with development profile (includes Adminer)
docker-compose --profile development up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild images
docker-compose build

# Rebuild specific service
docker-compose build backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend uv run alembic upgrade head

# Create new migration
docker-compose exec backend uv run alembic revision --autogenerate -m "description"

# Access database shell
docker-compose exec db psql -U sci_user -d sci_db

# Access database from host (development)
psql -h localhost -p 5433 -U sci_user -d sci_db

# Backup database
docker-compose exec db pg_dump -U sci_user sci_db > backup.sql

# Restore database
docker-compose exec -T db psql -U sci_user -d sci_db < backup.sql
```

### Development Workflow

```bash
# Start development environment
docker-compose --profile development up -d

# Make code changes (files are mounted as volumes)
# Changes will be reflected automatically

# View logs for debugging
docker-compose logs -f backend

# Run tests
docker-compose exec backend uv run pytest

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Database Admin: http://localhost:8080
```

## 📁 Project Structure

```
sci-project/
├── backend/
│   ├── Dockerfile          # Production backend image
│   ├── Dockerfile.dev      # Development backend image
│   └── app/                # FastAPI application
├── frontend/
│   ├── Dockerfile          # Production frontend image
│   ├── Dockerfile.dev      # Development frontend image
│   ├── nginx.conf          # Nginx configuration
│   └── src/                # React application
├── scripts/
│   └── docker-setup.sh     # Automated setup script
├── docker-compose.yml      # Main compose file
├── docker-compose.override.yml  # Development overrides
├── .dockerignore           # Docker ignore file
├── env.example             # Environment template
└── DOCKER_README.md        # This file
```

## 🔍 Service Details

### Backend Service

- **Image**: `sci-backend:latest`
- **Port**: 8000
- **Health Check**: `http://localhost:8000/api/health`
- **Features**:
  - FastAPI with uv package manager
  - Hot reloading in development
  - Database migrations
  - File uploads
  - AI recommendation system

### Frontend Service

- **Image**: `sci-frontend:latest`
- **Port**: 3000 (dev) / 80 (prod)
- **Health Check**: `http://localhost/health`
- **Features**:
  - React with TypeScript
  - Vite build system
  - Hot reloading in development
  - Nginx serving in production

### Database Service

- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Health Check**: PostgreSQL readiness
- **Features**:
  - Persistent data storage
  - Automatic initialization
  - Migration support

### Redis Service

- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Health Check**: Redis ping
- **Features**:
  - Session storage
  - Caching
  - Password protection

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check if ports are in use
ss -tulpn | grep :8000
ss -tulpn | grep :3000
ss -tulpn | grep :5432

# If PostgreSQL 5432 is in use, Docker will use 5433
# Stop conflicting services or change ports in docker-compose.override.yml
```

#### 2. Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out and back in
```

#### 3. Database Connection Issues

```bash
# Check database status
docker-compose ps db

# View database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

#### 4. Build Failures

```bash
# Clean build cache
docker-compose build --no-cache

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
```

#### 5. Memory Issues

```bash
# Check resource usage
docker stats

# Increase Docker memory limit
# In Docker Desktop: Settings > Resources > Memory
```

### Debugging Commands

```bash
# Enter container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check service health
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 backend

# Check network connectivity
docker-compose exec backend curl http://db:5432
docker-compose exec backend curl http://redis:6379
```

## 🔒 Security Considerations

### Development

- Use strong passwords in `.env`
- Don't commit `.env` file to version control
- Use development-specific settings
- Enable Adminer only in development

### Production

- Use production-grade secrets
- Enable HTTPS with proper certificates
- Configure firewall rules
- Use secrets management
- Regular security updates
- Monitor logs and access

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose ps

# Manual health checks
curl http://localhost:8000/api/health
curl http://localhost:3000/health
```

### Logging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Follow logs with timestamps
docker-compose logs -f -t backend
```

### Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df
```

## 🔄 Updates and Maintenance

### Updating Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --no-cache

# Update application code
git pull
docker-compose up -d --build
```

### Backup and Restore

```bash
# Backup database
docker-compose exec db pg_dump -U sci_user sci_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# Restore database
docker-compose exec -T db psql -U sci_user -d sci_db < backup.sql
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs -f`
3. Check the project documentation
4. Create an issue with detailed error information

---

**Happy containerizing! 🐳** 