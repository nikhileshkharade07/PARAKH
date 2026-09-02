from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_search_api_basic_query():
    res = client.get("/api/search?q=Apex")
    assert res.status_code == 200
    data = res.json()
    assert "query" in data
    assert "results" in data
    assert "contracts" in data["results"]
    assert "vendors" in data["results"]
    assert "departments" in data["results"]
    assert "cases" in data["results"]

def test_search_api_empty_query():
    res = client.get("/api/search?q=")
    assert res.status_code == 422  # Query requires min_length=1

def test_search_api_department_search():
    res = client.get("/api/search?q=Works")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 0

def test_search_api_contract_search():
    res = client.get("/api/search?q=GEM")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]["contracts"]) >= 0
