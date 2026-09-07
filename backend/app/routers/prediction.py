from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate

from app.services.prediction_service import (
    predict_project_outcome
)


router = APIRouter(
    prefix="/prediction",
    tags=["Outcome Prediction"]
)


@router.get("/project/{project_id}")
def predict_project(
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

        prediction = predict_project_outcome(
            project,
            updates
        )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "target_value": project.target_value,
            "target_unit": project.target_unit,
            **prediction
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )