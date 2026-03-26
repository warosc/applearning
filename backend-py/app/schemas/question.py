from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class QuestionOptionSchema(BaseModel):
    id: str
    label: str
    value: str
    is_correct: bool
    weight: float = 0.0
    order_index: int
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class QuestionOptionPublicSchema(BaseModel):
    """Option without is_correct exposed (for students)."""
    id: str
    label: str
    value: str
    weight: float = 0.0
    order_index: int
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class CreateQuestionOptionSchema(BaseModel):
    label: str
    value: str
    is_correct: bool = False
    weight: float = 0.0
    order_index: int = 0
    image_url: Optional[str] = None


class QuestionBase(BaseModel):
    type: str
    prompt: str
    materia: Optional[str] = None
    tema: Optional[str] = None
    subtema: Optional[str] = None
    difficulty: str = "medio"
    order_index: int = 0
    image_url: Optional[str] = None
    score: float = 1.0
    metadata_json: Optional[Any] = None


class CreateQuestionSchema(QuestionBase):
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    options: list[CreateQuestionOptionSchema] = []


class UpdateQuestionSchema(BaseModel):
    type: Optional[str] = None
    prompt: Optional[str] = None
    materia: Optional[str] = None
    tema: Optional[str] = None
    subtema: Optional[str] = None
    difficulty: Optional[str] = None
    order_index: Optional[int] = None
    image_url: Optional[str] = None
    score: Optional[float] = None
    metadata_json: Optional[Any] = None
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    options: Optional[list[CreateQuestionOptionSchema]] = None


class QuestionSchema(QuestionBase):
    id: str
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    created_at: datetime
    options: list[QuestionOptionSchema] = []

    model_config = {"from_attributes": True}


class QuestionPublicSchema(QuestionBase):
    id: str
    exam_id: Optional[str] = None
    section_id: Optional[str] = None
    created_at: datetime
    options: list[QuestionOptionPublicSchema] = []

    model_config = {"from_attributes": True}


class GenerateSectionRequest(BaseModel):
    section_id: str
    materia: Optional[str] = None
    difficulty: Optional[str] = None
    count: int = 10


class GenerateExamRequest(BaseModel):
    exam_id: str
    sections: list[GenerateSectionRequest]


class ImportResult(BaseModel):
    imported: int
    errors: list[str] = []
