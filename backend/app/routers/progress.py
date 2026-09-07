from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate

from app.schemas.progress import (
    ProgressUpdateCreate,
    ProgressUpdateResponse
)


router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


@router.post("/", response_model=ProgressUpdateResponse)
def create_progress_update(
    progress: ProgressUpdateCreate,
    db: Session = Depends(get_db)
):

    # Check whether project exists
    project = (
        db.query(Project)
        .filter(Project.id == progress.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    new_update = ProgressUpdate(
        **progress.model_dump()
    )

    db.add(new_update)
    db.commit()
    db.refresh(new_update)

    return new_update


@router.get(
    "/project/{project_id}",
    response_model=list[ProgressUpdateResponse]
)
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db)
):

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

    updates = (
        db.query(ProgressUpdate)
        .filter(ProgressUpdate.project_id == project_id)
        .order_by(ProgressUpdate.update_date)
        .all()
    )

    return updates