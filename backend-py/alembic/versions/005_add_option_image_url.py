"""Add image_url to question_options

Revision ID: 005_add_option_image_url
Revises: 004_practice_mode
Create Date: 2026-03-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "005_add_option_image_url"
down_revision = "004_practice_mode"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("question_options", sa.Column("image_url", sa.String(1000), nullable=True))


def downgrade() -> None:
    op.drop_column("question_options", "image_url")
