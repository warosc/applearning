import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="estudiante")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    attempts = relationship("ExamAttempt", back_populates="user", lazy="select")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan", lazy="select")
    reviews = relationship("PracticeReview", back_populates="user", cascade="all, delete-orphan", lazy="select")
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="select")
