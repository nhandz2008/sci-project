"""add_overview_field_to_competitions

Revision ID: 5d423507ceb7
Revises: add_competition_moderation
Create Date: 2025-08-09 15:49:28.691384

"""

from typing import Sequence, Union

from alembic import op  # type: ignore
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5d423507ceb7"
down_revision: Union[str, None] = "add_competition_moderation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add overview column to competitions table
    op.add_column(
        "competitions", sa.Column("overview", sa.String(length=2000), nullable=True)
    )


def downgrade() -> None:
    # Remove overview column from competitions table
    op.drop_column("competitions", "overview")
