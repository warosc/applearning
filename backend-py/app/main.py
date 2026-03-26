import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, exams, questions, attempts, analytics, admin, dashboard, practice, upload
import app.models.practice  # noqa: F401 — ensure models are registered with SQLAlchemy
from app.config import settings

app = FastAPI(
    title="Escobita Simulator API",
    version="2.0.0",
    description="Backend API for the Escobita Simulator Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin, "http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static", "images")
os.makedirs(_static_dir, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=_static_dir), name="static_images")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(exams.router, prefix="/api/exams", tags=["exams"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(attempts.router, prefix="/api/attempts", tags=["attempts"])
app.include_router(analytics.router, prefix="/api/admin", tags=["analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(dashboard.router, prefix="/api/admin", tags=["dashboard"])
app.include_router(practice.router, prefix="/api/practice", tags=["practice"])
app.include_router(upload.router, prefix="/api", tags=["upload"])


@app.get("/api/config/public", tags=["config"])
def public_config():
    return {
        "appName": settings.app_name,
        "version": settings.app_version,
        "features": {
            "calculator": True,
            "dragDrop": True,
            "markForReview": True,
            "sections": True,
            "questionBank": True,
            "analytics": True,
        },
        "questionTypes": [
            "single_choice",
            "multiple_choice",
            "numeric",
            "algebraic",
            "drag_drop",
            "fill_blank",
            "multi_answer_weighted",
            "inline_choice",
            "image_hotspot",
            "drag_categorize",
        ],
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": settings.app_version}
