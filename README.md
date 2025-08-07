# Science Competitions Insight (SCI)

A full-stack web application for showcasing, managing, and recommending science & technology competitions worldwide.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.10+ (for local development)
- UV package manager (recommended)

### Setup

1. **Clone and navigate to the project**
   ```bash
   cd sci-project
   ```

2. **Run the development setup script**
   ```bash
   ./scripts/dev.sh setup
   ```

3. **Update environment variables**
   Edit `.env` file and change the default values:
   - `SECRET_KEY`: Generate a secure random key
   - `POSTGRES_PASSWORD`: Set a strong database password
   - `FIRST_SUPERUSER_PASSWORD`: Set admin password

4. **Start the application**
   ```bash
   # Option 1: Local development (recommended)
   ./scripts/dev.sh start

   # Option 2: Docker development
   ./scripts/dev.sh docker
   ```

5. **Verify the setup**
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/v1/health

## 🏗️ Project Structure

```
sci-project/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration and utilities
│   │   │   ├── config.py   # Settings and environment
│   │   │   ├── db.py       # Database configuration
│   │   │   └── security.py # JWT and password utilities
│   │   ├── models/         # Database models
│   │   │   ├── common.py   # Base models and enums
│   │   │   ├── user.py     # User model
│   │   │   └── competition.py # Competition model
│   │   └── main.py         # FastAPI application
│   ├── Dockerfile
│   ├── pyproject.toml      # Dependencies and project config
│   └── .gitignore
├── frontend/               # React frontend (to be implemented)
├── scripts/
│   └── dev.sh             # Development helper script
├── docker-compose.yml      # Development environment
├── env.example            # Environment template
└── README.md
```

## 🛠️ Development

### Backend Development

The backend is built with:
- **FastAPI**: Modern, fast web framework
- **SQLModel**: Type-safe database ORM (SQLAlchemy + Pydantic)
- **PostgreSQL**: Database
- **UV**: Fast Python package manager
- **Docker**: Containerization

### Development Scripts

Use the development script for common tasks:

```bash
# Initial setup
./scripts/dev.sh setup

# Start development server
./scripts/dev.sh start

# Install dependencies
./scripts/dev.sh install

# Run tests
./scripts/dev.sh test

# Lint code
./scripts/dev.sh lint

# Format code
./scripts/dev.sh format

# Docker commands
./scripts/dev.sh docker      # Start with Docker
./scripts/dev.sh docker-logs # View logs
./scripts/dev.sh docker-stop # Stop services
```

### Local Development Setup

1. **Install UV** (if not already installed)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Navigate to backend**
   ```bash
   cd backend
   ```

3. **Install dependencies**
   ```bash
   uv sync
   ```

4. **Run the application**
   ```bash
   uv run python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Code Quality

The project uses several tools for code quality:

- **Ruff**: Fast Python linter and formatter
- **MyPy**: Static type checking
- **Pre-commit**: Git hooks for code quality

To set up pre-commit hooks:
```bash
cd backend
uv run pre-commit install
```

### Database

The application uses PostgreSQL with SQLModel for type-safe database operations.

**Database URL**: `postgresql+psycopg://user:password@localhost:5432/sci_db`

**Current Models**:
- `User`: Authentication and user management
- `Competition`: Science competition data

**Migrations**: Alembic will be set up in the next phase for database migrations.

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

- `SECRET_KEY`: JWT token secret
- `POSTGRES_*`: Database configuration
- `AWS_*`: S3 configuration for file uploads
- `LLM_API_*`: LLM API for recommendations
- `FIRST_SUPERUSER_*`: Admin user credentials

### API Endpoints

**Current Endpoints**:
- `GET /`: Root endpoint with API info
- `GET /health`: Health check
- `GET /api/v1/health`: API health check
- `GET /docs`: Interactive API documentation

**Planned Endpoints** (Phase 2):
- Authentication endpoints
- Competition CRUD operations
- User management
- File upload system

## 🚀 Deployment

### Docker Deployment

The application is containerized with Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Considerations

For production deployment:

1. **Security**: Change all default passwords and secrets
2. **SSL**: Configure HTTPS with proper certificates
3. **Database**: Use managed PostgreSQL service
4. **Storage**: Configure AWS S3 for file uploads
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Implement database backup strategy

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] FastAPI backend setup
- [x] PostgreSQL database
- [x] Basic models (User, Competition)
- [x] Docker Compose development environment
- [x] Code quality tools
- [x] Development scripts
- [x] Health check endpoints

### Phase 2: Authentication & Core API
- [ ] JWT authentication
- [ ] User registration/login endpoints
- [ ] Role-based authorization
- [ ] Competition CRUD endpoints
- [ ] File upload system

### Phase 3: Advanced Features
- [ ] Recommendation system (LLM integration)
- [ ] Content moderation workflow
- [ ] Search functionality
- [ ] Basic analytics

### Phase 4: Frontend
- [ ] React + TypeScript setup
- [ ] Authentication flow
- [ ] Competition listing and details
- [ ] Recommendation wizard
- [ ] Admin dashboard

## 🧪 Testing

The application is ready for testing:

```bash
# Test the API locally
curl http://localhost:8000/

# Check health
curl http://localhost:8000/api/v1/health

# View API docs
open http://localhost:8000/docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `./scripts/dev.sh lint && ./scripts/dev.sh test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the project structure and configuration
- Use the development scripts for common tasks
