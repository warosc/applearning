from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

from app.schemas.question import QuestionPublicSchema


class ExamSectionBase(BaseModel):
    title: str
    instructions: Optional[str] = None
    order_index: int = 0
    question_count: int = 0


class CreateExamSectionSchema(ExamSectionBase):
    pass


class UpdateExamSectionSchema(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    order_index: Optional[int] = None
    question_count: Optional[int] = None


class ExamSectionSchema(ExamSectionBase):
    id: str
    exam_id: str
    questions: list[QuestionPublicSchema] = []

    model_config = {"from_attributes": True}


class ExamSectionSimpleSchema(ExamSectionBase):
    id: str
    exam_id: str

    model_config = {"from_attributes": True}


class FormTemplateSchema(BaseModel):
    id: str
    exam_id: str
    title: str
    schema_json: Any

    model_config = {"from_attributes": True}


class UpsertFormTemplateSchema(BaseModel):
    title: str = "Datos del estudiante"
    schema_json: Any = {}


class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    total_score: float = 100.0
    duration_minutes: int = 60
    is_published: bool = False
    calculator_enabled: bool = True
    navigation_type: str = "free"


class CreateExamSchema(ExamBase):
    pass


class UpdateExamSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_score: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_published: Optional[bool] = None
    calculator_enabled: Optional[bool] = None
    navigation_type: Optional[str] = None


class ExamSchema(ExamBase):
    id: str
    created_at: datetime
    updated_at: datetime
    sections: list[ExamSectionSchema] = []

    model_config = {"from_attributes": True}


class ExamSimpleSchema(ExamBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
