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
) -> list[Question]:
    """
    Query bank questions (exam_id IS NULL) matching materia/difficulty.
    Randomly select `count` questions.
    Assign them to exam_id and section_id.
    Update their order_index.
    """
    query = db.query(Question).filter(Question.exam_id.is_(None))

    if materia:
        query = query.filter(Question.materia == materia)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    bank_questions: list[Question] = query.all()

    if not bank_questions:
        return []

    selected_count = min(count, len(bank_questions))
    selected: list[Question] = random.sample(bank_questions, selected_count)

    for idx, question in enumerate(selected):
        question.exam_id = exam_id
        question.section_id = section_id
        question.order_index = idx

    db.commit()
    for q in selected:
        db.refresh(q)

    return selected
