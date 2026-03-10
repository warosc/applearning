import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False, default="in_progress")
    score_obtained = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    current_section_index = Column(Integer, nullable=False, default=0)

    exam = relationship("Exam", back_populates="attempts")
    user = relationship("User", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan", lazy="select")
    events = relationship("ExamEvent", back_populates="attempt", cascade="all, delete-orphan", lazy="select")
    form_submission = relationship("FormSubmission", back_populates="attempt", uselist=False, cascade="all, delete-orphan", lazy="select")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    answer_json = Column(JSON, nullable=False)
    is_correct = Column(Boolean, nullable=True)
    score_obtained = Column(Float, nullable=True)
    is_marked_for_review = Column(Boolean, nullable=False, default=False)
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    attempt = relationship("ExamAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
