from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_login_success():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"

def test_auth_login_invalid_password():
    res = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401

def test_auth_register_and_login():
    import uuid
    unique_user = f"auditor_{uuid.uuid4().hex[:6]}"
    res = client.post("/api/auth/register", json={
        "username": unique_user,
        "email": f"{unique_user}@parakh.gov.in",
        "full_name": "Test Forensic Auditor",
        "role": "AUDITOR",
        "password": "SecurePassword123"
    })
    assert res.status_code == 201
    reg_data = res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["username"] == unique_user

    # Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json={
        "username": unique_user,
        "email": f"{unique_user}@parakh.gov.in",
        "full_name": "Duplicate User",
        "role": "AUDITOR",
        "password": "SecurePassword123"
    })
    assert dup_res.status_code == 400

    # Login with new user
    login_res = client.post("/api/auth/login", json={"username": unique_user, "password": "SecurePassword123"})
    assert login_res.status_code == 200
    assert login_res.json()["user"]["username"] == unique_user

def test_auth_get_me_with_token():
    # Login first
    login_res = client.post("/api/auth/login", json={"username": "investigator", "password": "investigator"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Call /auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "investigator"
    assert me_data["role"] == "INVESTIGATOR"

def test_auth_refresh_token():
    login_res = client.post("/api/auth/login", json={"username": "auditor", "password": "auditor"})
    token = login_res.json()["access_token"]

    ref_res = client.post("/api/auth/refresh", json={"token": token})
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()

def test_auth_logout():
    login_res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    token = login_res.json()["access_token"]

    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "Logged out successfully"
