"""Add competition moderation fields and indices

Revision ID: add_competition_moderation
Revises: initial_models_20250808
Create Date: 2025-08-08 23:30:00

"""

from typing import Sequence, Union

from alembic import op  # type: ignore[attr-defined]
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_competition_moderation"
down_revision: Union[str, None] = "initial_models_20250808"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("competitions") as batch_op:
        batch_op.add_column(sa.Column("approved_by", sa.UUID(), nullable=True))
        batch_op.add_column(
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("rejection_reason", sa.String(length=500), nullable=True)
        )
        batch_op.create_index("ix_competitions_format", ["format"])
        batch_op.create_index("ix_competitions_scale", ["scale"])
        batch_op.create_index("ix_competitions_owner_id", ["owner_id"])


def downgrade() -> None:
    with op.batch_alter_table("competitions") as batch_op:
        batch_op.drop_index("ix_competitions_owner_id")
        batch_op.drop_index("ix_competitions_scale")
        batch_op.drop_index("ix_competitions_format")
        batch_op.drop_column("rejection_reason")
        batch_op.drop_column("approved_at")
        batch_op.drop_column("approved_by")
