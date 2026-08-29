from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import hash_password, verify_password, create_access_token, decode_access_token

client = TestClient(app)

def test_password_hashing():
    pwd = "secure_investigator_password_123"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "investigator", "role": "INVESTIGATOR", "uid": 3}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "investigator"
    assert decoded["role"] == "INVESTIGATOR"

def test_auth_login_endpoint():
    res = client.post("/api/auth/login", json={
        "username": "investigator",
        "password": "investigator"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "investigator"
    assert data["user"]["role"] == "INVESTIGATOR"

def test_auth_me_endpoint():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    token = login_res.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "admin"
    assert res.json()["role"] == "ADMIN"
