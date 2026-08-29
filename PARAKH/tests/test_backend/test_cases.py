from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cases_lifecycle():
    # 1. List existing cases
    res = client.get("/api/cases")
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)

    # 2. Create or fetch case for contract 10
    create_res = client.post("/api/cases", json={
        "contract_id": 10,
        "title": "Test Investigation Case 10",
        "priority": "HIGH",
        "notes_summary": "Initial forensic screening notes."
    })
    assert create_res.status_code == 200
    case_data = create_res.json()
    assert "id" in case_data
    case_id = case_data["id"]

    # 3. Add note
    note_res = client.post(f"/api/cases/{case_id}/notes", json={
        "content": "Contacted department procurement officer for clarification."
    })
    assert note_res.status_code == 200
    assert "id" in note_res.json()

    # 4. Attach evidence
    ev_res = client.post(f"/api/cases/{case_id}/evidence", json={
        "title": "Vendor Bidding Analysis Memo",
        "evidence_type": "DOCUMENT",
        "description": "Memo detailing bidder participation log."
    })
    assert ev_res.status_code == 200
    assert "id" in ev_res.json()

    # 5. Update case status to ESCALATED
    up_res = client.patch(f"/api/cases/{case_id}", json={
        "status": "ESCALATED",
        "resolution_notes": "Forwarded to Central Vigilance Commission."
    })
    assert up_res.status_code == 200
    assert up_res.json()["status"] == "ESCALATED"
