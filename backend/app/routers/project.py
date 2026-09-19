from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.project import Project
from app.models.progress import ProgressUpdate
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.scoring_service import calculate_ecopromise_score
from app.services.risk_service import detect_risks
from app.services.analysis_service import calculate_progress_analysis
from app.services.prediction_service import predict_project_outcome


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# CREATE PROJECT
@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    new_project = Project(
        **project.model_dump()
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


# COMPARE PROJECTS
@router.get("/compare")
def compare_projects(
    ids: str = Query(..., description="Comma separated project IDs"),
    db: Session = Depends(get_db)
):
    try:
        project_ids = [int(pid.strip()) for pid in ids.split(",")]
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid project IDs format. Must be comma-separated integers."
        )

    if len(project_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 project IDs are required for comparison."
        )

    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()

    if not projects:
        raise HTTPException(
            status_code=404,
            detail="No projects found for the given IDs"
        )

    found_ids = {p.id for p in projects}
    missing_ids = [pid for pid in project_ids if pid not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Projects not found: {missing_ids}"
        )

    results = []
    for project in projects:
        updates = (
            db.query(ProgressUpdate)
            .filter(ProgressUpdate.project_id == project.id)
            .order_by(ProgressUpdate.update_date)
            .all()
        )

        latest_progress = updates[-1].progress_value if updates else 0.0

        project_data = {
            "id": project.id,
            "name": project.name,
            "organization": project.organization,
            "project_type": project.project_type,
            "target_value": project.target_value,
            "target_unit": project.target_unit,
            "latest_progress": latest_progress,
        }

        # Analysis — requires at least 1 update
        try:
            if updates:
                analysis = calculate_progress_analysis(project, updates[-1])
                project_data["analysis"] = analysis
            else:
                project_data["analysis"] = None
        except Exception:
            project_data["analysis"] = None

        # Risk
        try:
            risk = detect_risks(project, updates)
            project_data["risk"] = risk
        except Exception:
            project_data["risk"] = None

        # Prediction — requires at least 2 updates
        try:
            prediction = predict_project_outcome(project, updates)
            project_data["prediction"] = prediction
        except Exception:
            project_data["prediction"] = None

        # Score — requires at least 2 updates
        try:
            score = calculate_ecopromise_score(project, updates)
            project_data["score"] = score
        except Exception:
            project_data["score"] = None

        results.append(project_data)

    return results


# GET ALL PROJECTS
@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    search: Optional[str] = None,
    project_type: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if search:
        query = query.filter(
            Project.name.ilike(f"%{search}%")
            | Project.organization.ilike(f"%{search}%")
        )
    if project_type:
        query = query.filter(
            Project.project_type.ilike(f"%{project_type}%")
        )

    projects = query.all()
    return projects


# GET SINGLE PROJECT
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
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

    return project


# DELETE PROJECT
@router.delete("/{project_id}")
def delete_project(
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

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }
