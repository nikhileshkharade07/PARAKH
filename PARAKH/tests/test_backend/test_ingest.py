import io
import json
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_csv_template():
    res = client.get("/api/ingest/template")
    assert res.status_code == 200
    assert "tender_id" in res.text
    assert "award_value" in res.text

def test_ingest_csv_upload():
    uid = uuid.uuid4().hex[:6]
    csv_data = (
        "tender_id,title,department,vendor,estimate_value,award_value,tender_start,tender_end,bidder_count,specification\n"
        f"TEST-INGEST-{uid}-01,Supply of Router Hardware,Digital Services Directorate,Apex Systems India,4500000,4300000,2025-06-01,2025-06-15,3,Standard network enterprise routers\n"
        f"TEST-INGEST-{uid}-02,Bridge Pier Repair,Public Works Department,Bharat Infrastructure Works,8000000,7900000,2025-06-05,2025-06-25,2,Structural bridge engineering works\n"
    )
    files = {"file": ("test_upload.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["valid_records"] >= 2
    assert data["analyzed"] >= 2

def test_ingest_json_upload():
    uid = uuid.uuid4().hex[:6]
    json_data = [
        {
            "tender_id": f"TEST-JSON-{uid}-01",
            "title": "Hospital Medical Supplies",
            "department": "Health Services Directorate",
            "vendor": "MedSupply Bharat",
            "estimate_value": 2500000,
            "award_value": 2450000,
            "tender_start": "2025-07-01",
            "tender_end": "2025-07-15",
            "bidder_count": 4,
            "specification": "Medical diagnostic reagent kits"
        }
    ]
    files = {"file": ("test_upload.json", io.BytesIO(json.dumps(json_data).encode("utf-8")), "application/json")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["valid_records"] >= 1
