import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin, get_optional_user
from app.models.attempt import ExamAttempt
from app.models.exam import Exam, ExamSection, FormTemplate
from app.models.user import User
from app.schemas.attempt import StartAttemptResponse, AttemptSimpleSchema
from app.schemas.exam import (
    ExamSchema,
    ExamSimpleSchema,
    CreateExamSchema,
    UpdateExamSchema,
    ExamSectionSchema,
    ExamSectionSimpleSchema,
    CreateExamSectionSchema,
    FormTemplateSchema,
    UpsertFormTemplateSchema,
)
from app.schemas.question import QuestionPublicSchema

router = APIRouter()


@router.get("/", response_model=list[ExamSimpleSchema])
def list_exams(db: Session = Depends(get_db)):
    return db.query(Exam).order_by(Exam.created_at.desc()).all()


@router.get("/{exam_id}", response_model=ExamSchema)
def get_exam(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.post("/", response_model=ExamSimpleSchema, status_code=201)
def create_exam(body: CreateExamSchema, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    exam = Exam(
        id=str(uuid.uuid4()),
        title=body.title,
        description=body.description,
        total_score=body.total_score,
        duration_minutes=body.duration_minutes,
        is_published=body.is_published,
        calculator_enabled=body.calculator_enabled,
        navigation_type=body.navigation_type,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.put("/{exam_id}", response_model=ExamSimpleSchema)
def update_exam(exam_id: str, body: UpdateExamSchema, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(exam, field, value)
    exam.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", status_code=204)
def delete_exam(exam_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()


@router.get("/{exam_id}/questions", response_model=list[QuestionPublicSchema])
def list_exam_questions(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam.questions


@router.post("/{exam_id}/start")
def start_attempt(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    attempt = ExamAttempt(
        id=str(uuid.uuid4()),
        exam_id=exam_id,
        user_id=current_user.id if current_user else None,
        started_at=datetime.utcnow(),
        status="in_progress",
        current_section_index=0,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    db.refresh(exam)

    return {
        "attempt": AttemptSimpleSchema.model_validate(attempt),
        "exam": ExamSchema.model_validate(exam),
    }


@router.get("/{exam_id}/form-template", response_model=FormTemplateSchema)
def get_form_template(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    tmpl = db.query(FormTemplate).filter(FormTemplate.exam_id == exam_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Form template not found")
    return tmpl


@router.put("/{exam_id}/form-template", response_model=FormTemplateSchema)
def upsert_form_template(
    exam_id: str,
    body: UpsertFormTemplateSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    tmpl = db.query(FormTemplate).filter(FormTemplate.exam_id == exam_id).first()
    if tmpl:
        tmpl.title = body.title
        tmpl.schema_json = body.schema_json
    else:
        tmpl = FormTemplate(
            id=str(uuid.uuid4()),
            exam_id=exam_id,
            title=body.title,
            schema_json=body.schema_json,
        )
        db.add(tmpl)

    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.get("/{exam_id}/sections", response_model=list[ExamSectionSimpleSchema])
def list_sections(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam.sections


@router.post("/{exam_id}/sections", response_model=ExamSectionSimpleSchema, status_code=201)
def create_section(
    exam_id: str,
    body: CreateExamSectionSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    section = ExamSection(
        id=str(uuid.uuid4()),
        exam_id=exam_id,
        title=body.title,
        instructions=body.instructions,
        order_index=body.order_index,
        question_count=body.question_count,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.post("/{exam_id}/duplicate", response_model=ExamSimpleSchema, status_code=201)
def duplicate_exam(
    exam_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from app.models.question import Question, QuestionOption

    original = db.query(Exam).filter(Exam.id == exam_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Exam not found")

    now = datetime.utcnow()
    new_exam = Exam(
        id=str(uuid.uuid4()),
        title=f"Copia de {original.title}",
        description=original.description,
        total_score=original.total_score,
        duration_minutes=original.duration_minutes,
        is_published=False,
        calculator_enabled=original.calculator_enabled,
        navigation_type=original.navigation_type,
        created_at=now,
        updated_at=now,
    )
    db.add(new_exam)
    db.flush()  # get new_exam.id before inserting sections

    # Map old section id -> new section id
    section_id_map: dict[str, str] = {}
    original_sections = db.query(ExamSection).filter(ExamSection.exam_id == exam_id).all()
    for orig_section in original_sections:
        new_section_id = str(uuid.uuid4())
        section_id_map[orig_section.id] = new_section_id
        new_section = ExamSection(
            id=new_section_id,
            exam_id=new_exam.id,
            title=orig_section.title,
            instructions=orig_section.instructions,
            order_index=orig_section.order_index,
            question_count=orig_section.question_count,
        )
        db.add(new_section)

    db.flush()

    # Copy questions belonging to the original exam
    original_questions = (
        db.query(Question).filter(Question.exam_id == exam_id).all()
    )
    for orig_q in original_questions:
        new_q_id = str(uuid.uuid4())
        new_section_id = section_id_map.get(orig_q.section_id) if orig_q.section_id else None
        new_q = Question(
            id=new_q_id,
            exam_id=new_exam.id,
            section_id=new_section_id,
            materia=orig_q.materia,
            tema=orig_q.tema,
            subtema=orig_q.subtema,
            difficulty=orig_q.difficulty,
            order_index=orig_q.order_index,
            type=orig_q.type,
            prompt=orig_q.prompt,
            image_url=orig_q.image_url,
            score=orig_q.score,
            metadata_json=orig_q.metadata_json,
            created_at=now,
        )
        db.add(new_q)
        db.flush()

        for orig_opt in orig_q.options:
            new_opt = QuestionOption(
                id=str(uuid.uuid4()),
                question_id=new_q_id,
                label=orig_opt.label,
                value=orig_opt.value,
                is_correct=orig_opt.is_correct,
                order_index=orig_opt.order_index,
            )
            db.add(new_opt)

    db.commit()
    db.refresh(new_exam)
    return new_exam
