from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProjectBase(BaseModel):
    name: str
    organization: str
    project_type: str

    target_value: float
    target_unit: str

    start_date: datetime
    end_date: datetime

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
