from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate

from app.services.risk_service import detect_risks


router = APIRouter(
    prefix="/risk",
    tags=["Risk Detection"]
)


@router.get("/project/{project_id}")
def detect_project_risk(
    project_id: int,
    db: Session = Depends(get_db)
):

    # Check project
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

    # Get all progress updates
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

    if not updates:
        return {
            "project_id": project.id,
            "project_name": project.name,
            "overall_risk": "UNKNOWN",
            "number_of_risks": 0,
            "risks": []
        }

    # Run risk detection service
    risk_result = detect_risks(
        project,
        updates
    )

    return {
        "project_id": project.id,
        "project_name": project.name,
        **risk_result
    }