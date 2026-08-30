from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_blockchain_anchor_and_verify():
    # 1. Anchor contract GEM-DEMO-000007
    anchor_res = client.post("/api/blockchain/record", json={
        "contract_id": "GEM-DEMO-000007"
    })
    assert anchor_res.status_code == 200
    data = anchor_res.json()
    assert data["recorded"] is True
    assert "canonical_hash" in data
    assert "tx_hash" in data

    # 2. Verify integrity
    contract_num = data.get("contract_number", "GEM-DEMO-000007")
    verify_res = client.post("/api/blockchain/verify", json={
        "contract_id": contract_num
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["verified"] is True
    assert v_data["status"] == "INTEGRITY VERIFIED"
    assert v_data["current_hash"] == v_data["anchored_hash"]
