import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base
from app.main import app
from app.core.deps import get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.exam import Exam, ExamSection
from app.models.question import Question, QuestionOption
import uuid
from datetime import datetime

SQLALCHEMY_TEST_URL = "sqlite:///./test_temp.db"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    user = User(
        id=str(uuid.uuid4()),
        username="testadmin",
        password_hash=hash_password("admin123"),
        name="Test Admin",
        role="admin",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def student_user(db):
    user = User(
        id=str(uuid.uuid4()),
        username="teststudent",
        password_hash=hash_password("student123"),
        name="Test Student",
        role="estudiante",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def sample_exam(db):
    exam = Exam(
        id=str(uuid.uuid4()),
        title="Test Exam",
        description="Test",
        total_score=100.0,
        duration_minutes=60,
        is_published=True,
        calculator_enabled=True,
        navigation_type="free",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(exam)
    db.flush()

    q = Question(
        id=str(uuid.uuid4()),
        exam_id=exam.id,
        type="single_choice",
        prompt="What is 2+2?",
        score=10.0,
        difficulty="facil",
        order_index=0,
        created_at=datetime.utcnow(),
    )
    db.add(q)
    db.flush()

    for i, (label, val, correct) in enumerate([
        ("A) 3", "3", False), ("B) 4", "4", True), ("C) 5", "5", False), ("D) 6", "6", False)
    ]):
        db.add(QuestionOption(
            id=str(uuid.uuid4()), question_id=q.id,
            label=label, value=val, is_correct=correct, order_index=i
        ))

    db.commit()
    db.refresh(exam)
    return exam


def get_token(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    return r.json().get("access_token", "")
