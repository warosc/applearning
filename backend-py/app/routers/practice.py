"""
Practice mode API — /api/practice

Endpoints:
  POST /api/practice/start   → returns first question + user progress snapshot
  POST /api/practice/answer  → grades answer, updates skills/reviews/XP, returns feedback + next question
  GET  /api/practice/progress → returns user's progress and skill breakdown
"""
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.practice import UserSkill, PracticeReview, UserProgress
from app.models.question import Question
from app.models.user import User
from app.schemas.question import QuestionPublicSchema
from app.services.grading import grade_answer
from app.services.practice_generator import (
    select_next_question,
    update_review_schedule,
    update_skill,
    update_progress,
    get_correct_display,
)

router = APIRouter()

# ─── helpers ──────────────────────────────────────────────────────────────────

XP_CORRECT = 10
XP_STREAK_BONUS = 5  # extra XP when streak_days >= 3


def _get_or_create_progress(user_id: str, db: Session) -> UserProgress:
    p = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    if not p:
        p = UserProgress(id=str(uuid.uuid4()), user_id=user_id)
        db.add(p)
        db.flush()
    return p


def _get_or_create_review(user_id: str, question_id: str, db: Session) -> PracticeReview:
    r = (
        db.query(PracticeReview)
        .filter(PracticeReview.user_id == user_id, PracticeReview.question_id == question_id)
        .first()
    )
    if not r:
        r = PracticeReview(
            id=str(uuid.uuid4()),
            user_id=user_id,
            question_id=question_id,
            next_review=datetime.utcnow(),
        )
        db.add(r)
        db.flush()
    return r


def _get_or_create_skill(user_id: str, materia: str, tema: Optional[str], db: Session) -> UserSkill:
    s = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id, UserSkill.materia == materia, UserSkill.tema == tema)
        .first()
    )
    if not s:
        s = UserSkill(
            id=str(uuid.uuid4()),
            user_id=user_id,
            materia=materia,
            tema=tema,
        )
        db.add(s)
        db.flush()
    return s


def _build_question_public(q: Question) -> QuestionPublicSchema:
    return QuestionPublicSchema.model_validate(q)


def _progress_snapshot(user_id: str, db: Session) -> dict:
    prog = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    xp = prog.xp if prog else 0
    streak = prog.streak_days if prog else 0

    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    # Aggregate nivel by materia (average over all temas)
    by_mat: dict[str, list[float]] = {}
    for s in skills:
        by_mat.setdefault(s.materia, []).append(s.nivel)
    nivel_by_materia = [
        {
            "materia": mat,
            "nivel": round(sum(nivs) / len(nivs), 1),
            "aciertos": sum(sk.aciertos for sk in skills if sk.materia == mat),
            "errores": sum(sk.errores for sk in skills if sk.materia == mat),
        }
        for mat, nivs in by_mat.items()
    ]
    return {
        "xp": xp,
        "streak_days": streak,
        "nivel_by_materia": nivel_by_materia,
    }


def _available_materias(db: Session) -> list[str]:
    rows = (
        db.query(Question.materia)
        .filter(Question.exam_id.is_(None), Question.materia.isnot(None))
        .distinct()
        .all()
    )
    return sorted(r[0] for r in rows if r[0])


# ─── schemas ──────────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    materia: Optional[str] = None


class AnswerRequest(BaseModel):
    question_id: str
    answer_json: Any
    exclude_ids: list[str] = []
    materia: Optional[str] = None


# ─── endpoints ────────────────────────────────────────────────────────────────

@router.post("/start")
def practice_start(
    body: StartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = select_next_question(
        user_id=current_user.id,
        db=db,
        materia=body.materia,
    )
    if not question:
        raise HTTPException(status_code=404, detail="No hay preguntas disponibles en el banco")

    # Bump total_sessions when a new session starts
    prog = _get_or_create_progress(current_user.id, db)
    prog.total_sessions += 1
    db.commit()

    return {
        "question": _build_question_public(question),
        "progress": _progress_snapshot(current_user.id, db),
        "materias": _available_materias(db),
    }


@router.post("/answer")
def practice_answer(
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = db.query(Question).filter(Question.id == body.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # Grade
    is_correct, score_fraction = grade_answer(question, body.answer_json)
    correct_display = get_correct_display(question)
    now = datetime.utcnow()
    today_str = now.date().isoformat()

    # Update spaced-repetition review record
    review = _get_or_create_review(current_user.id, question.id, db)
    update_review_schedule(review, bool(is_correct), now)

    # Update skill for this materia/tema
    materia = question.materia or "Sin materia"
    tema = question.tema
    skill = _get_or_create_skill(current_user.id, materia, tema, db)
    update_skill(skill, bool(is_correct), now)

    # XP
    xp_earned = 0
    prog = _get_or_create_progress(current_user.id, db)
    if is_correct:
        xp_earned = XP_CORRECT
        if prog.streak_days >= 3:
            xp_earned += XP_STREAK_BONUS
    update_progress(prog, xp_earned, today_str)

    db.commit()
    db.refresh(skill)
    db.refresh(prog)

    # Select next question (exclude already shown + current)
    exclude = list(set(body.exclude_ids + [question.id]))
    next_q = select_next_question(
        user_id=current_user.id,
        db=db,
        materia=body.materia,
        exclude_ids=exclude,
    )

    return {
        "is_correct": bool(is_correct),
        "score_fraction": float(score_fraction),
        "correct_display": correct_display,
        "xp_earned": xp_earned,
        "total_xp": prog.xp,
        "streak_days": prog.streak_days,
        "skill": {
            "materia": skill.materia,
            "tema": skill.tema,
            "nivel": round(skill.nivel, 1),
            "aciertos": skill.aciertos,
            "errores": skill.errores,
        },
        "next_question": _build_question_public(next_q) if next_q else None,
    }


@router.get("/progress")
def practice_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    skill_list = [
        {
            "materia": s.materia,
            "tema": s.tema,
            "nivel": round(s.nivel, 1),
            "aciertos": s.aciertos,
            "errores": s.errores,
            "ultima_practica": s.ultima_practica.isoformat() if s.ultima_practica else None,
        }
        for s in skills
    ]
    return {
        "progress": _progress_snapshot(current_user.id, db),
        "skills": skill_list,
        "materias": _available_materias(db),
    }
