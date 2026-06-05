"""Tests for app.services.grading"""
import pytest
from unittest.mock import MagicMock
from app.services.grading import grade_answer, calculate_total


# Create mock question objects for testing
def make_question(q_type, score=10.0, options=None, metadata_json=None):
    q = MagicMock()
    q.type = q_type
    q.score = score
    q.options = options or []
    q.metadata_json = metadata_json
    return q


def make_option(value, is_correct):
    opt = MagicMock()
    opt.value = value
    opt.is_correct = is_correct
    return opt


class TestGradeAnswer:
    def test_single_choice_correct(self):
        opts = [make_option("4", True), make_option("3", False)]
        q = make_question("single_choice", score=10.0, options=opts)
        is_correct, score = grade_answer(q, "4")
        assert is_correct is True
        assert score == 10.0

    def test_single_choice_incorrect(self):
        opts = [make_option("4", True), make_option("3", False)]
        q = make_question("single_choice", score=10.0, options=opts)
        is_correct, score = grade_answer(q, "3")
        assert is_correct is False
        assert score == 0.0

    def test_numeric_correct(self):
        opts = [make_option("42", True)]
        q = make_question("numeric", score=5.0, options=opts)
        is_correct, score = grade_answer(q, "42")
        assert is_correct is True
        assert score == 5.0

    def test_numeric_wrong(self):
        opts = [make_option("42", True)]
        q = make_question("numeric", score=5.0, options=opts)
        is_correct, score = grade_answer(q, "43")
        assert is_correct is False
        assert score == 0.0

    def test_numeric_float_tolerance(self):
        opts = [make_option("3.14", True)]
        q = make_question("numeric", score=5.0, options=opts)
        # Exactly correct value
        is_correct, score = grade_answer(q, "3.14")
        assert is_correct is True

    def test_single_choice_none_answer(self):
        opts = [make_option("4", True)]
        q = make_question("single_choice", score=10.0, options=opts)
        is_correct, score = grade_answer(q, None)
        assert is_correct is False
        assert score == 0.0

    def test_multiple_choice_correct(self):
        opts = [make_option("a", True), make_option("b", True), make_option("c", False)]
        q = make_question("multiple_choice", score=10.0, options=opts)
        is_correct, score = grade_answer(q, ["a", "b"])
        assert is_correct is True
        assert score == 10.0

    def test_multiple_choice_partial(self):
        opts = [make_option("a", True), make_option("b", True), make_option("c", False)]
        q = make_question("multiple_choice", score=10.0, options=opts)
        is_correct, score = grade_answer(q, ["a"])
        assert is_correct is False

    def test_algebraic_case_insensitive(self):
        opts = [make_option("x+1", True)]
        q = make_question("algebraic", score=5.0, options=opts)
        is_correct, score = grade_answer(q, "X+1")
        assert is_correct is True

    # ── Editor-created math: correct answer lives in metadata_json.expected, no options ──

    def test_numeric_expected_from_metadata_correct(self):
        # No options — the editor stores the answer in metadata_json.expected.
        q = make_question("numeric", score=5.0, options=[], metadata_json={"expected": "12"})
        is_correct, score = grade_answer(q, "12")
        assert is_correct is True
        assert score == 5.0

    def test_numeric_expected_from_metadata_wrong(self):
        q = make_question("numeric", score=5.0, options=[], metadata_json={"expected": "12"})
        is_correct, score = grade_answer(q, "15")
        assert is_correct is False
        assert score == 0.0

    def test_numeric_metadata_unit_wrapped_answer(self):
        # Unit-selector UI sends {"value": ..., "unit": ...}
        q = make_question("numeric", score=4.0, options=[], metadata_json={"expected": "9.8"})
        is_correct, score = grade_answer(q, {"value": "9.8", "unit": "m/s²"})
        assert is_correct is True
        assert score == 4.0

    def test_numeric_score_ranges_partial(self):
        meta = {"score_ranges": [{"min": 10, "max": 20, "fraction": 0.5}]}
        q = make_question("numeric", score=10.0, options=[], metadata_json=meta)
        is_correct, score = grade_answer(q, "15")
        assert is_correct is False  # fraction < 1.0
        assert score == 5.0

    def test_numeric_score_ranges_full(self):
        meta = {"score_ranges": [{"min": 10, "max": 20, "fraction": 1.0}]}
        q = make_question("numeric", score=10.0, options=[], metadata_json=meta)
        is_correct, score = grade_answer(q, "15")
        assert is_correct is True
        assert score == 10.0

    def test_numeric_score_ranges_no_match(self):
        meta = {"score_ranges": [{"min": 10, "max": 20, "fraction": 1.0}]}
        q = make_question("numeric", score=10.0, options=[], metadata_json=meta)
        is_correct, score = grade_answer(q, "99")
        assert is_correct is False
        assert score == 0.0

    def test_numeric_no_options_no_metadata_returns_zero(self):
        q = make_question("numeric", score=5.0, options=[], metadata_json=None)
        is_correct, score = grade_answer(q, "12")
        assert is_correct is False
        assert score == 0.0

    def test_algebraic_expected_from_metadata(self):
        q = make_question("algebraic", score=5.0, options=[], metadata_json={"expected": "x+1"})
        is_correct, score = grade_answer(q, "X + 1")
        assert is_correct is True
        assert score == 5.0
