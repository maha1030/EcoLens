from fastapi import FastAPI

from app.database import Base, engine
from app.models import Project
from app.routers import projects, progress, analysis, risk, prediction, score, evidence


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="EcoPromise AI API",
    description="AI-powered environmental project evaluation platform",
    version="1.0.0"
)


app.include_router(projects.router)
app.include_router(progress.router)
app.include_router(analysis.router)
app.include_router(risk.router)
app.include_router(prediction.router)
app.include_router(score.router)
app.include_router(evidence.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to EcoPromise AI API 🌍"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }