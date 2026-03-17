"""Add weight to question_options

Revision ID: 002_add_option_weight
Revises: 001_initial
Create Date: 2026-03-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "002_add_option_weight"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "question_options",
        sa.Column("weight", sa.Float, nullable=False, server_default="0.0"),
    )


def downgrade() -> None:
    op.drop_column("question_options", "weight")
