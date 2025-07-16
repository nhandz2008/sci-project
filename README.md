# Science Competitions Insight (SCI)

## Development Environment Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (Docker Compose v2.22+ required)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd sci-project
```

### 2. Configure Environment Variables
- Copy the example environment file if provided, or create a `.env` file in the `sci-project` directory with the required variables for Postgres and backend services.

### 3. Build and Start Services
#### For Standard Development
```sh
docker compose up --build
```

#### For Live Code Sync (Recommended for Development)
```sh
docker compose watch
```
- This will sync code changes from your host to the container automatically (requires Docker Compose v2.22+).

### 4. Accessing Services
- **Backend API:** http://localhost:8000
- **Database:** Postgres running on port 5432

### 5. Running Tests (Inside Container)
```sh
docker compose exec backend bash
# Inside the container:
pytest
```

### 6. Code Coverage (Optional)
- Uncomment the `volumes` section in `docker-compose.override.yml` to access coverage reports on your host:
  ```yaml
  volumes:
    - ./backend/htmlcov:/app/htmlcov
  ```
- After running tests with coverage, open `./backend/htmlcov/index.html` in your browser.

---

## Notes
- Do **not** sync or mount your local `.venv` directory into the container. The container manages its own virtual environment.
- Use `docker compose watch` for the best development experience with live code updates.
- For more advanced configuration, see the `docker-compose.yml` and `docker-compose.override.yml` files.
