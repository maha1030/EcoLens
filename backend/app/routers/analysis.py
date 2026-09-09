from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate

from app.services.analysis_service import (
    calculate_progress_analysis
)


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"]
)


@router.get("/project/{project_id}")
def analyze_project(
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

    latest_update = (
        db.query(ProgressUpdate)
        .filter(
            ProgressUpdate.project_id == project_id
        )
        .order_by(
            ProgressUpdate.update_date.desc()
        )
        .first()
    )

    if not latest_update:
        raise HTTPException(
            status_code=400,
            detail="No progress updates found"
        )

    try:
        analysis = calculate_progress_analysis(
            project,
            latest_update
        )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "target_value": project.target_value,
            "target_unit": project.target_unit,
            "latest_progress_value": latest_update.progress_value,
            **analysis
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
