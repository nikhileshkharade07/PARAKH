from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "parakh-api"}

def test_dashboard_stats_endpoint():
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_contracts" in data
    assert "average_crs" in data

def test_contracts_list_endpoint():
    res = client.get("/api/contracts?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_vendors_list_endpoint():
    res = client.get("/api/vendors")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_departments_list_endpoint():
    res = client.get("/api/departments")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_network_graph_endpoint():
    res = client.get("/api/network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data

def test_aegis_stats_endpoint():
    res = client.get("/api/aegis/stats")
    assert res.status_code == 200
    data = res.json()
    assert "human_discretion_index" in data

def test_ingest_template_endpoint():
    res = client.get("/api/ingest/template")
    assert res.status_code == 200
    assert "tender_id" in res.text
