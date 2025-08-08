from __future__ import annotations

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from app.core.config import settings
from app.core.db import get_database_url
from app.models import *  # noqa: F401,F403 - import models for metadata
from sqlmodel import SQLModel

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Ensure script_location is set even if no alembic.ini is present
if not config.get_main_option("script_location"):
    config.set_main_option("script_location", "alembic")

# Interpret the config file for Python logging if available.
try:
    if config.config_file_name is not None:
        fileConfig(config.config_file_name)
except Exception:
    # Minimal logging when no formatter/handlers are configured
    pass

# set target metadata
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
