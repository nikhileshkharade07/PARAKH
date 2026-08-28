from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_dashboard_stats():
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_contracts" in data
    assert "high_risk_contracts" in data
    assert "average_crs" in data

def test_contracts_list():
    r = client.get("/api/contracts?limit=10")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if len(data) > 0:
        c = data[0]
        assert "contract_number" in c
        assert "crs" in c

def test_contract_detail():
    r = client.get("/api/contracts/1")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        data = r.json()
        assert "id" in data
        assert "contract_number" in data
        assert "bids" in data
        assert "extensions" in data

def test_departments_list():
    r = client.get("/api/departments")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_department_detail():
    r = client.get("/api/departments/1")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        data = r.json()
        assert "id" in data
        assert "name" in data

def test_vendors_list():
    r = client.get("/api/vendors")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_vendor_detail():
    r = client.get("/api/vendors/1")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        data = r.json()
        assert "id" in data
        assert "name" in data

def test_network_graph():
    r = client.get("/api/network")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "edges" in data

def test_nlp_endpoint():
    r = client.post("/api/nlp/analyze", json={
        "specification": "procurement of laptops and printers",
        "vendor_description": "laptops and printers hardware vendor",
        "threshold": 0.80
    })
    assert r.status_code == 200
    data = r.json()
    assert "similarity_score" in data
    assert "flagged" in data

def test_blockchain_record():
    r = client.post("/api/blockchain/record", json={
        "contract_id": "GEM-DEMO-000007",
        "crs": 85,
        "flags": ["RF-1", "RF-2", "RF-7"]
    })
    assert r.status_code == 200
    data = r.json()
    assert data["recorded"] is True
    assert "record_hash" in data
    assert "tx_hash" in data
