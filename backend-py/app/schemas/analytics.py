from pydantic import BaseModel
from typing import Optional


class OverallStatsSchema(BaseModel):
    total_attempts: int
    avg_score: float
    avg_percentage: float
    completion_rate: float


class ExamStatsSchema(BaseModel):
    exam_id: str
    exam_title: str
    total_attempts: int
    completed_attempts: int
    avg_score: float
    avg_percentage: float
    score_distribution: dict


class QuestionStatSchema(BaseModel):
    question_id: str
    prompt: str
    materia: Optional[str]
    difficulty: str
    total_answers: int
    correct_answers: int
    pct_correct: float


class StudentStatSchema(BaseModel):
    user_id: str
    username: str
    name: Optional[str]
    total_attempts: int
    avg_score: float
    best_score: float
    avg_percentage: float
