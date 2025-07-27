# Ref: https://docs.astral.sh/uv/guides/integration/docker/

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
# Compile bytecode
ENV UV_COMPILE_BYTECODE=1
# uv Caching
ENV UV_LINK_MODE=copy

WORKDIR /app

# Installing uv
COPY --from=ghcr.io/astral-sh/uv:0.7.20 /uv /uvx /bin/

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

# Installing a project
COPY ./app /app/app
COPY ./scripts /app/scripts
COPY ./alembic.ini ./pyproject.toml ./uv.lock /app/

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# Using the environment
ENV PATH="/app/.venv/bin:$PATH"

ENV PYTHONPATH=/app

