import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class UserSkill(Base):
    """Tracks how well a user knows a materia/tema pair."""
    __tablename__ = "user_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    materia = Column(String(200), nullable=False)
    tema = Column(String(500), nullable=True)
    nivel = Column(Float, nullable=False, default=50.0)   # 0–100
    aciertos = Column(Integer, nullable=False, default=0)
    errores = Column(Integer, nullable=False, default=0)
    ultima_practica = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="skills")

    __table_args__ = (
        UniqueConstraint("user_id", "materia", "tema", name="uq_user_skill"),
    )


class PracticeReview(Base):
    """Spaced-repetition schedule: when to next show a question to a user."""
    __tablename__ = "practice_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    last_seen = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=False, default=datetime.utcnow)
    times_seen = Column(Integer, nullable=False, default=0)
    times_correct = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="reviews")

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_practice_review"),
    )


class UserProgress(Base):
    """XP, streak, and aggregate stats per user."""
    __tablename__ = "user_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    xp = Column(Integer, nullable=False, default=0)
    streak_days = Column(Integer, nullable=False, default=0)
    last_practice_date = Column(String(10), nullable=True)  # ISO date YYYY-MM-DD
    total_sessions = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="progress")
