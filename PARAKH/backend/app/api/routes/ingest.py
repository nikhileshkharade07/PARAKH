from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.ingestion_service import IngestionService
from app.schemas.ingest import IngestionResponse
from app.core.auth import get_current_user
from app.models import User

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024 # 25MB

@router.post("/upload", response_model=IngestionResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and ingest procurement dataset in CSV, Excel (XLSX), or JSON format."""
    filename = file.filename or "upload.csv"
    lower = filename.lower()
    if not (lower.endswith(".csv") or lower.endswith(".xlsx") or lower.endswith(".xls") or lower.endswith(".json")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Supported formats: .csv, .xlsx, .xls, .json"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 25MB.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    service = IngestionService(db)
    result = service.process_file_content(filename, content, user=current_user)
    return result

@router.get("/template", response_class=PlainTextResponse)
def get_csv_template():
    """Get sample CSV format template for procurement data ingestion."""
    template = (
        "tender_id,title,department,vendor,estimate_value,award_value,tender_start,tender_end,bidder_count,specification,extensions,location\n"
        "TND-2026-001,Supply of Server Infrastructure,Digital Services Directorate,Apex Systems India,5000000,4850000,2025-05-01,2025-05-04,1,High density rack servers 128GB RAM managed firewall,2,New Delhi\n"
        "TND-2026-002,Civil Road Reconstruction,Public Works Department,Bharat Infrastructure Works,12000000,11800000,2025-05-10,2025-05-25,4,Asphalt paving drainage and structural concrete works,0,Mumbai\n"
        "TND-2026-003,Medical Diagnostics Supply,Health Services Directorate,MedSupply Bharat,3500000,3400000,2025-05-15,2025-05-30,3,Standard hospital diagnostic equipment and reagent consumables,0,Pune\n"
    )
    return template
