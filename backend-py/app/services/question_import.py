import csv
import io
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.question import Question, QuestionOption


def import_from_json(data: list[dict], db: Session) -> dict:
    """
    Import questions from a list of dicts.
    Each dict: {type, prompt, materia?, tema?, subtema?, difficulty?, score?, exam_id?, section_id?, options: [{label, value, is_correct}], metadata_json?}
    """
    imported = 0
    errors = []

    for idx, item in enumerate(data):
        try:
            if not item.get("type"):
                errors.append(f"Row {idx}: missing 'type'")
                continue
            if not item.get("prompt"):
                errors.append(f"Row {idx}: missing 'prompt'")
                continue

            question = Question(
                id=str(uuid.uuid4()),
                type=item["type"],
                prompt=item["prompt"],
                materia=item.get("materia"),
                tema=item.get("tema"),
                subtema=item.get("subtema"),
                difficulty=item.get("difficulty", "medio"),
                score=float(item.get("score", 1.0)),
                exam_id=item.get("exam_id"),
                section_id=item.get("section_id"),
                order_index=item.get("order_index", 0),
                metadata_json=item.get("metadata_json"),
                image_url=item.get("image_url"),
                created_at=datetime.utcnow(),
            )
            db.add(question)
            db.flush()  # get question.id

            for opt_idx, opt in enumerate(item.get("options", [])):
                option = QuestionOption(
                    id=str(uuid.uuid4()),
                    question_id=question.id,
                    label=opt.get("label", ""),
                    value=opt.get("value", ""),
                    is_correct=bool(opt.get("is_correct", False)),
                    weight=float(opt.get("weight", 0.0)),
                    order_index=opt.get("order_index", opt_idx),
                )
                db.add(option)

            imported += 1
        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")
            db.rollback()
            # Re-start the session so subsequent rows can still work
            continue

    db.commit()
    return {"imported": imported, "errors": errors}


def import_from_csv(csv_text: str, db: Session) -> dict:
    """
    CSV columns: type,prompt,materia,tema,difficulty,score,option_a,option_b,option_c,option_d,correct_option
    correct_option: A|B|C|D
    """
    imported = 0
    errors = []
    option_map = {"A": 0, "B": 1, "C": 2, "D": 3}
    label_map = {"A": "A", "B": "B", "C": "C", "D": "D"}

    reader = csv.DictReader(io.StringIO(csv_text))
    for idx, row in enumerate(reader):
        try:
            q_type = row.get("type", "single_choice").strip()
            prompt = row.get("prompt", "").strip()
            if not prompt:
                errors.append(f"Row {idx + 2}: missing prompt")
                continue

            question = Question(
                id=str(uuid.uuid4()),
                type=q_type,
                prompt=prompt,
                materia=row.get("materia", "").strip() or None,
                tema=row.get("tema", "").strip() or None,
                difficulty=row.get("difficulty", "medio").strip(),
                score=float(row.get("score", 1.0)),
                created_at=datetime.utcnow(),
            )
            db.add(question)
            db.flush()

            options_labels = [
                row.get("option_a", ""),
                row.get("option_b", ""),
                row.get("option_c", ""),
                row.get("option_d", ""),
            ]
            correct_letter = (row.get("correct_option") or "A").strip().upper()
            correct_idx = option_map.get(correct_letter, 0)

            for i, opt_label in enumerate(options_labels):
                if not opt_label.strip():
                    continue
                option = QuestionOption(
                    id=str(uuid.uuid4()),
                    question_id=question.id,
                    label=opt_label.strip(),
                    value=label_map.get(list(option_map.keys())[i], str(i)),
                    is_correct=(i == correct_idx),
                    order_index=i,
                )
                db.add(option)

            imported += 1
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")
            continue

    db.commit()
    return {"imported": imported, "errors": errors}
