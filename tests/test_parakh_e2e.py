"""
PARAKH Master End-to-End Investigation Workflow Integration Test
Validates the complete investigator journey from Dashboard -> High Risk Contract -> Evidence -> Vendor -> Network -> NLP -> Re-analysis -> Case Escalation.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models import Contract, InvestigationCase

client = TestClient(app)

def test_full_parakh_investigation_e2e_journey():
    # 1. Health & Readiness
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    ready_res = client.get("/api/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["database"] in ["ok", "connected"]

    # 2. Dashboard KPIs & Distribution
    dashboard_res = client.get("/api/dashboard/stats")
    assert dashboard_res.status_code == 200
    stats = dashboard_res.json()
    assert "total_contracts" in stats
    assert "high_risk_contracts" in stats
    assert "medium_risk_contracts" in stats
    assert "low_risk_contracts" in stats
    assert "total_vendors" in stats
    assert "total_departments" in stats
    assert stats["total_contracts"] > 0

    # 3. Contract List with High-Risk Filtering
    contracts_res = client.get("/api/contracts?risk_level=high&limit=10")
    assert contracts_res.status_code == 200
    high_risk_contracts = contracts_res.json()
    assert len(high_risk_contracts) > 0

    # Select the first high-risk contract
    target_contract = high_risk_contracts[0]
    contract_id = target_contract["id"]
    vendor_id = target_contract["vendor_id"]
    dept_id = target_contract["department_id"]

    # 4. Deep Contract Investigation
    detail_res = client.get(f"/api/contracts/{contract_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == contract_id
    assert "risk" in detail
    assert detail["risk"]["crs"] is not None
    assert 0 <= detail["risk"]["crs"] <= 100

    # 4b. Inspect Risk Evidence Endpoint
    evidence_res = client.get(f"/api/contracts/{contract_id}/risk-evidence")
    assert evidence_res.status_code == 200
    evidence_data = evidence_res.json()
    assert "triggered_rules" in evidence_data
    assert len(evidence_data["triggered_rules"]) > 0
    for tr in evidence_data["triggered_rules"]:
        assert "rule_id" in tr
        assert "rule_name" in tr
        assert "evidence" in tr
        assert "severity" in tr

    # 5. Connected Vendor Profile & Winning History
    vendor_res = client.get(f"/api/vendors/{vendor_id}")
    assert vendor_res.status_code == 200
    vendor_data = vendor_res.json()
    assert vendor_data["id"] == vendor_id
    assert "total_contracts" in vendor_data
    assert vendor_data["total_contracts"] > 0
    assert "win_rate" in vendor_data

    # 6. Connected Department Profile
    dept_res = client.get(f"/api/departments/{dept_id}")
    assert dept_res.status_code == 200
    dept_data = dept_res.json()
    assert dept_data["id"] == dept_id
    assert "total_contracts" in dept_data
    assert dept_data["total_contracts"] > 0

    # 7. Network Graph Investigation
    network_res = client.get("/api/network")
    assert network_res.status_code == 200
    graph = network_res.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) > 0
    assert len(graph["edges"]) > 0

    # 8. NLP Specification Similarity Analysis
    nlp_res = client.post("/api/nlp/analyze", json={
        "specification_text": "High-throughput server rack with dual redundant power supply",
        "vendor_description": "High-throughput server rack with dual redundant power supply and rail kits"
    })
    assert nlp_res.status_code == 200
    nlp_data = nlp_res.json()
    assert "similarity_score" in nlp_data
    assert nlp_data["similarity_score"] >= 0.70

    # 9. On-Demand Risk Re-Analysis
    recalc_res = client.post(f"/api/risk/analyze?contract_id={contract_id}")
    assert recalc_res.status_code == 200
    recalc_data = recalc_res.json()
    assert "crs" in recalc_data
    assert 0 <= recalc_data["crs"] <= 100
    assert "flags" in recalc_data

    # 10. Investigation Case Creation & Lifecycle Escalation
    db = SessionLocal()
    # Clean any prior test case on this contract
    db.query(InvestigationCase).filter(InvestigationCase.contract_id == contract_id).delete()
    db.commit()
    db.close()

    case_res = client.post("/api/cases", json={
        "contract_id": contract_id,
        "title": f"Formal Audit of High-Risk Contract #{contract_id}",
        "priority": "HIGH",
        "notes_summary": "Investigating high CRS single-bid anomaly and threshold proximity"
    })
    assert case_res.status_code == 200
    case_data = case_res.json()
    case_id = case_data["id"]
    assert case_data["status"] == "NEW"

    # Add Note
    note_res = client.post(f"/api/cases/{case_id}/notes", json={
        "author_name": "Chief Vigilance Officer",
        "content": "Requested procurement file and tender evaluation minutes."
    })
    assert note_res.status_code == 200

    # Attach Forensic Evidence
    evidence_res = client.post(f"/api/cases/{case_id}/evidence", json={
        "title": "NLP Similarity Matrix & Bid Log",
        "evidence_type": "FORENSIC_REPORT",
        "description": "Evidence showing matching text specifications and compressed tender window.",
        "data_payload": '{"cosine_similarity": 0.96, "window_days": 4}'
    })
    assert evidence_res.status_code == 200

    # Escalate Case
    patch_res = client.patch(f"/api/cases/{case_id}", json={
        "status": "ESCALATED",
        "resolution_notes": "Referred to State Procurement Disciplinary Committee"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ESCALATED"
