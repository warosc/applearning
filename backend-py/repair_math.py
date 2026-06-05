"""
One-off repair script for the math-grading regression.

Fixes two pre-existing data problems caused by earlier bugs:
  1. Questions saved with score <= 0 (the editor let the Puntaje field become 0)
     never contributed points and showed up as "0.0/0.0". They are bumped to a
     sensible default so they count again (admins can fine-tune afterwards).
  2. Attempts already submitted/expired were graded with the old (broken) grading
     logic, which never scored numeric/algebraic questions. We re-run the current
     grade_answer over every stored answer and recompute the attempt totals.

Idempotent: re-running it only re-applies the current grading; once scores are
fixed, a second run reports 0 changes.

Usage (inside the backend container or a venv with DATABASE_URL set):
    python repair_math.py            # apply changes
    python repair_math.py --dry-run  # report only, change nothing
    python repair_math.py --default-score 5   # use 5.0 for score<=0 questions (default 1.0)
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.question import Question
from app.models.attempt import ExamAttempt
from app.services.grading import grade_answer, calculate_total


def repair_zero_scores(db, default_score: float, dry_run: bool) -> int:
    """Bump questions whose score <= 0 to `default_score`. Returns count changed."""
    broken = db.query(Question).filter(Question.score <= 0).all()
    if not broken:
        print("Scores: no questions with score <= 0. ✔")
        return 0

    print(f"Scores: {len(broken)} question(s) with score <= 0 → setting to {default_score}:")
    for q in broken:
        materia = q.materia or "(sin materia)"
        preview = (q.prompt or "")[:60].replace("\n", " ")
        print(f"  - [{q.type}] {materia} :: {preview}…  (score {q.score} → {default_score})")
        if not dry_run:
            q.score = default_score
    return len(broken)


def regrade_attempts(db, dry_run: bool) -> tuple[int, int]:
    """Re-grade every submitted/expired attempt with the current grading logic.

    Returns (attempts_changed, answers_changed).
    """
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.status.in_(["submitted", "expired"]))
        .all()
    )
    print(f"Regrade: {len(attempts)} submitted/expired attempt(s) to review.")

    attempts_changed = 0
    answers_changed = 0

    for attempt in attempts:
        exam = attempt.exam
        if exam is None:
            continue

        attempt_dirty = False
        for answer in attempt.answers:
            if answer.answer_json is None:
                new_correct, new_score = None, 0.0
            else:
                q = answer.question or db.query(Question).filter(Question.id == answer.question_id).first()
                if q is None:
                    continue
                new_correct, new_score = grade_answer(q, answer.answer_json)

            old_score = answer.score_obtained or 0.0
            if answer.is_correct != new_correct or round(old_score, 4) != round(new_score or 0.0, 4):
                answers_changed += 1
                attempt_dirty = True
                if not dry_run:
                    answer.is_correct = new_correct
                    answer.score_obtained = new_score

        # Recompute attempt totals from the (possibly updated) answers.
        new_total, new_pct = calculate_total(exam, attempt.answers)
        if round(attempt.score_obtained or 0.0, 4) != round(new_total, 4) or \
           round(attempt.percentage or 0.0, 4) != round(new_pct, 4):
            attempt_dirty = True
            if not dry_run:
                attempt.score_obtained = new_total
                attempt.percentage = new_pct

        if attempt_dirty:
            attempts_changed += 1
            print(
                f"  - attempt {attempt.id[:8]}… ({exam.title[:30]}): "
                f"{attempt.score_obtained} → {round(new_total, 4)} pts ({round(new_pct, 2)}%)"
            )

    return attempts_changed, answers_changed


def main():
    parser = argparse.ArgumentParser(description="Repair math scores and re-grade past attempts.")
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing.")
    parser.add_argument("--default-score", type=float, default=1.0,
                        help="Score to assign to questions currently at <= 0 (default 1.0).")
    args = parser.parse_args()

    if args.default_score <= 0:
        parser.error("--default-score must be greater than 0")

    mode = "DRY-RUN (no changes will be saved)" if args.dry_run else "APPLY"
    print(f"=== repair_math.py — {mode} ===\n")

    db = SessionLocal()
    try:
        scores_fixed = repair_zero_scores(db, args.default_score, args.dry_run)
        # Flush score changes so regrade sees the new max scores within this session.
        if not args.dry_run:
            db.flush()
        print()
        attempts_changed, answers_changed = regrade_attempts(db, args.dry_run)

        if args.dry_run:
            db.rollback()
        else:
            db.commit()

        print("\n=== Summary ===")
        print(f"  Questions with fixed score : {scores_fixed}")
        print(f"  Answers re-graded (changed): {answers_changed}")
        print(f"  Attempts updated           : {attempts_changed}")
        if args.dry_run:
            print("  (dry-run — nothing was saved)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
