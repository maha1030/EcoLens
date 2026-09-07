from fastapi import FastAPI

app = FastAPI(
    title="EcoPromise AI API",
    description="AI-powered environmental project evaluation platform",
    version="1.0.0"
)


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