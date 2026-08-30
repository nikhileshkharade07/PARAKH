from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO, StringIO
from app.database.session import get_db
from app.services.ingestion_service import IngestionService

router = APIRouter()

@router.post("", status_code=status.HTTP_200_OK)
async def ingest_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingest a procurement data file (CSV or JSON).
    Returns ingestion statistics and any errors.
    """
    # Check file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    filename = file.filename.lower()
    if filename.endswith('.csv'):
        file_type = "csv"
    elif filename.endswith('.json'):
        file_type = "json"
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only CSV and JSON files are allowed."
        )

    # Read the file content
    try:
        content = await file.read()
        if file_type == "csv":
            # Try to decode as UTF-8
            try:
                df = pd.read_csv(BytesIO(content))
            except UnicodeDecodeError:
                # Try with other encoding if needed
                df = pd.read_csv(BytesIO(content), encoding='latin-1')
        else:  # JSON
            try:
                df = pd.read_json(BytesIO(content))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Normalize column names (lowercase, strip)
    df.columns = [str(col).strip().lower() for col in df.columns]

    # Create ingestion service and process
    ingestion_service = IngestionService(db)
    try:
        stats = ingestion_service.ingest_dataframe(df)
        # Commit the transaction
        db.commit()
        return stats
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error during ingestion: {str(e)}")