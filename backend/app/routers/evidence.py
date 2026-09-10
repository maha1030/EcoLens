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
    # 2. Validate file type
    # -----------------------------------

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPEG, PNG, and WEBP "
                "images are allowed"
            )
        )

    # -----------------------------------
    # 3. Create unique filename
    # -----------------------------------

    file_extension = (
        file.filename.split(".")[-1]
    )

    unique_filename = (
        f"{uuid.uuid4()}.{file_extension}"
    )

    storage_path = (
        f"project_{project_id}/{unique_filename}"
    )

    # -----------------------------------
    # 4. Read uploaded file
    # -----------------------------------

    file_data = await file.read()

    try:

        # -----------------------------------
        # 5. Upload to Supabase Storage
        # -----------------------------------

        supabase.storage.from_(
            SUPABASE_BUCKET
        ).upload(
            storage_path,
            file_data,
            {
                "content-type": file.content_type
            }
        )

        # -----------------------------------
        # 6. Get public URL
        # -----------------------------------

        public_url = (
            supabase.storage
            .from_(SUPABASE_BUCKET)
            .get_public_url(storage_path)
        )

        # -----------------------------------
        # 7. Save metadata in PostgreSQL
        # -----------------------------------

        evidence = Evidence(

            project_id=project_id,

            file_name=file.filename,

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

            "file_name": evidence.file_name,

            "file_url": evidence.file_path,

            "description": evidence.description
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )