from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, require_admin
from app.models.attempt import ExamAttempt
from app.models.exam import Exam
from app.models.question import Question
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    # --- Exam counts ---
    total_exams = db.query(func.count(Exam.id)).scalar() or 0
    published_exams = db.query(func.count(Exam.id)).filter(Exam.is_published == True).scalar() or 0

    # --- Question counts ---
    total_questions = db.query(func.count(Question.id)).scalar() or 0
    bank_questions = db.query(func.count(Question.id)).filter(Question.exam_id.is_(None)).scalar() or 0

    # --- Attempt counts ---
    total_attempts = db.query(func.count(ExamAttempt.id)).scalar() or 0
    completed_attempts = (
        db.query(func.count(ExamAttempt.id))
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
        or 0
    )
    in_progress_attempts = (
        db.query(func.count(ExamAttempt.id))
        .filter(ExamAttempt.status == "in_progress")
        .scalar()
        or 0
    )

    # --- Average score (percentage) of completed attempts ---
    avg_score_raw = (
        db.query(func.avg(ExamAttempt.percentage))
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .scalar()
    )
    avg_score = round(float(avg_score_raw), 2) if avg_score_raw is not None else 0.0

    # --- Active today (UTC) ---
    today_utc = datetime.utcnow().date()
    active_today = (
        db.query(func.count(ExamAttempt.id))
        .filter(func.date(ExamAttempt.started_at) == today_utc)
        .scalar()
        or 0
    )

    # --- Attempts by day (last 14 days) ---
    fourteen_days_ago = today_utc - timedelta(days=13)
    rows = (
        db.query(
            func.date(ExamAttempt.started_at).label("day"),
            func.count(ExamAttempt.id).label("cnt"),
        )
        .filter(func.date(ExamAttempt.started_at) >= fourteen_days_ago)
        .group_by(func.date(ExamAttempt.started_at))
        .all()
    )
    # Build a lookup: date string -> count
    day_counts: dict[str, int] = {}
    for row in rows:
        # row.day may be a date object or a string depending on the DB driver
        if isinstance(row.day, str):
            day_str = row.day
        else:
            day_str = row.day.strftime("%Y-%m-%d")
        day_counts[day_str] = row.cnt

    attempts_by_day = []
    for i in range(13, -1, -1):
        d: date = today_utc - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        attempts_by_day.append({"date": d_str, "count": day_counts.get(d_str, 0)})

    # --- Score distribution (all completed attempts) ---
    pct_rows = (
        db.query(ExamAttempt.percentage)
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .all()
    )
    dist: dict[str, int] = {}
    for (pct,) in pct_rows:
        if pct is None:
            continue
        bucket = min(int(pct // 10) * 10, 90)
        key = f"{bucket}-{bucket + 10}"
        dist[key] = dist.get(key, 0) + 1

    score_distribution = []
    for b in range(0, 100, 10):
        key = f"{b}-{b + 10}"
        score_distribution.append({"range": key, "count": dist.get(key, 0)})

    return {
        "total_exams": total_exams,
        "published_exams": published_exams,
        "total_questions": total_questions,
        "bank_questions": bank_questions,
        "total_attempts": total_attempts,
        "completed_attempts": completed_attempts,
        "in_progress_attempts": in_progress_attempts,
        "avg_score": avg_score,
        "active_today": active_today,
        "attempts_by_day": attempts_by_day,
        "score_distribution": score_distribution,
    }
