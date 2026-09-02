from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_network_vendor_department():
    res = client.get("/api/network?graph_type=vendor_department")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data

def test_network_vendor_network():
    res = client.get("/api/network?graph_type=vendor_network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data

def test_network_contract_network():
    res = client.get("/api/network?graph_type=contract_network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data

def test_network_risk_network():
    res = client.get("/api/network?graph_type=risk_network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data

def test_network_investigation_graph():
    res = client.get("/api/network?graph_type=investigation&contract_id=1")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
