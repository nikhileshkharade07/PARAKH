from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_assistant_query_specific_tender():
    res = client.post("/api/assistant/query", json={
        "query": "Why is tender GEM-DEMO-000007 high risk?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "GEM-DEMO-000007" in data["answer"]
    assert len(data["citations"]) > 0

def test_assistant_query_suspicious_vendors():
    res = client.post("/api/assistant/query", json={
        "query": "Which vendors have unusually high win rates?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["citations"]) > 0

def test_assistant_query_single_bidders():
    res = client.post("/api/assistant/query", json={
        "query": "Which tenders had one bidder and compressed submission windows?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
