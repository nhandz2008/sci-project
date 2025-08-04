# Science Competitions Insight (SCI)

A platform for discovering and managing science competitions worldwide.

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (Docker Compose v2.22+)
- [Git](https://git-scm.com/)

### Setup

1. **Clone and navigate**
   ```bash
   git clone <your-repo-url>
   cd sci-project
   ```

2. **Start database only**
   ```bash
   docker compose up db -d
   ```

3. **Initialize database**
   ```bash
   ./scripts/init-db.sh
   ```

4. **Start all services**
   ```bash
   docker compose up --build
   ```

5. **Verify setup**
   ```bash
   ./scripts/verify-setup.sh
   ```

### Access

- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/api/v1/docs
- **Admin User**: admin@sci.com / admin123

### Development

For live code updates during development:
```bash
docker compose watch
```

### Testing

```bash
docker compose exec backend pytest
```

---

## Project Structure

```
sci-project/
├── backend/           # FastAPI application
├── scripts/           # Utility scripts
├── docker-compose.yml # Service configuration
└── .env              # Environment variables
```

## Troubleshooting

If you encounter issues:
1. Check service logs: `docker compose logs`
2. Restart services: `docker compose down && docker compose up --build`
3. See `backend/README.md` for detailed backend documentation
