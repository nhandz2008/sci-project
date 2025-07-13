# Science Competitions Insight (SCI)

A full-stack web application for managing and exploring science & technology competitions worldwide.

---

## 🚀 Features
- Competition browsing, search, and filtering
- AI-powered competition recommendations
- User authentication (admin, content creators)
- Admin dashboard for user and competition management
- File uploads for competition images
- Fully containerized with Docker Compose

---

## 🖥️ VPS Deployment Guide

### 1. Prerequisites
- **Ubuntu 22.04+** (or similar Linux VPS)
- **Docker** and **Docker Compose** installed
- **Domain name** (optional, for production)
- **Git** installed

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd sci-project
```

### 3. Environment Configuration
- Copy the example environment file:
  ```bash
  cp env.example .env
  ```
- Edit `.env` and set secure values for:
  - `POSTGRES_PASSWORD`
  - `REDIS_PASSWORD`
  - `SECRET_KEY`
  - (Optional) Set your domain and CORS origins for production

### 4. Build and Start Services
- Use the provided setup script for a one-command setup:
  ```bash
  ./scripts/docker-setup.sh
  ```
- Or manually:
  ```bash
  docker-compose build --no-cache
  docker-compose up -d
  ```

### 5. Create Admin/Test Users
After the containers are running, seed the database with test/admin users:
```bash
docker-compose exec backend python scripts/create_test_users.py
```
- **Admin login:**
  - Email: `admin@sci.com`
  - Password: `admin123`

### 6. Access the Application
- **Frontend:** http://<your-vps-ip>:3000
- **Backend API:** http://<your-vps-ip>:8000
- **API Docs:** http://<your-vps-ip>:8000/docs
- **Adminer (DB UI):** http://<your-vps-ip>:8080

### 7. Production (Optional)
- Set up **Nginx** as a reverse proxy for HTTPS (see `nginx/` directory for example configs)
- Use a process manager (e.g., systemd) to keep Docker running
- Set up a firewall (e.g., UFW)
- Set up automatic backups for the `postgres_data` Docker volume

---

## 🛠️ Useful Commands
- **View logs:**
  ```bash
  docker-compose logs -f
  ```
- **Stop services:**
  ```bash
  docker-compose down
  ```
- **Rebuild images:**
  ```bash
  docker-compose build --no-cache
  ```
- **Access DB shell:**
  ```bash
  docker-compose exec db psql -U sci_user -d sci_db
  ```
- **Run migrations manually:**
  ```bash
  docker-compose exec backend uv run alembic upgrade head
  ```

---

## 🧩 Troubleshooting
- **Port conflicts:**
  - If port 5432 (Postgres) is in use, Docker will use 5433. Connect to DB on port 5433.
- **Login fails after DB reset:**
  - Re-run the user creation script as above.
- **Frontend 500 errors:**
  - Ensure the backend is healthy and the Vite proxy is set to `http://backend:8000` in Docker.
- **CORS issues:**
  - Update `BACKEND_CORS_ORIGINS` in `.env` to match your frontend domain.

---

## 📦 Directory Structure
```
sci-project/
  backend/      # FastAPI app, models, migrations, scripts
  frontend/     # React + Vite app
  scripts/      # Setup and utility scripts
  uploads/      # Uploaded images (Docker volume)
  docker-compose.yml
  .env
  README.md
```

---

## 📝 Credits
- Built with [FastAPI](https://fastapi.tiangolo.com/) & [React](https://react.dev/)
- Containerized with [Docker Compose](https://docs.docker.com/compose/)

---

For more details, see the [Development Guide](./SCI_Development_Guide.md). 