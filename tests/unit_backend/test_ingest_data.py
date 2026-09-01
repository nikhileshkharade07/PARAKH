import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ingest_template():
    res = client.get("/api/ingest/template")
    assert res.status_code == 200
    assert "tender_id" in res.text
    assert "estimate_value" in res.text

def test_ingest_csv_upload_success():
    csv_content = (
        "tender_id,title,department,vendor,estimate_value,award_value,tender_start,tender_end,bidder_count,specification,extensions,location\n"
        "TEST-ING-001,IT Infrastructure Overhaul,Digital Services Directorate,Apex Systems India,8000000,7800000,2025-06-01,2025-06-15,3,Server rack setup,0,New Delhi\n"
        "TEST-ING-002,Bridge Rehabilitation,Public Works Department,Bharat Infrastructure Works,15000000,14900000,2025-06-05,2025-06-25,2,Structural repair,1,Mumbai\n"
    )
    files = {"file": ("test_import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["valid_records"] >= 2
    assert data["analyzed"] >= 2

def test_ingest_json_upload_success():
    import json
    json_payload = [
        {
            "tender_id": "TEST-JSON-001",
            "title": "Hospital Diagnostic Units",
            "department": "Health Services Directorate",
            "vendor": "MedSupply Bharat",
            "estimate_value": 4500000,
            "award_value": 4400000,
            "tender_start": "2025-07-01",
            "tender_end": "2025-07-20",
            "bidder_count": 4,
            "specification": "Diagnostic medical equipment",
            "location": "Bengaluru"
        }
    ]
    files = {"file": ("test_import.json", io.BytesIO(json.dumps(json_payload).encode("utf-8")), "application/json")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["valid_records"] >= 1

def test_ingest_empty_file_fails():
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 400

def test_ingest_unsupported_format_fails():
    files = {"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 ..."), "application/pdf")}
    res = client.post("/api/ingest/upload", files=files)
    assert res.status_code == 400
