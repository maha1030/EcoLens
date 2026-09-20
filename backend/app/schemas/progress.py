from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProgressUpdateCreate(BaseModel):
    project_id: int
    progress_value: float
    update_date: datetime
    notes: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


class ProgressUpdateResponse(ProgressUpdateCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True