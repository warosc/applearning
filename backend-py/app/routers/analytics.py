from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.deps import get_db, require_admin
from app.models.attempt import ExamAttempt, Answer
from app.models.exam import Exam
from app.models.question import Question
from app.models.user import User
from app.schemas.analytics import (
    OverallStatsSchema,
    ExamStatsSchema,
    QuestionStatSchema,
    StudentStatSchema,
)
from app.schemas.attempt import AttemptSchema

router = APIRouter()


@router.get("/analytics", response_model=OverallStatsSchema)
def overall_analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total = db.query(func.count(ExamAttempt.id)).scalar() or 0
    completed = (
        db.query(func.count(ExamAttempt.id))
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0
    )
    avg_score = (
        db.query(func.avg(ExamAttempt.score_obtained))
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0.0
    )
    avg_pct = (
        db.query(func.avg(ExamAttempt.percentage))
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0.0
    )
    completion_rate = (completed / total * 100) if total > 0 else 0.0

    return OverallStatsSchema(
        total_attempts=total,
        avg_score=round(float(avg_score), 2),
        avg_percentage=round(float(avg_pct), 2),
        completion_rate=round(completion_rate, 2),
    )


@router.get("/analytics/exams/{exam_id}", response_model=ExamStatsSchema)
def exam_analytics(exam_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Exam not found")

    total = (
        db.query(func.count(ExamAttempt.id))
        .filter(ExamAttempt.exam_id == exam_id)
        .scalar()
        or 0
    )
    completed = (
        db.query(func.count(ExamAttempt.id))
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0
    )
    avg_score = (
        db.query(func.avg(ExamAttempt.score_obtained))
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0.0
    )
    avg_pct = (
        db.query(func.avg(ExamAttempt.percentage))
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0.0
    )

    # Score distribution: bucket by 10s (0-10, 10-20, ..., 90-100)
    distribution = {}
    rows = (
        db.query(ExamAttempt.percentage)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "expired"]))
        .all()
    )
    for (pct,) in rows:
        if pct is None:
            continue
        bucket = min(int(pct // 10) * 10, 90)
        key = f"{bucket}-{bucket + 10}"
        distribution[key] = distribution.get(key, 0) + 1

    return ExamStatsSchema(
        exam_id=exam_id,
        exam_title=exam.title,
        total_attempts=total,
        completed_attempts=completed,
        avg_score=round(float(avg_score), 2),
        avg_percentage=round(float(avg_pct), 2),
        score_distribution=distribution,
    )


@router.get("/analytics/questions", response_model=list[QuestionStatSchema])
def question_analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.query(
            Question.id,
            Question.prompt,
            Question.materia,
            Question.difficulty,
            func.count(Answer.id).label("total_answers"),
            func.sum(case((Answer.is_correct == True, 1), else_=0)).label("correct_answers"),
        )
        .outerjoin(Answer, Answer.question_id == Question.id)
        .group_by(Question.id, Question.prompt, Question.materia, Question.difficulty)
        .order_by(func.count(Answer.id).desc())
        .limit(100)
        .all()
    )

    result = []
    for row in rows:
        total = row.total_answers or 0
        correct = int(row.correct_answers or 0)
        pct = (correct / total * 100) if total > 0 else 0.0
        result.append(
            QuestionStatSchema(
                question_id=row.id,
                prompt=row.prompt[:200],
                materia=row.materia,
                difficulty=row.difficulty,
                total_answers=total,
                correct_answers=correct,
                pct_correct=round(pct, 2),
            )
        )
    return result


@router.get("/analytics/students", response_model=list[StudentStatSchema])
def student_analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = (
        db.query(
            User.id,
            User.username,
            User.name,
            func.count(ExamAttempt.id).label("total_attempts"),
            func.avg(ExamAttempt.score_obtained).label("avg_score"),
            func.max(ExamAttempt.score_obtained).label("best_score"),
            func.avg(ExamAttempt.percentage).label("avg_percentage"),
        )
        .outerjoin(ExamAttempt, ExamAttempt.user_id == User.id)
        .group_by(User.id, User.username, User.name)
        .order_by(func.count(ExamAttempt.id).desc())
        .all()
    )

    result = []
    for row in rows:
        result.append(
            StudentStatSchema(
                user_id=row.id,
                username=row.username,
                name=row.name,
                total_attempts=row.total_attempts or 0,
                avg_score=round(float(row.avg_score or 0), 2),
                best_score=round(float(row.best_score or 0), 2),
                avg_percentage=round(float(row.avg_percentage or 0), 2),
            )
        )
    return result


class AdminAttemptSchema(BaseModel):
    id: str
    exam_id: str
    exam_title: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    status: str
    score_obtained: Optional[float] = None
    percentage: Optional[float] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None

    model_config = {"from_attributes": True}


@router.get("/attempts", response_model=list[AdminAttemptSchema])
def list_all_attempts(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(ExamAttempt)
        .order_by(ExamAttempt.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for attempt in rows:
        result.append(
            AdminAttemptSchema(
                id=attempt.id,
                exam_id=attempt.exam_id,
                exam_title=attempt.exam.title if attempt.exam else "",
                user_id=attempt.user_id,
                username=attempt.user.username if attempt.user else None,
                status=attempt.status,
                score_obtained=attempt.score_obtained,
                percentage=attempt.percentage,
                started_at=attempt.started_at,
                submitted_at=attempt.submitted_at,
                time_spent_seconds=attempt.time_spent_seconds,
            )
        )
    return result


@router.get("/attempts/{attempt_id}", response_model=AttemptSchema)
def get_attempt_admin(
    attempt_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt
