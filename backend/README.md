# SCI Backend Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Development Setup](#development-setup)
3. [Production Setup](#production-setup)
4. [Database Management](#database-management)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)

## Overview

The SCI (Science Competitions Insight) backend is a FastAPI application with the following key technologies:

- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLModel ORM
- **Authentication**: JWT-based authentication with refresh tokens
- **Migrations**: Alembic for database schema management
- **Package Manager**: UV (fast Python package installer)
- **Containerization**: Docker with Docker Compose

### Project Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── routes/          # API route definitions
│   │   ├── deps.py          # FastAPI dependencies
│   │   └── main.py          # API router configuration
│   ├── core/
│   │   ├── config.py        # Application settings
│   │   ├── db.py           # Database configuration
│   │   └── security.py     # Authentication utilities
│   ├── models/
│   │   ├── user.py         # User data models
│   │   ├── competition.py  # Competition data models
│   │   └── common.py       # Shared models
│   ├── alembic/
│   │   └── versions/       # Database migration files
│   ├── crud.py             # Database operations
│   ├── main.py             # FastAPI application entry point
│   └── tests/              # Test files
├── scripts/                # Utility scripts
├── Dockerfile              # Container definition
├── pyproject.toml         # Python dependencies
├── alembic.ini            # Alembic configuration
└── uv.lock               # Locked dependency versions
```

## Development Setup

### Prerequisites

#### Required Software
- **Docker Desktop** (v20.10+ with Compose v2.22+)
- **Git** (v2.30+)
- **Python 3.12+** (optional, for local development)

#### System Requirements
- **Memory**: 4GB+ RAM
- **Storage**: 2GB+ free space
- **OS**: Linux, macOS, or Windows with WSL2

### Quick Start (Recommended)

#### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd sci-project
```

#### 2. Environment Configuration
Create environment file from template:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```bash
# === Project Info ===
PROJECT_NAME=Science Competitions Insight
ENVIRONMENT=local

# === Security ===
SECRET_KEY=your-secret-key-here-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# === Database ===
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=sci_db

# === CORS ===
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_HOST=http://localhost:3000

# === Admin User ===
FIRST_SUPERUSER=admin@sci.com
FIRST_SUPERUSER_PASSWORD=admin123
```

#### 3. Start Development Environment
```bash
# Build and start all services
docker compose up --build

# Or for live code sync (recommended)
docker compose watch
```

#### 4. Verify Setup
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **Database**: PostgreSQL on localhost:5432

### Local Development (Without Docker)

#### 1. Install UV Package Manager
```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### 2. Setup Python Environment
```bash
cd backend

# Create virtual environment and install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows
```

#### 3. Setup Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE sci_db;
CREATE USER sci_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sci_db TO sci_user;
\q
```

#### 4. Configure Environment
Update `.env` for local PostgreSQL:
```bash
POSTGRES_SERVER=localhost
POSTGRES_USER=sci_user
POSTGRES_PASSWORD=your_password
```

#### 5. Run Migrations and Start Server
```bash
# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Development Commands

#### Docker Commands
```bash
# Start services
docker compose up

# Start with rebuild
docker compose up --build

# Start in background
docker compose up -d

# Watch for file changes (recommended)
docker compose watch

# Stop services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f db

# Access backend container
docker compose exec backend bash

# Reset everything
docker compose down -v
docker compose up --build
```

#### Database Commands
```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Reset database
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head

# Access database
docker compose exec db psql -U postgres -d sci_db
```

#### Backend Commands (inside container)
```bash
# Access container
docker compose exec backend bash

# Install new dependencies
uv add package-name

# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Format code
ruff format app/

# Lint code
ruff check app/

# Type checking
mypy app/
```

## Production Setup

### Environment Preparation

#### 1. Server Requirements
- **OS**: Ubuntu 22.04 LTS (recommended)
- **Memory**: 2GB+ RAM
- **Storage**: 10GB+ SSD
- **CPU**: 1+ cores
- **Network**: Public IP with ports 80, 443, 22 open

#### 2. Install Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin
```

#### 3. Setup SSL/TLS (Optional but Recommended)
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d api.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Production Deployment

#### 1. Clone and Configure
```bash
# Clone repository
git clone <your-repo-url>
cd sci-project

# Create production environment file
cp .env.example .env
```

#### 2. Production Environment Variables
```bash
# === Project Info ===
PROJECT_NAME=Science Competitions Insight
ENVIRONMENT=production

# === Security ===
SECRET_KEY=super-secure-random-key-at-least-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# === Database ===
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=sci_user
POSTGRES_PASSWORD=super-secure-db-password
POSTGRES_DB=sci_production

# === CORS ===
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_HOST=https://yourdomain.com

# === Admin User ===
FIRST_SUPERUSER=admin@yourdomain.com
FIRST_SUPERUSER_PASSWORD=secure-admin-password

# === Email (for notifications) ===
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=email-password
EMAILS_FROM_EMAIL=noreply@yourdomain.com
EMAILS_FROM_NAME=Science Competitions Insight
```

#### 3. Production Docker Compose
Create `docker-compose.prod.yml`:
```yaml
services:
  db:
    image: postgres:17.5
    restart: always
    environment:
      POSTGRES_SERVER: ${POSTGRES_SERVER}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      retries: 5
      start_period: 30s
      timeout: 10s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - POSTGRES_SERVER=db
    env_file:
      - .env
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 4. Nginx Configuration
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 5. Deploy to Production
```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Production Monitoring

#### 1. Health Checks
```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check application health
curl https://api.yourdomain.com/api/v1/health/

# Check database connectivity
docker compose -f docker-compose.prod.yml exec backend python -c "
from app.core.db import init_db
from sqlmodel import Session, create_engine
from app.core.config import settings
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
with Session(engine) as session:
    print('Database connection successful')
"
```

#### 2. Log Monitoring
```bash
# View application logs
docker compose -f docker-compose.prod.yml logs -f backend

# View database logs
docker compose -f docker-compose.prod.yml logs -f db

# View nginx logs
docker compose -f docker-compose.prod.yml logs -f nginx
```

#### 3. Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sci_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U sci_user sci_production > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x backup.sh

# Setup daily backup cron job
echo "0 2 * * * /path/to/your/project/backup.sh" | crontab -
```

## Database Management

### Migrations

#### Creating Migrations
```bash
# Auto-generate migration from model changes
docker compose exec backend alembic revision --autogenerate -m "Add new field to competition"

# Create empty migration
docker compose exec backend alembic revision -m "Custom migration"

# Review generated migration file in app/alembic/versions/
```

#### Running Migrations
```bash
# Upgrade to latest
docker compose exec backend alembic upgrade head

# Upgrade to specific revision
docker compose exec backend alembic upgrade revision_id

# Downgrade one revision
docker compose exec backend alembic downgrade -1

# Downgrade to specific revision
docker compose exec backend alembic downgrade revision_id
```

#### Migration History
```bash
# Show current revision
docker compose exec backend alembic current

# Show migration history
docker compose exec backend alembic history

# Show pending migrations
docker compose exec backend alembic show
```

### Database Operations

#### Data Management
```bash
# Access database shell
docker compose exec db psql -U postgres -d sci_db

# Export data
docker compose exec db pg_dump -U postgres sci_db > backup.sql

# Import data
docker compose exec -T db psql -U postgres sci_db < backup.sql

# Reset database (WARNING: Deletes all data)
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

#### Database Inspection
```sql
-- Connect to database
\c sci_db

-- List tables
\dt

-- Describe table structure
\d competition
\d user

-- Check admin user
SELECT * FROM "user" WHERE role = 'admin';

-- Check competitions count
SELECT COUNT(*) FROM competition;

-- Exit
\q
```

## Testing

### Running Tests

#### Basic Testing
```bash
# Run all tests
docker compose exec backend pytest

# Run with coverage
docker compose exec backend pytest --cov=app

# Run specific test file
docker compose exec backend pytest app/tests/test_auth.py

# Run with verbose output
docker compose exec backend pytest -v

# Run tests matching pattern
docker compose exec backend pytest -k "test_user"
```

#### Test Configuration
```bash
# Set test environment variables
export TESTING=true
export DATABASE_URL=postgresql://test_user:test_pass@localhost/test_db

# Run tests against test database
docker compose exec backend pytest --database-url=$DATABASE_URL
```

### Code Quality

#### Linting and Formatting
```bash
# Format code
docker compose exec backend ruff format app/

# Check for linting issues
docker compose exec backend ruff check app/

# Fix auto-fixable issues
docker compose exec backend ruff check app/ --fix

# Type checking
docker compose exec backend mypy app/
```

#### Pre-commit Hooks (Optional)
```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check container logs
docker compose logs backend

# Check if ports are available
netstat -tulpn | grep 8000

# Rebuild containers
docker compose down
docker compose up --build
```

#### 2. Database Connection Issues
```bash
# Check database status
docker compose ps db

# Check database logs
docker compose logs db

# Test database connection
docker compose exec backend python -c "
from app.core.config import settings
print(f'Database URL: {settings.SQLALCHEMY_DATABASE_URI}')
"

# Reset database connection
docker compose restart db
docker compose restart backend
```

#### 3. Migration Issues
```bash
# Check current migration status
docker compose exec backend alembic current

# Check for conflicts
docker compose exec backend alembic history

# Force migration state (DANGEROUS)
docker compose exec backend alembic stamp head
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

#### 5. Environment Variable Issues
```bash
# Check environment variables
docker compose exec backend env | grep -E "POSTGRES|SECRET|ENVIRONMENT"

# Reload environment
docker compose down
docker compose up
```

### Performance Issues

#### 1. Slow Database Queries
```sql
-- Enable query logging (in PostgreSQL)
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

#### 2. Memory Issues
```bash
# Check container memory usage
docker stats

# Increase container memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### 3. Connection Pool Issues
```python
# Adjust connection pool settings in app/core/db.py
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set environment variable
export LOG_LEVEL=DEBUG

# Or in .env file
LOG_LEVEL=DEBUG

# Restart services
docker compose restart backend
```

#### Interactive Debugging
```bash
# Access backend container
docker compose exec backend bash

# Start Python shell with app context
python -c "
from app.core.config import settings
from app.core.db import init_db
print('Settings loaded:', settings.PROJECT_NAME)
"
```

## API Documentation

### Accessing Documentation
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Authentication Testing
```bash
# Get auth token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@sci.com&password=admin123"

# Use token for authenticated requests
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Quick API Health Check
```bash
# Health endpoint
curl http://localhost:8000/api/v1/health/

# Database test
curl http://localhost:8000/api/v1/utils/test-db

# API info
curl http://localhost:8000/api/v1/utils/info
```

---

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLModel Documentation**: https://sqlmodel.tiangolo.com/
- **Alembic Documentation**: https://alembic.sqlalchemy.org/
- **Docker Compose Documentation**: https://docs.docker.com/compose/
- **UV Package Manager**: https://github.com/astral-sh/uv

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs: `docker compose logs -f backend`
3. Check database connectivity: `docker compose exec db psql -U postgres`
4. Verify environment configuration: `docker compose exec backend env`

---

**Last Updated**: January 2024  
**Version**: 1.0.0
