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
            answer_val = float(answer_json)
            is_correct = abs(answer_val - correct_val) <= 0.001
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
    Returns a comprehensive result summary dict.
    questions_map: {question_id: Question}
    """
    total_score = exam.total_score or 0.0
    score_obtained = 0.0
    correct = 0
    incorrect = 0
    omitted = 0

    for answer in answers:
        sc = answer.score_obtained or 0.0
        score_obtained += sc
        if answer.is_correct is None:
            omitted += 1
        elif answer.is_correct:
            correct += 1
        else:
            incorrect += 1

    percentage = (score_obtained / total_score * 100) if total_score > 0 else 0.0

    return {
        "total_score": total_score,
        "score_obtained": round(score_obtained, 4),
        "percentage": round(percentage, 4),
        "correct": correct,
        "incorrect": incorrect,
        "omitted": omitted,
    }
