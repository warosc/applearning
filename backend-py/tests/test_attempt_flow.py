"""Integration tests: full attempt flow"""
import pytest


def get_token(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


def test_start_attempt(client, sample_exam):
    r = client.post(f"/api/exams/{sample_exam.id}/start")
    assert r.status_code == 200
    data = r.json()
    assert "attempt" in data
    assert data["attempt"]["id"]
    assert data["attempt"]["status"] == "in_progress"


def test_save_answer(client, sample_exam, db):
    from app.models.question import Question
    question = db.query(Question).filter(Question.exam_id == sample_exam.id).first()

    start = client.post(f"/api/exams/{sample_exam.id}/start")
    attempt_id = start.json()["attempt"]["id"]

    r = client.patch(
        f"/api/attempts/{attempt_id}/answer",
        json={"question_id": question.id, "answer_json": "4"}
    )
    assert r.status_code == 200


def test_mark_review(client, sample_exam, db):
    from app.models.question import Question
    question = db.query(Question).filter(Question.exam_id == sample_exam.id).first()

    start = client.post(f"/api/exams/{sample_exam.id}/start")
    attempt_id = start.json()["attempt"]["id"]

    r = client.patch(
        f"/api/attempts/{attempt_id}/mark-review",
        json={"question_id": question.id, "marked": True}
    )
    assert r.status_code == 200


def test_submit_attempt_and_result(client, sample_exam, db):
    from app.models.question import Question
    question = db.query(Question).filter(Question.exam_id == sample_exam.id).first()

    start = client.post(f"/api/exams/{sample_exam.id}/start")
    attempt_id = start.json()["attempt"]["id"]

    # Save correct answer
    client.patch(
        f"/api/attempts/{attempt_id}/answer",
        json={"question_id": question.id, "answer_json": "4"}
    )

    # Submit
    submit_r = client.post(f"/api/attempts/{attempt_id}/submit")
    assert submit_r.status_code == 200
    assert submit_r.json()["status"] == "submitted"

    # Get result
    result_r = client.get(f"/api/attempts/{attempt_id}/result")
    assert result_r.status_code == 200
    data = result_r.json()
    assert data["correct"] == 1
    assert data["score_obtained"] == 10.0
    assert data["percentage"] == 10.0  # 10/100


def test_submit_with_wrong_answer(client, sample_exam, db):
    from app.models.question import Question
    question = db.query(Question).filter(Question.exam_id == sample_exam.id).first()

    start = client.post(f"/api/exams/{sample_exam.id}/start")
    attempt_id = start.json()["attempt"]["id"]

    client.patch(
        f"/api/attempts/{attempt_id}/answer",
        json={"question_id": question.id, "answer_json": "3"}
    )

    client.post(f"/api/attempts/{attempt_id}/submit")
    result_r = client.get(f"/api/attempts/{attempt_id}/result")
    data = result_r.json()
    assert data["correct"] == 0
    assert data["incorrect"] == 1
    assert data["score_obtained"] == 0.0


def test_my_attempts_requires_auth(client):
    r = client.get("/api/attempts/my")
    assert r.status_code == 401


def test_my_attempts_returns_user_attempts(client, student_user, sample_exam):
    token = get_token(client, "teststudent", "student123")
    headers = {"Authorization": f"Bearer {token}"}

    # Start an attempt
    client.post(f"/api/exams/{sample_exam.id}/start", headers=headers)

    # Get my attempts
    r = client.get("/api/attempts/my", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_config_public(client):
    r = client.get("/api/config/public")
    assert r.status_code == 200


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
