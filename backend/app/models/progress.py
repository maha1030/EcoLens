from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.database import Base


class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    progress_value = Column(Float, nullable=False)

    update_date = Column(
        DateTime,
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
