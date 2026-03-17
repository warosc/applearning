import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=True, index=True)
    section_id = Column(String(36), ForeignKey("exam_sections.id", ondelete="SET NULL"), nullable=True, index=True)
    materia = Column(String(200), nullable=True, index=True)
    tema = Column(String(500), nullable=True)
    subtema = Column(String(500), nullable=True)
    difficulty = Column(String(50), nullable=False, default="medio")
    order_index = Column(Integer, nullable=False, default=0)
    type = Column(String(100), nullable=False)
    prompt = Column(String(5000), nullable=False)
    image_url = Column(String(1000), nullable=True)
    score = Column(Float, nullable=False, default=1.0)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    exam = relationship("Exam", back_populates="questions")
    section = relationship("ExamSection", back_populates="questions")
    options = relationship(
        "QuestionOption",
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="QuestionOption.order_index",
    )
    answers = relationship("Answer", back_populates="question", lazy="select")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(2000), nullable=False)
    value = Column(String(2000), nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    weight = Column(Float, nullable=False, default=0.0)
    order_index = Column(Integer, nullable=False, default=0)

    question = relationship("Question", back_populates="options")
