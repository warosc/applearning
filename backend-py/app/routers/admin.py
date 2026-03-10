import math
import uuid
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserSchema, CreateUserSchema, UpdateUserSchema

router = APIRouter()


class ResetPasswordBody(BaseModel):
    new_password: str = Field(..., min_length=6)


class ChangeRoleBody(BaseModel):
    role: Literal["admin", "editor", "estudiante"]


@router.get("/users")
def list_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User).order_by(User.created_at.desc())
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(User.username.ilike(like), User.name.ilike(like))
        )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "name": u.name,
                "role": u.role,
                "created_at": u.created_at,
            }
            for u in items
        ],
        "total": total,
    }


@router.patch("/users/{user_id}/password")
def reset_user_password(
    user_id: str,
    body: ResetPasswordBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(body.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.patch("/users/{user_id}/role", response_model=UserSchema)
def change_user_role(
    user_id: str,
    body: ChangeRoleBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


@router.post("/users", response_model=UserSchema, status_code=201)
def create_user(
    body: CreateUserSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        password_hash=hash_password(body.password),
        email=body.email,
        name=body.name,
        role=body.role,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: str,
    body: UpdateUserSchema,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = body.model_dump(exclude_none=True)
    if "password" in update_data:
        user.password_hash = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user
