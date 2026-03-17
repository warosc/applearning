import random
from typing import Optional

from sqlalchemy.orm import Session

from app.models.question import Question


def generate_for_section(
    section_id: str,
    exam_id: str,
    materia: Optional[str],
    difficulty: Optional[str],
    count: int,
    db: Session,
    used_temas: Optional[set] = None,
) -> list[Question]:
    """
    Query bank questions (exam_id IS NULL) matching materia/difficulty.
    Randomly select `count` questions without repeating temas.

    Args:
        used_temas: Set of tema strings already used in this exam generation.
                    Modified in-place as questions are selected.
    """
    if used_temas is None:
        used_temas = set()

    query = db.query(Question).filter(Question.exam_id.is_(None))

    if materia:
        query = query.filter(Question.materia == materia)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    bank_questions: list[Question] = query.all()

    if not bank_questions:
        return []

    # Group questions by tema so we can pick one per tema
    # Questions with no tema are treated as a single group keyed by None
    by_tema: dict[Optional[str], list[Question]] = {}
    for q in bank_questions:
        key = (q.tema or "").strip() or None
        by_tema.setdefault(key, []).append(q)

    selected: list[Question] = []
    available_temas = list(by_tema.keys())
    random.shuffle(available_temas)

    for tema_key in available_temas:
        if len(selected) >= count:
            break

        # Skip temas already used in this exam generation pass
        if tema_key and tema_key in used_temas:
            continue

        candidates = by_tema[tema_key]
        chosen = random.choice(candidates)
        selected.append(chosen)

        if tema_key:
            used_temas.add(tema_key)

    # If we still need more questions (e.g. not enough unique temas),
    # fill up from remaining questions that were not yet selected
    if len(selected) < count:
        already_ids = {q.id for q in selected}
        remaining = [q for q in bank_questions if q.id not in already_ids]
        random.shuffle(remaining)
        fill_count = min(count - len(selected), len(remaining))
        selected.extend(remaining[:fill_count])

    # Assign to exam and section
    for idx, question in enumerate(selected):
        question.exam_id = exam_id
        question.section_id = section_id
        question.order_index = idx

    db.commit()
    for q in selected:
        db.refresh(q)

    return selected


def generate_exam_from_config(
    exam_id: str,
    sections_config: list[dict],
    db: Session,
) -> dict:
    """
    Generate questions for an entire exam from a list of section configs.

    sections_config: [
        {
            "section_id": str,
            "materia": str | None,
            "difficulty": str | None,
            "count": int,
        },
        ...
    ]

    Uses a shared used_temas set so no tema is repeated across sections
    of the same materia.
    """
    # Track used temas per materia to avoid cross-section repetition
    used_temas_by_materia: dict[str, set] = {}
    results = []
    total_assigned = 0

    for cfg in sections_config:
        section_id = cfg["section_id"]
        materia = cfg.get("materia")
        difficulty = cfg.get("difficulty")
        count = cfg.get("count", 10)

        # Shared tema tracking per materia (None materia gets its own set)
        materia_key = materia or "__no_materia__"
        if materia_key not in used_temas_by_materia:
            used_temas_by_materia[materia_key] = set()

        assigned = generate_for_section(
            section_id=section_id,
            exam_id=exam_id,
            materia=materia,
            difficulty=difficulty,
            count=count,
            db=db,
            used_temas=used_temas_by_materia[materia_key],
        )
        total_assigned += len(assigned)
        results.append({"section_id": section_id, "assigned": len(assigned)})

    return {
        "exam_id": exam_id,
        "total_assigned": total_assigned,
        "sections": results,
    }
