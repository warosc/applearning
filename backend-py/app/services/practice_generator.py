"""
Adaptive practice question selector.

Selection strategy (rule-based, no ML):
  - 60% from WEAK temas (nivel < 40)
  - 30% from MEDIUM temas (40 ≤ nivel < 70)
  - 10% from STRONG temas (nivel ≥ 70)
  - Questions with no skill record are treated as MEDIUM (nivel = 50)
  - Questions due for spaced-repetition review get 2x weight boost
  - Never returns a question in exclude_ids (already shown this session)
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.practice import PracticeReview, UserSkill

# Thresholds
WEAK_THRESHOLD = 40.0
STRONG_THRESHOLD = 70.0

# Base selection weights per category
_WEIGHTS = {
    "weak": 6,
    "medium": 3,
    "new": 3,    # no skill record yet → same as medium
    "strong": 1,
}


def _classify(nivel: float) -> str:
    if nivel < WEAK_THRESHOLD:
        return "weak"
    if nivel < STRONG_THRESHOLD:
        return "medium"
    return "strong"


def select_next_question(
    user_id: str,
    db: Session,
    materia: Optional[str] = None,
    exclude_ids: Optional[list[str]] = None,
) -> Optional[Question]:
    """
    Return the single best next question for this user according to
    adaptive weighting + spaced repetition.
    """
    exclude_set = set(exclude_ids or [])

    # All bank questions (exam_id IS NULL), optionally filtered by materia
    query = db.query(Question).filter(Question.exam_id.is_(None))
    if materia:
        query = query.filter(Question.materia == materia)

    candidates: list[Question] = [q for q in query.all() if q.id not in exclude_set]

    if not candidates:
        return None

    # Build lookup maps for this user
    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    skill_map: dict[tuple, UserSkill] = {(s.materia, s.tema): s for s in skills}

    candidate_ids = [q.id for q in candidates]
    reviews = (
        db.query(PracticeReview)
        .filter(
            PracticeReview.user_id == user_id,
            PracticeReview.question_id.in_(candidate_ids),
        )
        .all()
    )
    review_map: dict[str, PracticeReview] = {r.question_id: r for r in reviews}

    now = datetime.utcnow()

    def _weight(q: Question) -> float:
        skill = skill_map.get((q.materia, q.tema))
        category = "new" if not skill else _classify(skill.nivel)
        w = float(_WEIGHTS[category])

        # 2× boost for questions due for review (or never seen)
        rev = review_map.get(q.id)
        if not rev or rev.next_review <= now:
            w *= 2.0

        return w

    weights = [_weight(q) for q in candidates]
    return random.choices(candidates, weights=weights, k=1)[0]


def update_review_schedule(
    review: PracticeReview,
    is_correct: bool,
    now: datetime,
) -> None:
    """Update spaced-repetition fields on a PracticeReview (in-place)."""
    review.times_seen += 1
    review.last_seen = now

    if is_correct:
        review.times_correct += 1
        # Exponential back-off: 1 h → 1 d → 2 d → 4 d … max 7 d
        interval_hours = min(24 * 7, max(1, (2 ** (review.times_correct - 1)) * 24))
        review.next_review = now + timedelta(hours=interval_hours)
    else:
        # Wrong → review again in 1 hour
        review.next_review = now + timedelta(hours=1)


def update_skill(
    skill: UserSkill,
    is_correct: bool,
    now: datetime,
) -> None:
    """Update UserSkill nivel and counters (in-place)."""
    skill.ultima_practica = now
    if is_correct:
        skill.aciertos += 1
        # Asymptotic increase toward 100
        skill.nivel = min(100.0, skill.nivel + (100.0 - skill.nivel) * 0.1)
    else:
        skill.errores += 1
        # Proportional decrease
        skill.nivel = max(0.0, skill.nivel - skill.nivel * 0.15)


def update_progress(
    progress,
    xp_earned: int,
    today_str: str,
) -> None:
    """Update UserProgress XP and streak (in-place). today_str = 'YYYY-MM-DD'."""
    from datetime import date, timedelta as td

    progress.xp += xp_earned

    last = progress.last_practice_date
    if last != today_str:
        yesterday = (date.fromisoformat(today_str) - td(days=1)).isoformat()
        if last == yesterday:
            progress.streak_days += 1
        elif last is None or last < yesterday:
            progress.streak_days = 1
        progress.last_practice_date = today_str


def get_correct_display(question: Question) -> str:
    """Return a human-readable string of the correct answer for feedback."""
    opts = sorted(question.options, key=lambda o: o.order_index)
    correct = [o for o in opts if o.is_correct]

    if question.type == "drag_drop":
        return " → ".join(o.label for o in opts)

    if not correct:
        # Numeric / algebraic: look for metadata_json.expected
        meta = question.metadata_json or {}
        if isinstance(meta, dict) and "expected" in meta:
            return str(meta["expected"])
        return ""

    return ", ".join(o.label for o in correct)
