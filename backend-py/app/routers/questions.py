import math
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin
from app.models.question import Question, QuestionOption
from app.models.user import User
from app.schemas.question import (
    QuestionSchema,
    QuestionPublicSchema,
    CreateQuestionSchema,
    UpdateQuestionSchema,
    ImportResult,
    GenerateExamRequest,
)
from app.services.question_import import import_from_json, import_from_csv
from app.services.exam_generator import generate_exam_from_config

router = APIRouter()


class ReorderItem(BaseModel):
    question_id: str
    order_index: int


class ReorderBody(BaseModel):
    questions: List[ReorderItem]


@router.put("/reorder")
def reorder_questions(body: ReorderBody, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    updated = 0
    for item in body.questions:
        q = db.query(Question).filter(Question.id == item.question_id).first()
        if q:
            q.order_index = item.order_index
            updated += 1
    db.commit()
    return {"updated": updated}


@router.get("/")
def list_questions(
    materia: Optional[str] = None,
    tema: Optional[str] = None,
    difficulty: Optional[str] = None,
    exam_id: Optional[str] = None,
    bank_only: bool = False,
    limit: int = 100,
    offset: int = 0,
    page: int = 1,
    page_size: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Question)
    if materia:
        query = query.filter(Question.materia == materia)
    if tema:
        query = query.filter(Question.tema == tema)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if exam_id:
        query = query.filter(Question.exam_id == exam_id)
    if bank_only:
        query = query.filter(Question.exam_id.is_(None))
    query = query.order_by(Question.order_index)
    if page_size is not None:
        total = query.count()
        pages = math.ceil(total / page_size) if page_size > 0 else 1
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return {
            "items": [QuestionPublicSchema.model_validate(q) for q in items],
            "total": total,
            "page": page,
            "pages": pages,
            "page_size": page_size,
        }
    return query.offset(offset).limit(limit).all()


@router.get("/{question_id}", response_model=QuestionPublicSchema)
def get_question(question_id: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


@router.post("/", response_model=QuestionSchema, status_code=201)
def create_question(
    body: CreateQuestionSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = Question(
        id=str(uuid.uuid4()),
        type=body.type,
        prompt=body.prompt,
        materia=body.materia,
        tema=body.tema,
        subtema=body.subtema,
        difficulty=body.difficulty,
        order_index=body.order_index,
        image_url=body.image_url,
        score=body.score,
        metadata_json=body.metadata_json,
        exam_id=body.exam_id,
        section_id=body.section_id,
        created_at=datetime.utcnow(),
    )
    db.add(q)
    db.flush()

    for idx, opt in enumerate(body.options):
        option = QuestionOption(
            id=str(uuid.uuid4()),
            question_id=q.id,
            label=opt.label,
            value=opt.value,
            is_correct=opt.is_correct,
            weight=getattr(opt, 'weight', 0.0) or 0.0,
            order_index=opt.order_index if opt.order_index is not None else idx,
        )
        db.add(option)

    db.commit()
    db.refresh(q)
    return q


@router.put("/{question_id}", response_model=QuestionSchema)
def update_question(
    question_id: str,
    body: UpdateQuestionSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    update_data = body.model_dump(exclude_none=True)
    options_data = update_data.pop("options", None)

    for field, value in update_data.items():
        setattr(q, field, value)

    if options_data is not None:
        # Replace all options
        for opt in q.options:
            db.delete(opt)
        db.flush()
        for idx, opt in enumerate(options_data):
            option = QuestionOption(
                id=str(uuid.uuid4()),
                question_id=q.id,
                label=opt["label"],
                value=opt["value"],
                is_correct=opt.get("is_correct", False),
                weight=opt.get("weight", 0.0) or 0.0,
                order_index=opt.get("order_index", idx),
            )
            db.add(option)

    db.commit()
    db.refresh(q)
    return q


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()


@router.post("/import", response_model=ImportResult)
def import_questions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    data: Optional[list[dict]] = Body(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    if data is not None:
        result = import_from_json(data, db)
    elif file is not None:
        csv_text = file.file.read().decode("utf-8")
        result = import_from_csv(csv_text, db)
    else:
        raise HTTPException(status_code=400, detail="Provide JSON body array or CSV file")
    return result


@router.post("/generate-exam", response_model=dict)
def generate_exam(
    body: GenerateExamRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    sections_config = [
        {
            "section_id": s.section_id,
            "materia": s.materia,
            "difficulty": s.difficulty,
            "count": s.count,
        }
        for s in body.sections
    ]
    return generate_exam_from_config(
        exam_id=body.exam_id,
        sections_config=sections_config,
        db=db,
    )


@router.post("/{question_id}/duplicate", response_model=QuestionSchema, status_code=201)
def duplicate_question(
    question_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    original = db.query(Question).filter(Question.id == question_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Question not found")

    new_q_id = str(uuid.uuid4())
    new_q = Question(
        id=new_q_id,
        exam_id=None,
        section_id=None,
        materia=original.materia,
        tema=original.tema,
        subtema=original.subtema,
        difficulty=original.difficulty,
        order_index=original.order_index,
        type=original.type,
        prompt=original.prompt,
        image_url=original.image_url,
        score=original.score,
        metadata_json=original.metadata_json,
        created_at=datetime.utcnow(),
    )
    db.add(new_q)
    db.flush()

    for orig_opt in original.options:
        new_opt = QuestionOption(
            id=str(uuid.uuid4()),
            question_id=new_q_id,
            label=orig_opt.label,
            value=orig_opt.value,
            is_correct=orig_opt.is_correct,
            weight=orig_opt.weight,
            order_index=orig_opt.order_index,
        )
        db.add(new_opt)

    db.commit()
    db.refresh(new_q)
    return new_q
