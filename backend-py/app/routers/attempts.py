import uuid
from datetime import datetime
from typing import Optional, Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_optional_user, get_current_user
from app.models.attempt import ExamAttempt, Answer
from app.models.event import ExamEvent
from app.models.exam import Exam, FormSubmission
from app.models.question import Question
from app.models.user import User
from app.schemas.attempt import (
    AttemptSchema,
    SaveAnswerRequest,
    MarkReviewRequest,
    AttemptResultSchema,
    ResultQuestionBreakdown,
)
from app.schemas.event import LogEventRequest, ExamEventSchema
from app.services.grading import grade_answer, calculate_total, get_result_summary

router = APIRouter()


class MyAttemptItem(BaseModel):
    id: str
    exam_id: str
    exam_title: str
    status: str
    score_obtained: Optional[float] = None
    percentage: Optional[float] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None

    model_config = {"from_attributes": True}


@router.get("/my", response_model=List[MyAttemptItem])
def my_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .order_by(ExamAttempt.started_at.desc())
        .all()
    )
    result = []
    for attempt in attempts:
        exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
        result.append(
            MyAttemptItem(
                id=attempt.id,
                exam_id=attempt.exam_id,
                exam_title=exam.title if exam else "",
                status=attempt.status,
                score_obtained=attempt.score_obtained,
                percentage=attempt.percentage,
                started_at=attempt.started_at,
                submitted_at=attempt.submitted_at,
                time_spent_seconds=attempt.time_spent_seconds,
            )
        )
    return result


def _auto_expire(attempt: ExamAttempt, db: Session):
    """Check and auto-expire attempt if time is up."""
    if attempt.status != "in_progress":
        return
    exam = attempt.exam
    deadline = attempt.started_at.timestamp() + exam.duration_minutes * 60
    if datetime.utcnow().timestamp() > deadline:
        # Grade existing answers
        for answer in attempt.answers:
            if answer.is_correct is None and answer.answer_json is not None:
                q = db.query(Question).filter(Question.id == answer.question_id).first()
                if q:
                    is_correct, score = grade_answer(q, answer.answer_json)
                    answer.is_correct = is_correct
                    answer.score_obtained = score

        score_obtained, percentage = calculate_total(exam, attempt.answers)
        now = datetime.utcnow()
        time_spent = int((now - attempt.started_at).total_seconds())

        attempt.status = "expired"
        attempt.submitted_at = now
        attempt.score_obtained = score_obtained
        attempt.percentage = percentage
        attempt.time_spent_seconds = time_spent
        db.commit()
        db.refresh(attempt)


@router.get("/{attempt_id}", response_model=AttemptSchema)
def get_attempt(attempt_id: str, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    _auto_expire(attempt, db)
    return attempt


@router.get("/{attempt_id}/resume")
def resume_attempt(attempt_id: str, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    _auto_expire(attempt, db)
    db.refresh(attempt)
    db.refresh(attempt.exam)
    return {
        "attempt": AttemptSchema.model_validate(attempt),
        "exam": attempt.exam,
        "can_resume": attempt.status == "in_progress",
    }


@router.patch("/{attempt_id}/answer")
def save_answer(attempt_id: str, body: SaveAnswerRequest, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt is not in progress")

    question = db.query(Question).filter(Question.id == body.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    answer = (
        db.query(Answer)
        .filter(Answer.attempt_id == attempt_id, Answer.question_id == body.question_id)
        .first()
    )

    if answer:
        answer.answer_json = body.answer_json
        answer.updated_at = datetime.utcnow()
    else:
        answer = Answer(
            id=str(uuid.uuid4()),
            attempt_id=attempt_id,
            question_id=body.question_id,
            answer_json=body.answer_json,
            answered_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(answer)

    db.commit()
    db.refresh(answer)
    return {"id": answer.id, "question_id": answer.question_id, "answer_json": answer.answer_json}


@router.patch("/{attempt_id}/mark-review")
def mark_review(attempt_id: str, body: MarkReviewRequest, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    answer = (
        db.query(Answer)
        .filter(Answer.attempt_id == attempt_id, Answer.question_id == body.question_id)
        .first()
    )
    if not answer:
        # Create a placeholder answer
        question = db.query(Question).filter(Question.id == body.question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        answer = Answer(
            id=str(uuid.uuid4()),
            attempt_id=attempt_id,
            question_id=body.question_id,
            answer_json=None,
            is_marked_for_review=body.marked,
            answered_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(answer)
    else:
        answer.is_marked_for_review = body.marked
        answer.updated_at = datetime.utcnow()

    db.commit()
    return {"question_id": body.question_id, "marked": body.marked}


@router.post("/{attempt_id}/submit")
def submit_attempt(attempt_id: str, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status not in ("in_progress", "expired"):
        raise HTTPException(status_code=400, detail="Attempt already submitted")

    exam = attempt.exam

    # Grade all answers
    for answer in attempt.answers:
        if answer.answer_json is not None:
            q = db.query(Question).filter(Question.id == answer.question_id).first()
            if q:
                is_correct, score = grade_answer(q, answer.answer_json)
                answer.is_correct = is_correct
                answer.score_obtained = score
        else:
            answer.is_correct = None
            answer.score_obtained = 0.0

    score_obtained, percentage = calculate_total(exam, attempt.answers)
    now = datetime.utcnow()
    time_spent = int((now - attempt.started_at).total_seconds())

    attempt.status = "submitted"
    attempt.submitted_at = now
    attempt.score_obtained = score_obtained
    attempt.percentage = percentage
    attempt.time_spent_seconds = time_spent

    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "status": attempt.status,
        "score_obtained": attempt.score_obtained,
        "percentage": attempt.percentage,
        "time_spent_seconds": attempt.time_spent_seconds,
    }


@router.get("/{attempt_id}/result", response_model=AttemptResultSchema)
def get_result(attempt_id: str, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "in_progress":
        raise HTTPException(status_code=400, detail="Attempt not yet submitted")

    exam = attempt.exam
    answers_map = {a.question_id: a for a in attempt.answers}
    questions = db.query(Question).filter(Question.exam_id == exam.id).all()
    questions_map = {q.id: q for q in questions}

    summary = get_result_summary(exam, attempt.answers, questions_map)

    breakdown = []
    for q in questions:
        answer = answers_map.get(q.id)
        breakdown.append(
            ResultQuestionBreakdown(
                question_id=q.id,
                prompt=q.prompt,
                type=q.type,
                materia=q.materia,
                difficulty=q.difficulty,
                answer_json=answer.answer_json if answer else None,
                is_correct=answer.is_correct if answer else None,
                score_obtained=answer.score_obtained if answer else 0.0,
                max_score=q.score,
                is_marked_for_review=answer.is_marked_for_review if answer else False,
            )
        )

    return AttemptResultSchema(
        attempt_id=attempt.id,
        status=attempt.status,
        total_score=summary["total_score"],
        score_obtained=summary["score_obtained"],
        percentage=summary["percentage"],
        correct=summary["correct"],
        incorrect=summary["incorrect"],
        omitted=summary["omitted"],
        time_spent_seconds=attempt.time_spent_seconds,
        questions=breakdown,
    )


@router.post("/{attempt_id}/form-submit")
def form_submit(attempt_id: str, body: dict, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    existing = db.query(FormSubmission).filter(FormSubmission.attempt_id == attempt_id).first()
    payload = body.get("payload", body)

    if existing:
        existing.payload_json = payload
    else:
        submission = FormSubmission(
            id=str(uuid.uuid4()),
            attempt_id=attempt_id,
            payload_json=payload,
        )
        db.add(submission)

    db.commit()
    return {"success": True, "attempt_id": attempt_id}


@router.post("/{attempt_id}/events", response_model=ExamEventSchema, status_code=201)
def log_event(attempt_id: str, body: LogEventRequest, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    event = ExamEvent(
        id=str(uuid.uuid4()),
        attempt_id=attempt_id,
        event_type=body.event_type,
        details=body.details,
        occurred_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
