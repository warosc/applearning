import random
from typing import Optional

from sqlalchemy.orm import Session

from app.models.question import Question

# Default difficulty distribution when no explicit difficulty is requested.
# Keys are difficulty values as stored in the DB; values are target fractions.
DIFFICULTY_MIX = {
    "media": 0.70,
    "facil": 0.20,
    "dificil": 0.10,
}


def _pick_with_difficulty_mix(
    bank_questions: list[Question],
    count: int,
    used_temas: set,
) -> list[Question]:
    """
    Select `count` questions from `bank_questions` applying DIFFICULTY_MIX
    proportions when the bank contains multiple difficulties.  Each selected
    question is de-duplicated by tema (one per tema), filling leftover slots
    from any remaining questions.
    """
    # Detect which difficulties are actually present
    difficulties_present = {q.difficulty for q in bank_questions if q.difficulty}

    if len(difficulties_present) <= 1:
        # No mixing needed — use simple tema-dedup path
        return _pick_no_mix(bank_questions, count, used_temas)

    selected: list[Question] = []
    used_ids: set[str] = set()

    # Compute per-difficulty quotas (round down; remainder filled from pool)
    quotas: dict[str, int] = {}
    for diff, fraction in DIFFICULTY_MIX.items():
        quotas[diff] = max(0, round(count * fraction))

    # Clamp total to count
    total_quota = sum(quotas.values())
    if total_quota > count:
        # Reduce the largest quota
        largest = max(quotas, key=lambda k: quotas[k])
        quotas[largest] -= total_quota - count

    # Build per-difficulty groups of (tema -> questions)
    by_diff: dict[str, list[Question]] = {}
    for q in bank_questions:
        d = q.difficulty or "media"
        by_diff.setdefault(d, []).append(q)

    local_used_temas = set(used_temas)

    def pick_from_group(pool: list[Question], n: int) -> list[Question]:
        nonlocal local_used_temas
        by_tema: dict[Optional[str], list[Question]] = {}
        for q in pool:
            key = (q.tema or "").strip() or None
            by_tema.setdefault(key, []).append(q)

        keys = list(by_tema.keys())
        random.shuffle(keys)
        chosen: list[Question] = []
        for tema_key in keys:
            if len(chosen) >= n:
                break
            if tema_key and tema_key in local_used_temas:
                continue
            if by_tema[tema_key][0].id in used_ids:
                continue
            pick = random.choice(by_tema[tema_key])
            chosen.append(pick)
            used_ids.add(pick.id)
            if tema_key:
                local_used_temas.add(tema_key)
        return chosen

    for diff, quota in quotas.items():
        if quota <= 0:
            continue
        pool = [q for q in by_diff.get(diff, []) if q.id not in used_ids]
        selected.extend(pick_from_group(pool, quota))

    # Update the caller's used_temas set in-place
    used_temas.update(local_used_temas)

    # Fill remaining slots from any difficulty if quotas not fully met
    if len(selected) < count:
        remaining_pool = [q for q in bank_questions if q.id not in used_ids]
        random.shuffle(remaining_pool)
        fill_count = min(count - len(selected), len(remaining_pool))
        selected.extend(remaining_pool[:fill_count])

    return selected


def _pick_no_mix(
    bank_questions: list[Question],
    count: int,
    used_temas: set,
) -> list[Question]:
    """Simple tema-dedup selection without difficulty mixing."""
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
        if tema_key and tema_key in used_temas:
            continue
        chosen = random.choice(by_tema[tema_key])
        selected.append(chosen)
        if tema_key:
            used_temas.add(tema_key)

    # Fill leftover
    if len(selected) < count:
        already_ids = {q.id for q in selected}
        remaining = [q for q in bank_questions if q.id not in already_ids]
        random.shuffle(remaining)
        fill_count = min(count - len(selected), len(remaining))
        selected.extend(remaining[:fill_count])

    return selected


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

    When `difficulty` is None, applies DIFFICULTY_MIX distribution.
    Options within each selected question are shuffled for answer-order randomization.

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

    if difficulty:
        # Explicit difficulty requested — no mixing
        selected = _pick_no_mix(bank_questions, count, used_temas)
    else:
        selected = _pick_with_difficulty_mix(bank_questions, count, used_temas)

    # Assign to exam and section; shuffle options for answer-order randomization
    for idx, question in enumerate(selected):
        question.exam_id = exam_id
        question.section_id = section_id
        question.order_index = idx

        # Randomize option order for choice-based questions
        _shuffle_options(question)

    db.commit()
    for q in selected:
        db.refresh(q)

    return selected


def _shuffle_options(question: Question) -> None:
    """Re-assign order_index on options in random order (in-place)."""
    shuffleable_types = {
        "single_choice",
        "multiple_choice",
        "fill_blank",
        "multi_answer_weighted",
    }
    if question.type not in shuffleable_types:
        return

    opts = list(question.options)
    if len(opts) <= 1:
        return

    indices = list(range(len(opts)))
    random.shuffle(indices)
    for opt, new_idx in zip(opts, indices):
        opt.order_index = new_idx


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
            "difficulty": str | None,  # None → apply DIFFICULTY_MIX
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
