### SCI Backend Testing (Concise)

#### What’s covered
- **Auth**: signup/login, tokens, password reset
- **Users**: profile, password change, admin ops
- **CRUD**: DB read/write, filters, search, pagination
- **Security**: hashing/verification, JWT/refresh, expirations
- **Dependencies**: auth/role guards
- **Schemas**: validation/serialization
- **Integration**: end-to-end user/admin flows

---

### Setup
- **Prerequisites**
  - Python 3.10–3.12
  - UV package manager (preferred)
    - Install:
      ```bash
      curl -LsSf https://astral.sh/uv/install.sh | sh
      ```
- **Install dependencies** (from repo root or `sci-project/backend/`):
  ```bash
  cd sci-project/backend
  uv sync
  ```

Notes:
- Always run commands from `sci-project/backend`.
- Environment variables for tests are auto-configured; no .env needed.

---

### Run tests
- **All tests**
  ```bash
  uv run run_tests.py
  ```
- **Specific file**
  ```bash
  uv run run_tests.py test_auth_routes
  ```
- **List files and counts**
  ```bash
  uv run run_tests.py --summary
  ```
- **Single test (pytest pattern)**
  ```bash
  uv run pytest tests/test_auth_routes.py::TestAuthSignup::test_signup_success -v -s
  ```

Alternative (direct pytest with coverage):
```bash
uv run pytest tests/ -v --tb=short \
  --cov=app --cov-report=term-missing \
  --cov-report=html:htmlcov --cov-report=xml
```

---

### Coverage
- **HTML report**: open `htmlcov/index.html`
- **XML**: `coverage.xml` for CI
- Focus on meaningful gaps (routes, CRUD, security). Use `# pragma: no cover` sparingly for intentional guards.

---

### Test environment
- **DB**: PostgreSQL (Docker Compose `db` service)
- **Schema**: Managed via Alembic migrations at test session start; tables truncated between tests
- **Env vars**: Set automatically by `run_tests.py` and `tests/conftest.py`:
  - `ENVIRONMENT=test`, `TEST_POSTGRES_DB` (default: `sci_test_db`), and required `POSTGRES_*`

---

### Key fixtures
- `client`: FastAPI `TestClient`
- `session`: SQLModel `Session`
- `auth_headers`: Bearer token for a normal user
- `admin_headers`: Bearer token for an admin user

---

### Tips & troubleshooting
- Use `-k "keyword"` to filter tests quickly:
  ```bash
  uv run pytest -k login -v
  ```
- Some token expiry tests use `time.sleep()`; allow a couple seconds.
- Ensure you’re running from `sci-project/backend` and dependencies are installed with `uv sync`.
- If you see interpreter issues, prefer `uv run ...` to use the managed environment.

---

### CI (example)
```bash
uv run run_tests.py
```
Upload `htmlcov/` or `coverage.xml` as coverage artifacts.
