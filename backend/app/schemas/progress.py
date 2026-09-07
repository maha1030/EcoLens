from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProgressUpdateCreate(BaseModel):
    project_id: int
    progress_value: float
    update_date: datetime
    notes: Optional[str] = None


class ProgressUpdateResponse(ProgressUpdateCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True