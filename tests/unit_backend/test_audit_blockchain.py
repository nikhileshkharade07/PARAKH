from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audit_logs_query():
    res = client.get("/api/audit?limit=10")
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)

def test_blockchain_anchor_and_verify():
    # 1. Get contract ID
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    # 2. Record / Anchor
    anchor_res = client.post("/api/blockchain/record", json={"contract_id": str(contract_id)})
    assert anchor_res.status_code == 200
    anchor_data = anchor_res.json()
    assert anchor_data["recorded"] is True
    assert "canonical_hash" in anchor_data
    assert "tx_hash" in anchor_data

    # 3. Verify
    verify_res = client.post("/api/blockchain/verify", json={"contract_id": str(contract_id)})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["verified"] is True
    assert verify_data["status"] == "INTEGRITY VERIFIED"
