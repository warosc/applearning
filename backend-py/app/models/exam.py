import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    description = Column(String(2000), nullable=True)
    total_score = Column(Float, nullable=False, default=100.0)
    duration_minutes = Column(Integer, nullable=False, default=60)
    is_published = Column(Boolean, nullable=False, default=False)
    calculator_enabled = Column(Boolean, nullable=False, default=True)
    navigation_type = Column(String(50), nullable=False, default="free")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sections = relationship("ExamSection", back_populates="exam", cascade="all, delete-orphan", lazy="select", order_by="ExamSection.order_index")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan", lazy="select")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan", lazy="select")
    form_template = relationship("FormTemplate", back_populates="exam", uselist=False, cascade="all, delete-orphan", lazy="select")


class ExamSection(Base):
    __tablename__ = "exam_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    instructions = Column(String(2000), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    question_count = Column(Integer, nullable=False, default=0)

    exam = relationship("Exam", back_populates="sections")
    questions = relationship("Question", back_populates="section", lazy="select", order_by="Question.order_index")


class FormTemplate(Base):
    __tablename__ = "form_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String(500), nullable=False, default="Datos del estudiante")
    schema_json = Column(JSON, nullable=False, default=dict)

    exam = relationship("Exam", back_populates="form_template")


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    payload_json = Column(JSON, nullable=False, default=dict)

    attempt = relationship("ExamAttempt", back_populates="form_submission")
