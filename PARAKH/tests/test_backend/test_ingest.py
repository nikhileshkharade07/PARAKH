import os
import tempfile
from fastapi.testclient import TestClient
from backend.app.main import app

# Create a temporary database for testing
def get_test_client():
    # Create a temporary database file
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    os.environ["DATABASE_URL"] = f"sqlite:///{path}"

    # Import and create tables
    from app.models.base import Base
    from app.core.config import settings
    from sqlalchemy import create_engine

    engine = create_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)

    return TestClient(app)

def test_ingest_csv():
    # Create a small CSV in memory
    csv_data = """contract_number,title,award_date,department_name,vendor_name,estimate_value,award_value,tender_start,tender_end,contract_start_date,contract_end_date
TEST-001,Test Contract,2024-01-15,Public Works,Vendor A,100000,120000,2024-01-01,2024-01-10,2024-01-15,2025-01-15
"""
    client = get_test_client()
    response = client.post("/api/ingest", files={"file": ("test.csv", csv_data, "text/csv")})
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 1
    assert data["total"] == 1
    assert data["rejected"] == 0
    assert data["duplicates"] == 0

def test_ingest_json():
    # Create a small JSON in memory
    json_data = """[
    {
        "contract_number": "TEST-002",
        "title": "Test Contract 2",
        "award_date": "2024-02-15",
        "department_name": "Health Services",
        "vendor_name": "Vendor B",
        "estimate_value": 200000,
        "award_value": 220000,
        "tender_start": "2024-02-01",
        "tender_end": "2024-02-10",
        "contract_start_date": "2024-02-15",
        "contract_end_date": "2025-02-15"
    }
]"""
    client = get_test_client()
    response = client.post("/api/ingest", files={"file": ("test.json", json_data, "application/json")})
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 1
    assert data["total"] == 1
    assert data["rejected"] == 0
    assert data["duplicates"] == 0