from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models import Contract, InvestigationCase

client = TestClient(app)

def test_investigation_workflow_end_to_end():
    db = SessionLocal()
    # Find a contract without an active case
    existing_case_contract_ids = {c.contract_id for c in db.query(InvestigationCase.contract_id).all()}
    candidate = db.query(Contract).filter(Contract.id.notin_(existing_case_contract_ids)).first()
    if not candidate:
        candidate = db.query(Contract).first()
        # Delete any existing case on this candidate for isolated test run
        db.query(InvestigationCase).filter(InvestigationCase.contract_id == candidate.id).delete()
        db.commit()
    contract_id = candidate.id
    db.close()

    # 1. Open Case
    create_res = client.post("/api/cases", json={
        "contract_id": contract_id,
        "title": f"Forensic Review into Flagged Hardware Tender {contract_id}",
        "priority": "HIGH",
        "notes_summary": "Initiating investigation into single bidder anomaly"
    })
    assert create_res.status_code == 200
    case_data = create_res.json()
    case_id = case_data["id"]
    assert case_data["contract_id"] == contract_id
    assert case_data["status"] == "NEW"

    # 2. List Cases
    list_cases_res = client.get("/api/cases")
    assert list_cases_res.status_code == 200
    cases = list_cases_res.json()
    assert len(cases) > 0
    assert any(c["id"] == case_id for c in cases)

    # 3. Get Case Detail
    detail_res = client.get(f"/api/cases/{case_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == case_id

    # 4. Add Forensic Note
    note_res = client.post(f"/api/cases/{case_id}/notes", json={
        "author_name": "Priya Sharma (Investigator)",
        "content": "Requested procurement officer interview and audit trail."
    })
    assert note_res.status_code == 200
    assert "id" in note_res.json()

    # 5. Attach Evidence Artifact
    evidence_res = client.post(f"/api/cases/{case_id}/evidence", json={
        "title": "Technical Specification Comparison Report",
        "evidence_type": "SPECIFICATION_DIFF",
        "description": "Evidence showing 94% text match with vendor product sheet.",
        "data_payload": '{"cosine_similarity": 0.94, "vendor": "Apex Systems"}'
    })
    assert evidence_res.status_code == 200
    assert "id" in evidence_res.json()

    # 6. Update Status to ESCALATED
    patch_res = client.patch(f"/api/cases/{case_id}", json={
        "status": "ESCALATED",
        "resolution_notes": "Forwarded to Central Vigilance Commission"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ESCALATED"

    # 7. 404 for invalid case ID
    err_res = client.get("/api/cases/999999")
    assert err_res.status_code == 404
