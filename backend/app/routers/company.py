from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate
from app.services.risk_service import detect_risks


router = APIRouter(
    prefix="/company",
    tags=["Company Dashboard"]
)


@router.get("/dashboard")
def get_company_dashboard(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    total_projects = len(projects)

    ongoing_projects = 0
    completed_projects = 0
    attention_projects = 0
    total_progress_sum = 0.0
    projects_with_progress = 0

    for project in projects:
        updates = (
            db.query(ProgressUpdate)
            .filter(ProgressUpdate.project_id == project.id)
            .order_by(ProgressUpdate.update_date)
            .all()
        )

        if updates:
            latest_progress = updates[-1].progress_value
            total_progress_sum += latest_progress
            projects_with_progress += 1

            if latest_progress >= project.target_value:
                completed_projects += 1
            else:
                ongoing_projects += 1

            # Check risk
            try:
                risk = detect_risks(project, updates)
                if risk.get("overall_risk") == "HIGH":
                    attention_projects += 1
            except Exception:
                pass
        else:
            ongoing_projects += 1
            attention_projects += 1  # No progress data is a concern

    average_progress = (
        (total_progress_sum / projects_with_progress)
        if projects_with_progress > 0
        else 0.0
    )

    return {
        "total_projects": total_projects,
        "ongoing_projects": ongoing_projects,
        "completed_projects": completed_projects,
        "attention_projects": attention_projects,
        "average_progress": round(average_progress, 2),
    }
