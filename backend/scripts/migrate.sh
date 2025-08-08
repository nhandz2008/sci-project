#!/usr/bin/env bash
set -euo pipefail

# Usage: ENVIRONMENT=local ./scripts/migrate.sh [upgrade|downgrade] [revision]

ACTION=${1:-upgrade}
REVISION=${2:-head}

export PYTHONPATH=$(pwd)

echo "Running Alembic migrations: $ACTION $REVISION"

uv run --project . -m alembic $ACTION $REVISION

