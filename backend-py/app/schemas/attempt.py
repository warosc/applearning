from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

from app.schemas.exam import ExamSchema


class AnswerSchema(BaseModel):
    id: str
    attempt_id: str
    question_id: str
    answer_json: Any
    is_correct: Optional[bool] = None
    score_obtained: Optional[float] = None
    is_marked_for_review: bool
    answered_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SaveAnswerRequest(BaseModel):
    question_id: str
    answer_json: Any


class MarkReviewRequest(BaseModel):
    question_id: str
    marked: bool


class AttemptBase(BaseModel):
    exam_id: str
    user_id: Optional[str] = None
    status: str = "in_progress"
    score_obtained: Optional[float] = None
    percentage: Optional[float] = None
    current_section_index: int = 0


class AttemptSchema(AttemptBase):
    id: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    answers: list[AnswerSchema] = []
    exam: Optional[ExamSchema] = None

    model_config = {"from_attributes": True}


class AttemptSimpleSchema(AttemptBase):
    id: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None

    model_config = {"from_attributes": True}


class StartAttemptResponse(BaseModel):
    attempt: AttemptSimpleSchema
    exam: ExamSchema


class ResultQuestionBreakdown(BaseModel):
    question_id: str
    prompt: str
    type: str
    materia: Optional[str]
    difficulty: str
    answer_json: Optional[Any]
    is_correct: Optional[bool]
    score_obtained: Optional[float]
    max_score: float
    is_marked_for_review: bool


class MateriaBreakdown(BaseModel):
    materia: str
    score_obtained: float
    total_score: float
    percentage: float
    correct: int
    incorrect: int
    omitted: int


class AttemptResultSchema(BaseModel):
    attempt_id: str
    status: str
    total_score: float
    score_obtained: float
    percentage: float
    correct: int
    incorrect: int
    omitted: int
    time_spent_seconds: Optional[int]
    by_materia: list[MateriaBreakdown] = []
    questions: list[ResultQuestionBreakdown] = []
