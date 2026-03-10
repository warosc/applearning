import time
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.core.security import verify_password, hash_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=6)
    name: Optional[str] = None
    email: Optional[str] = None


router = APIRouter()

# Simple in-memory rate limiter: {ip: [timestamp, ...]}
_login_attempts: dict = defaultdict(list)
_MAX_ATTEMPTS = 10
_WINDOW_SECONDS = 60


def _check_rate_limit(identifier: str):
    now = time.time()
    attempts = _login_attempts[identifier]
    # Remove old entries
    _login_attempts[identifier] = [t for t in attempts if now - t < _WINDOW_SECONDS]
    if len(_login_attempts[identifier]) >= _MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
        )
    _login_attempts[identifier].append(now)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    _check_rate_limit(body.username)

    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            name=user.name,
            role=user.role,
        ),
    )


@router.get("/me", response_model=UserInfo)
def me(current_user: User = Depends(get_current_user)):
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        role=current_user.role,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    _check_rate_limit(body.username)

    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    now = datetime.utcnow()
    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        password_hash=hash_password(body.password),
        name=body.name,
        email=body.email,
        role="estudiante",
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            username=user.username,
            name=user.name,
            role=user.role,
        ),
    )
