from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audit_logs_retrieval():
    res = client.get("/api/audit-logs")
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    if len(logs) > 0:
        log = logs[0]
        assert "action" in log
        assert "timestamp" in log
        assert "username" in log
        assert "result" in log
