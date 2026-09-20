import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.evidence import Evidence
from app.supabase_client import supabase
from app.services.photo_relevance_service import analyze_photo_relevance


router = APIRouter(
    prefix="/evidence",
    tags=["Evidence"]
)


SUPABASE_BUCKET = os.getenv(
    "SUPABASE_BUCKET",
    "evidence"
)


@router.post("/upload")
async def upload_evidence(
    project_id: int = Form(...),
    progress_update_id: int = Form(None),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # -----------------------------------
    # 1. Check whether project exists
    # -----------------------------------
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # -----------------------------------
    # 2. Bounded read & size enforcement (Max 10 MB)
    # -----------------------------------
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

    file_data = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(file_data) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 10 MB limit"
        )

    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    # -----------------------------------
    # 3. Validate image signatures (magic bytes)
    # -----------------------------------
    ext = None
    if len(file_data) >= 3 and file_data[:3] == b"\xff\xd8\xff":
        ext = "jpg"
    elif len(file_data) >= 8 and file_data[:8] == b"\x89PNG\r\n\x1a\n":
        ext = "png"
    elif len(file_data) >= 12 and file_data[:4] == b"RIFF" and file_data[8:12] == b"WEBP":
        ext = "webp"

    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Invalid image content. File signature does not match supported formats (JPEG, PNG, WEBP)."
        )

    # -----------------------------------
    # 4. Create unique filename safely
    # -----------------------------------
    clean_original_filename = os.path.basename(file.filename or f"evidence.{ext}")
    unique_filename = f"{uuid.uuid4()}.{ext}"

    # -----------------------------------
    # 5. Try Supabase Storage; fallback to local disk
    # -----------------------------------
    public_url = None
    try:
        if supabase:
            storage_path = f"project_{project_id}/{unique_filename}"
            supabase.storage.from_(SUPABASE_BUCKET).upload(
                storage_path,
                file_data,
                {"content-type": file.content_type}
            )
            public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(storage_path)
    except Exception as s_err:
        public_url = None

    if not public_url:
        upload_base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
        proj_dir = os.path.join(upload_base_dir, f"project_{project_id}")
        os.makedirs(proj_dir, exist_ok=True)
        local_file_path = os.path.join(proj_dir, unique_filename)
        with open(local_file_path, "wb") as f:
            f.write(file_data)
        public_url = f"/uploads/project_{project_id}/{unique_filename}"

    # -----------------------------------
    # 6. Save metadata in SQLite
    # -----------------------------------
    evidence = Evidence(
        project_id=project_id,
        progress_update_id=progress_update_id,
        file_name=clean_original_filename,
        file_path=public_url,
        description=description
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return {
        "message": "Evidence uploaded successfully",
        "evidence_id": evidence.id,
        "project_id": project_id,
        "progress_update_id": evidence.progress_update_id,
        "file_name": evidence.file_name,
        "file_url": evidence.file_path,
        "description": evidence.description
    }


_relevance_cache = {}


def _resolve_evidence_local_path(file_url: str):
    if not file_url:
        return None
    upload_base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    if file_url.startswith("/uploads/"):
        rel_path = file_url[len("/uploads/"):].lstrip("/\\")
        candidate = os.path.join(upload_base_dir, rel_path)
        if os.path.exists(candidate):
            return candidate
    return None


@router.get("/project/{project_id}")
def get_project_evidence(project_id: int, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    records = (
        db.query(Evidence)
        .filter(Evidence.project_id == project_id)
        .order_by(Evidence.uploaded_at.desc(), Evidence.id.desc())
        .all()
    )

    results = []
    for r in records:
        rel_result = None
        local_path = _resolve_evidence_local_path(r.file_path)
        if local_path:
            if r.id in _relevance_cache:
                rel_result = _relevance_cache[r.id]
            else:
                rel_result = analyze_photo_relevance(local_path)
                _relevance_cache[r.id] = rel_result

        results.append({
            "evidence_id": r.id,
            "project_id": r.project_id,
            "progress_update_id": r.progress_update_id,
            "file_name": r.file_name,
            "file_url": r.file_path,
            "description": r.description,
            "created_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
            "relevance": rel_result
        })

    return results


@router.get("/{evidence_id}/relevance")
def get_evidence_relevance(evidence_id: int, db: Session = Depends(get_db)):
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )
    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence record not found"
        )

    local_path = _resolve_evidence_local_path(evidence.file_path)
    if not local_path:
        return {
            "status": "na",
            "semantic_score": 0.0,
            "top_label": "n/a",
            "is_top_positive": False,
            "positive_score": 0.0,
            "negative_score": 0.0,
            "detail": "Local evidence file not found or hosted remotely",
            "model": "openai/clip-vit-base-patch32",
            "probabilities": {}
        }

    if evidence.id in _relevance_cache:
        return _relevance_cache[evidence.id]

    res = analyze_photo_relevance(local_path)
    _relevance_cache[evidence.id] = res
    return res


@router.post("/verify-relevance")
async def verify_photo_relevance(file: UploadFile = File(...)):
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
    file_data = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(file_data) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 10 MB limit"
        )
    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    result = analyze_photo_relevance(file_data)
    return {
        "message": "Photo relevance analysis complete",
        "file_name": file.filename,
        "result": result
    }