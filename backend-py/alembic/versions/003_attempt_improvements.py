"""Add violations, time_remaining to exam_attempts; indexes on questions

Revision ID: 003_attempt_improvements
Revises: 002_add_option_weight
Create Date: 2026-03-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "003_attempt_improvements"
down_revision = "002_add_option_weight"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # New columns on exam_attempts
    op.add_column(
        "exam_attempts",
        sa.Column("time_remaining", sa.Integer, nullable=True),
    )
    op.add_column(
        "exam_attempts",
        sa.Column("violations", sa.Integer, nullable=False, server_default="0"),
    )

    # Indexes on questions for faster generator queries
    # ix_questions_materia already exists from 001_initial — skip it
    op.create_index("ix_questions_tema", "questions", ["tema"])
    op.create_index("ix_questions_difficulty", "questions", ["difficulty"])
    op.create_index("ix_questions_exam_id_materia", "questions", ["exam_id", "materia"])


def downgrade() -> None:
    op.drop_index("ix_questions_exam_id_materia", table_name="questions")
    op.drop_index("ix_questions_difficulty", table_name="questions")
    op.drop_index("ix_questions_tema", table_name="questions")
    op.drop_column("exam_attempts", "violations")
    op.drop_column("exam_attempts", "time_remaining")
