"""Add practice mode tables: user_skills, practice_reviews, user_progress

Revision ID: 004_practice_mode
Revises: 003_attempt_improvements
Create Date: 2026-03-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "004_practice_mode"
down_revision = "003_attempt_improvements"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # user_skills — skill level per user/materia/tema
    op.create_table(
        "user_skills",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("materia", sa.String(200), nullable=False),
        sa.Column("tema", sa.String(500), nullable=True),
        sa.Column("nivel", sa.Float, nullable=False, server_default="50.0"),
        sa.Column("aciertos", sa.Integer, nullable=False, server_default="0"),
        sa.Column("errores", sa.Integer, nullable=False, server_default="0"),
        sa.Column("ultima_practica", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "materia", "tema", name="uq_user_skill"),
    )
    op.create_index("ix_user_skills_user_id", "user_skills", ["user_id"])

    # practice_reviews — spaced-repetition schedule per user/question
    op.create_table(
        "practice_reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(36), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("last_seen", sa.DateTime, nullable=True),
        sa.Column("next_review", sa.DateTime, nullable=False),
        sa.Column("times_seen", sa.Integer, nullable=False, server_default="0"),
        sa.Column("times_correct", sa.Integer, nullable=False, server_default="0"),
        sa.UniqueConstraint("user_id", "question_id", name="uq_practice_review"),
    )
    op.create_index("ix_practice_reviews_user_id", "practice_reviews", ["user_id"])
    op.create_index("ix_practice_reviews_next_review", "practice_reviews", ["next_review"])

    # user_progress — XP, streak, totals
    op.create_table(
        "user_progress",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("streak_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_practice_date", sa.String(10), nullable=True),
        sa.Column("total_sessions", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_progress_user_id", table_name="user_progress")
    op.drop_table("user_progress")

    op.drop_index("ix_practice_reviews_next_review", table_name="practice_reviews")
    op.drop_index("ix_practice_reviews_user_id", table_name="practice_reviews")
    op.drop_table("practice_reviews")

    op.drop_index("ix_user_skills_user_id", table_name="user_skills")
    op.drop_table("user_skills")
