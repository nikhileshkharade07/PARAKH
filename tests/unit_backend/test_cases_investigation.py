from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_investigation_workflow_end_to_end():
    # 1. Get contract ID
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    # 2. Open Case
    create_res = client.post("/api/cases", json={
        "contract_id": contract_id,
        "title": "Forensic Review into Flagged Hardware Tender",
        "priority": "HIGH",
        "notes_summary": "Initiating investigation into single bidder anomaly"
    })
    assert create_res.status_code == 200
    case_data = create_res.json()
    case_id = case_data["id"]
    assert case_data["contract_id"] == contract_id
    assert case_data["status"] == "NEW"

    # 3. List Cases
    list_cases_res = client.get("/api/cases")
    assert list_cases_res.status_code == 200
    cases = list_cases_res.json()
    assert len(cases) > 0
    assert any(c["id"] == case_id for c in cases)

    # 4. Get Case Detail
    detail_res = client.get(f"/api/cases/{case_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == case_id

    # 5. Add Forensic Note
    note_res = client.post(f"/api/cases/{case_id}/notes", json={
        "author_name": "Priya Sharma (Investigator)",
        "content": "Requested procurement officer interview and audit trail."
    })
    assert note_res.status_code == 200
    assert "id" in note_res.json()

    # 6. Attach Evidence Artifact
    evidence_res = client.post(f"/api/cases/{case_id}/evidence", json={
        "title": "Technical Specification Comparison Report",
        "evidence_type": "SPECIFICATION_DIFF",
        "description": "Evidence showing 94% text match with vendor product sheet.",
        "data_payload": '{"cosine_similarity": 0.94, "vendor": "Apex Systems"}'
    })
    assert evidence_res.status_code == 200
    assert "id" in evidence_res.json()

    # 7. Update Status to ESCALATED
    patch_res = client.patch(f"/api/cases/{case_id}", json={
        "status": "ESCALATED",
        "resolution_notes": "Forwarded to Central Vigilance Commission"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ESCALATED"

    # 8. 404 for invalid case ID
    err_res = client.get("/api/cases/999999")
    assert err_res.status_code == 404
