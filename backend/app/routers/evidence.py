import uuid
import io
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form
from app.services.storage_service import storage_service
from app.services.evidence_service import extract_exif_gps, verify_gps_proximity, verify_image_relevance

router = APIRouter(prefix="/evidence", tags=["Evidence Monitoring"])

evidence_db = [] # In-memory database (or link to your team's database.py)

# USER 1: Environmental Org Uploads Evidence
@router.post("/upload")
async def upload_evidence(
    project_id: str = Form(...),
    org_user_id: str = Form(...),
    project_lat: float = Form(...),
    project_lon: float = Form(...),
    file: UploadFile = File(...)
):
    file_bytes = await file.read()
    pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    img_lat, img_lon = extract_exif_gps(file_bytes)
    gps_valid, gps_msg = verify_gps_proximity(img_lat, img_lon, project_lat, project_lon)
    category, confidence = verify_image_relevance(pil_img)

    is_valid = gps_valid and ("document" not in category.lower())
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_url = await storage_service.save_file(file_bytes, filename)

    record = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "uploaded_by": org_user_id,
        "image_url": file_url,
        "is_valid": is_valid,
        "ai_category": category,
        "confidence": f"{confidence}%",
        "gps_status": gps_msg,
        "status": "approved" if is_valid else "flagged"
    }
    evidence_db.append(record)
    return {"message": "Evidence uploaded and analyzed", "data": record}

# USER 2: Company Fetches Evidence
@router.get("/project/{project_id}")
async def get_project_evidence(project_id: str):
    records = [e for e in evidence_db if e["project_id"] == project_id]
    return {"project_id": project_id, "evidence": records}
