from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.project import Project
from app.models.progress import ProgressUpdate

from app.services.scoring_service import (
    calculate_ecopromise_score
)


router = APIRouter(
    prefix="/score",
    tags=["EcoPromise Score"]
)


@router.get("/project/{project_id}")
def get_ecopromise_score(
    project_id: int,
    db: Session = Depends(get_db)
):

    # Get project
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

    # Get progress updates
    updates = (
        db.query(ProgressUpdate)
        .filter(
            ProgressUpdate.project_id == project_id
        )
        .order_by(
            ProgressUpdate.update_date
        )
        .all()
    )

    try:

        score_result = calculate_ecopromise_score(
            project,
            updates
        )

        return {
            "project_id": project.id,
            "project_name": project.name,
            **score_result
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
