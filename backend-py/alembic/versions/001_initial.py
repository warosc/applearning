"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True, unique=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("role", sa.String(50), nullable=False, server_default="estudiante"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"])

    # 2. exams
    op.create_table(
        "exams",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("total_score", sa.Float, nullable=False, server_default="100"),
        sa.Column("duration_minutes", sa.Integer, nullable=False, server_default="60"),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("calculator_enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("navigation_type", sa.String(50), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    # 3. exam_sections
    op.create_table(
        "exam_sections",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "exam_id",
            sa.String(36),
            sa.ForeignKey("exams.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("instructions", sa.String(2000), nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("question_count", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_exam_sections_exam_id", "exam_sections", ["exam_id"])

    # 4. questions
    op.create_table(
        "questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "exam_id",
            sa.String(36),
            sa.ForeignKey("exams.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "section_id",
            sa.String(36),
            sa.ForeignKey("exam_sections.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("materia", sa.String(200), nullable=True),
        sa.Column("tema", sa.String(500), nullable=True),
        sa.Column("subtema", sa.String(500), nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=False, server_default="medio"),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("prompt", sa.String(5000), nullable=False),
        sa.Column("image_url", sa.String(1000), nullable=True),
        sa.Column("score", sa.Float, nullable=False, server_default="1"),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_questions_exam_id", "questions", ["exam_id"])
    op.create_index("ix_questions_section_id", "questions", ["section_id"])
    op.create_index("ix_questions_materia", "questions", ["materia"])

    # 5. question_options
    op.create_table(
        "question_options",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "question_id",
            sa.String(36),
            sa.ForeignKey("questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(2000), nullable=False),
        sa.Column("value", sa.String(2000), nullable=False),
        sa.Column("is_correct", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_question_options_question_id", "question_options", ["question_id"])

    # 6. exam_attempts
    op.create_table(
        "exam_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "exam_id",
            sa.String(36),
            sa.ForeignKey("exams.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("started_at", sa.DateTime, nullable=False),
        sa.Column("submitted_at", sa.DateTime, nullable=True),
        sa.Column("time_spent_seconds", sa.Integer, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="in_progress"),
        sa.Column("score_obtained", sa.Float, nullable=True),
        sa.Column("percentage", sa.Float, nullable=True),
        sa.Column("current_section_index", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_exam_attempts_exam_id", "exam_attempts", ["exam_id"])
    op.create_index("ix_exam_attempts_user_id", "exam_attempts", ["user_id"])

    # 7. answers
    op.create_table(
        "answers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "attempt_id",
            sa.String(36),
            sa.ForeignKey("exam_attempts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            sa.String(36),
            sa.ForeignKey("questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("answer_json", sa.JSON, nullable=True),
        sa.Column("is_correct", sa.Boolean, nullable=True),
        sa.Column("score_obtained", sa.Float, nullable=True),
        sa.Column("is_marked_for_review", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("answered_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_answers_attempt_id", "answers", ["attempt_id"])
    op.create_index("ix_answers_question_id", "answers", ["question_id"])

    # 8. exam_events
    op.create_table(
        "exam_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "attempt_id",
            sa.String(36),
            sa.ForeignKey("exam_attempts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("details", sa.JSON, nullable=True),
        sa.Column("occurred_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_exam_events_attempt_id", "exam_events", ["attempt_id"])

    # 9. form_templates
    op.create_table(
        "form_templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "exam_id",
            sa.String(36),
            sa.ForeignKey("exams.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("title", sa.String(500), nullable=False, server_default="Datos del estudiante"),
        sa.Column("schema_json", sa.JSON, nullable=False),
    )
    op.create_index("ix_form_templates_exam_id", "form_templates", ["exam_id"])

    # 10. form_submissions
    op.create_table(
        "form_submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "attempt_id",
            sa.String(36),
            sa.ForeignKey("exam_attempts.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("payload_json", sa.JSON, nullable=False),
    )
    op.create_index("ix_form_submissions_attempt_id", "form_submissions", ["attempt_id"])


def downgrade() -> None:
    op.drop_table("form_submissions")
    op.drop_table("form_templates")
    op.drop_table("exam_events")
    op.drop_table("answers")
    op.drop_table("exam_attempts")
    op.drop_table("question_options")
    op.drop_table("questions")
    op.drop_table("exam_sections")
    op.drop_table("exams")
    op.drop_table("users")
