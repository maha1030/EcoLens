import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.models import Project
from app.routers import project, progress, analysis, risk, prediction, score, evidence, company


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="EcoPromise AI API",
    description="AI-powered environmental project evaluation platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure local evidence uploads directory exists and mount static route
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


app.include_router(project.router)
app.include_router(progress.router)
app.include_router(analysis.router)
app.include_router(risk.router)
app.include_router(prediction.router)
app.include_router(score.router)
app.include_router(evidence.router)
app.include_router(company.router)


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
