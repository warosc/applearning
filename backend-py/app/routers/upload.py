import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "images")


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_SIZE_MB = 10


@router.post("/upload/image", tags=["upload"])
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload an image and return its URL. Requires authentication."""
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {ext}. Usa JPG, PNG, GIF, WebP o SVG.")

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"El archivo excede el límite de {MAX_SIZE_MB} MB.")

    _ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return JSONResponse({"url": f"/static/images/{filename}", "filename": filename})
