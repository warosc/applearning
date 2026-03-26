import re
from typing import Any, Optional


def normalize_algebraic(expr: str) -> str:
    """Normalize algebraic expressions for comparison."""
    if not expr:
        return ""
    s = str(expr).strip().lower()
    # Remove all whitespace
    s = re.sub(r'\s+', '', s)
    # Normalize power notation: ** -> ^
    s = s.replace('**', '^')
    # Sort additive terms for commutativity: x+1 == 1+x
    if '+' in s and '-' not in s:
        terms = sorted(s.split('+'))
        s = '+'.join(terms)
    return s


def _has_weights(options) -> bool:
    """Return True if any option has a non-zero weight defined."""
    return any(getattr(opt, 'weight', 0.0) or 0.0 for opt in options)


def grade_answer(question, answer_json: Any) -> tuple[Optional[bool], float]:
    """
    Grade a single answer against question options.

    Returns (is_correct, score_obtained).
    """
    options = question.options  # list of QuestionOption

    if question.type == "single_choice":
        correct_values = {opt.value for opt in options if opt.is_correct}
        if not answer_json or not correct_values:
            return False, 0.0
        answer_str = str(answer_json).strip()
        is_correct = answer_str in correct_values
        return is_correct, question.score if is_correct else 0.0

    elif question.type == "multiple_choice":
        correct_values = {opt.value for opt in options if opt.is_correct}
        if not isinstance(answer_json, list):
            return False, 0.0
        selected = {str(v).strip() for v in answer_json}
        is_correct = selected == correct_values
        return is_correct, question.score if is_correct else 0.0

    elif question.type == "numeric":
        correct_option = next((opt for opt in options if opt.is_correct), None)
        if correct_option is None:
            return False, 0.0
        try:
            correct_val = float(correct_option.value)
            # Accept plain number or {"value": ..., "unit": ...} from unit-selector UI
            raw = answer_json
            if isinstance(raw, dict):
                raw = raw.get("value", raw)
            answer_val = float(raw)
            meta = question.metadata_json
            if not isinstance(meta, dict):
                meta = {}

            # ── Score ranges (partial credit by range) ──────────────────────
            # score_ranges: [{min, max, fraction}] — checked in order, first match wins.
            # fraction 1.0 = full score, 0.5 = half, etc.
            score_ranges = meta.get("score_ranges", [])
            if score_ranges and isinstance(score_ranges, list):
                for sr in score_ranges:
                    try:
                        lo = float(sr.get("min", float("-inf")))
                        hi = float(sr.get("max", float("inf")))
                        fraction = float(sr.get("fraction", 0.0))
                        if lo <= answer_val <= hi:
                            score_obtained = round(question.score * fraction, 4)
                            is_correct = fraction >= 1.0
                            return is_correct, score_obtained
                    except (TypeError, ValueError):
                        continue
                # No range matched → 0
                return False, 0.0

            # ── Simple comparison (fallback when no score_ranges) ────────────
            comparison = meta.get("comparison", "range")
            tolerance = float(meta.get("tolerance", 0.001))
            if comparison == "greater_than":
                is_correct = answer_val > correct_val
            elif comparison == "less_than":
                is_correct = answer_val < correct_val
            else:  # "range" or "exact"
                is_correct = abs(answer_val - correct_val) <= tolerance
            return is_correct, question.score if is_correct else 0.0
        except (TypeError, ValueError):
            return False, 0.0

    elif question.type == "algebraic":
        correct_option = next((opt for opt in options if opt.is_correct), None)
        if correct_option is None:
            return False, 0.0
        is_correct = normalize_algebraic(str(answer_json)) == normalize_algebraic(correct_option.value)
        return is_correct, question.score if is_correct else 0.0

    elif question.type == "drag_drop":
        # Correct order: options sorted by order_index, filter is_correct
        correct_order = [opt.value for opt in sorted(options, key=lambda o: o.order_index) if opt.is_correct]
        if not isinstance(answer_json, list):
            return False, 0.0
        submitted_order = [str(v).strip() for v in answer_json]
        is_correct = submitted_order == correct_order
        return is_correct, question.score if is_correct else 0.0

    elif question.type == "fill_blank":
        # Supports both multiple-choice (answer is a value string) and
        # free-text (answer is a string that must match the correct option's value).
        correct_option = next((opt for opt in options if opt.is_correct), None)
        if correct_option is None:
            return False, 0.0
        if not answer_json:
            return False, 0.0
        is_correct = str(answer_json).strip().lower() == correct_option.value.strip().lower()
        return is_correct, question.score if is_correct else 0.0

    elif question.type == "multi_answer_weighted":
        # Each option has a weight (0.0–1.0). Partial credit is awarded per correct selection.
        # Selecting a wrong option deducts its weight. Total score clamped to [0, question.score].
        if not isinstance(answer_json, list):
            return False, 0.0
        selected = {str(v).strip() for v in answer_json}

        if _has_weights(options):
            # Weight-based partial scoring
            score_fraction = 0.0
            for opt in options:
                opt_weight = getattr(opt, 'weight', 0.0) or 0.0
                if opt.is_correct and opt.value in selected:
                    score_fraction += opt_weight
                elif not opt.is_correct and opt.value in selected:
                    score_fraction -= opt_weight
            score_fraction = max(0.0, min(1.0, score_fraction))
            score_obtained = round(question.score * score_fraction, 4)
            is_correct = score_fraction >= 1.0
            return is_correct if score_fraction > 0 else False, score_obtained
        else:
            # No weights: equal partial scoring — each correct option worth 1/total_correct
            correct_values = {opt.value for opt in options if opt.is_correct}
            if not correct_values:
                return False, 0.0
            per_option = question.score / len(correct_values)
            correct_selected = selected & correct_values
            wrong_selected = selected - correct_values
            raw = len(correct_selected) * per_option - len(wrong_selected) * per_option
            score_obtained = round(max(0.0, raw), 4)
            is_correct = selected == correct_values
            return is_correct, score_obtained

    elif question.type == "drag_categorize":
        # metadata_json: { categories: [{id, label}], correct_map: {item_value: cat_id} }
        # answer: { item_value: cat_id, ... }
        meta = question.metadata_json
        if not isinstance(meta, dict):
            meta = {}
        correct_map = meta.get("correct_map", {})
        if not correct_map or not isinstance(answer_json, dict):
            return False, 0.0
        total = len(correct_map)
        correct_count = sum(
            1 for item_val, cat_id in correct_map.items()
            if str(answer_json.get(item_val, "")).strip() == str(cat_id).strip()
        )
        fraction = correct_count / total if total > 0 else 0.0
        score_obtained = round(question.score * fraction, 4)
        is_correct = fraction >= 1.0
        return (is_correct if fraction > 0 else False), score_obtained

    elif question.type == "image_hotspot":
        # Hotspots defined in metadata_json.hotspots: [{id, x, y, options, correct}]
        # Answer: {"0": "selected", "1": "selected", ...}
        meta = question.metadata_json
        if not isinstance(meta, dict):
            meta = {}
        hotspots = meta.get("hotspots", [])
        if not hotspots:
            return False, 0.0
        if not isinstance(answer_json, dict):
            return False, 0.0
        correct_count = 0
        for spot in hotspots:
            sid = str(spot.get("id", ""))
            correct = str(spot.get("correct", "")).strip()
            given = str(answer_json.get(sid, "")).strip()
            if given.lower() == correct.lower():
                correct_count += 1
        fraction = correct_count / len(hotspots)
        score_obtained = round(question.score * fraction, 4)
        is_correct = fraction >= 1.0
        return (is_correct if fraction > 0 else False), score_obtained

    elif question.type == "inline_choice":
        # Blanks defined in metadata_json.inline_blanks
        # Answer is a dict { "0": "selected_text", "1": "selected_text", ... }
        meta = question.metadata_json
        if not isinstance(meta, dict):
            meta = {}
        blanks = meta.get("inline_blanks", [])
        if not blanks:
            return False, 0.0
        if not isinstance(answer_json, dict):
            return False, 0.0
        correct_count = 0
        for blank in blanks:
            bid = str(blank.get("id", ""))
            correct = str(blank.get("correct", "")).strip()
            given = str(answer_json.get(bid, "")).strip()
            if given.lower() == correct.lower():
                correct_count += 1
        fraction = correct_count / len(blanks)
        score_obtained = round(question.score * fraction, 4)
        is_correct = fraction >= 1.0
        return (is_correct if fraction > 0 else False), score_obtained

    # Unknown type — cannot grade
    return None, 0.0


def calculate_total(exam, answers) -> tuple[float, float]:
    """
    Returns (score_obtained, percentage).
    """
    total_possible = exam.total_score or 0.0
    score_obtained = sum(a.score_obtained or 0.0 for a in answers)
    percentage = (score_obtained / total_possible * 100) if total_possible > 0 else 0.0
    return round(score_obtained, 4), round(percentage, 4)


def get_result_summary(exam, answers, questions_map: dict) -> dict:
    """
    Returns a comprehensive result summary dict including per-materia breakdown.
    questions_map: {question_id: Question}
    """
    total_score = exam.total_score or 0.0
    score_obtained = 0.0
    correct = 0
    incorrect = 0
    omitted = 0

    # materia -> {score_obtained, total_score, correct, incorrect, omitted}
    by_materia: dict[str, dict] = {}

    for answer in answers:
        sc = answer.score_obtained or 0.0
        score_obtained += sc

        q = questions_map.get(answer.question_id)
        materia = (q.materia or "Sin materia") if q else "Sin materia"
        q_max = (q.score or 0.0) if q else 0.0

        if materia not in by_materia:
            by_materia[materia] = {
                "materia": materia,
                "score_obtained": 0.0,
                "total_score": 0.0,
                "correct": 0,
                "incorrect": 0,
                "omitted": 0,
            }
        by_materia[materia]["score_obtained"] += sc
        by_materia[materia]["total_score"] += q_max

        if answer.is_correct is None:
            omitted += 1
            by_materia[materia]["omitted"] += 1
        elif answer.is_correct:
            correct += 1
            by_materia[materia]["correct"] += 1
        else:
            incorrect += 1
            by_materia[materia]["incorrect"] += 1

    percentage = (score_obtained / total_score * 100) if total_score > 0 else 0.0

    # Compute per-materia percentage
    materia_breakdown = []
    for m in by_materia.values():
        m_pct = (m["score_obtained"] / m["total_score"] * 100) if m["total_score"] > 0 else 0.0
        materia_breakdown.append({
            "materia": m["materia"],
            "score_obtained": round(m["score_obtained"], 4),
            "total_score": round(m["total_score"], 4),
            "percentage": round(m_pct, 4),
            "correct": m["correct"],
            "incorrect": m["incorrect"],
            "omitted": m["omitted"],
        })

    return {
        "total_score": total_score,
        "score_obtained": round(score_obtained, 4),
        "percentage": round(percentage, 4),
        "correct": correct,
        "incorrect": incorrect,
        "omitted": omitted,
        "by_materia": materia_breakdown,
    }
