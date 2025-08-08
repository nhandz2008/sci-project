"""Initial models: users and competitions

Revision ID: initial_models_20250808
Revises: 
Create Date: 2025-08-08 23:35:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "initial_models_20250808"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("organization", sa.String(length=100), nullable=False),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # competitions table (without moderation audit fields)
    op.create_table(
        "competitions",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("introduction", sa.String(length=2000), nullable=True),
        sa.Column("question_type", sa.String(length=500), nullable=True),
        sa.Column("selection_process", sa.String(length=1000), nullable=True),
        sa.Column("history", sa.String(length=1000), nullable=True),
        sa.Column("scoring_and_format", sa.String(length=1000), nullable=True),
        sa.Column("awards", sa.String(length=1000), nullable=True),
        sa.Column("penalties_and_bans", sa.String(length=500), nullable=True),
        sa.Column("notable_achievements", sa.String(length=1000), nullable=True),
        sa.Column("competition_link", sa.String(length=500), nullable=True),
        sa.Column("background_image_url", sa.String(length=500), nullable=True),
        sa.Column("detail_image_urls", sa.String(length=2000), nullable=False, server_default="[]"),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("format", sa.String(length=20), nullable=True),
        sa.Column("scale", sa.String(length=20), nullable=True),
        sa.Column("registration_deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("size", sa.Integer(), nullable=True),
        sa.Column("target_age_min", sa.Integer(), nullable=True),
        sa.Column("target_age_max", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_competitions_title", "competitions", ["title"], unique=False)
    op.create_index("ix_competitions_registration_deadline", "competitions", ["registration_deadline"], unique=False)
    op.create_index("ix_competitions_is_active", "competitions", ["is_active"], unique=False)
    op.create_index("ix_competitions_is_featured", "competitions", ["is_featured"], unique=False)
    op.create_index("ix_competitions_is_approved", "competitions", ["is_approved"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_competitions_is_approved", table_name="competitions")
    op.drop_index("ix_competitions_is_featured", table_name="competitions")
    op.drop_index("ix_competitions_is_active", table_name="competitions")
    op.drop_index("ix_competitions_registration_deadline", table_name="competitions")
    op.drop_index("ix_competitions_title", table_name="competitions")
    op.drop_table("competitions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

