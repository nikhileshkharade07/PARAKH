from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_contracts_list_and_filters():
    res = client.get("/api/contracts?limit=10")
    assert res.status_code == 200
    contracts = res.json()
    assert isinstance(contracts, list)
    assert len(contracts) > 0
    first = contracts[0]
    assert "contract_number" in first
    assert "award_value" in first
    assert "crs" in first

    # Filter by risk_level
    high_res = client.get("/api/contracts?risk_level=high")
    assert high_res.status_code == 200
    for c in high_res.json():
        if c.get("crs") is not None:
            assert c["crs"] >= 70

    # Search filter
    search_res = client.get("/api/contracts?search=DEMO")
    assert search_res.status_code == 200
    assert len(search_res.json()) > 0

def test_contract_detail_and_not_found():
    # Get first contract ID
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    detail_res = client.get(f"/api/contracts/{contract_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == contract_id
    assert "specification" in detail
    assert "bids" in detail
    assert "extensions" in detail

    # Test 404 for invalid contract
    err_res = client.get("/api/contracts/9999999")
    assert err_res.status_code == 404

def test_similar_tenders():
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    sim_res = client.get(f"/api/contracts/{contract_id}/similar-tenders?limit=3")
    assert sim_res.status_code == 200
    assert isinstance(sim_res.json(), list)

def test_contract_risk_evidence():
    list_res = client.get("/api/contracts?limit=1")
    contract_id = list_res.json()[0]["id"]

    ev_res = client.get(f"/api/contracts/{contract_id}/risk-evidence")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["contract_id"] == contract_id
    assert "risk_score" in ev_data
    assert "triggered_rules" in ev_data

def test_vendors_and_departments():
    # Vendors
    v_res = client.get("/api/vendors")
    assert v_res.status_code == 200
    vendors = v_res.json()
    assert len(vendors) > 0
    v_id = vendors[0]["id"]

    v_detail = client.get(f"/api/vendors/{v_id}")
    assert v_detail.status_code == 200
    assert v_detail.json()["id"] == v_id
    assert "win_rate" in v_detail.json()

    # Departments
    d_res = client.get("/api/departments")
    assert d_res.status_code == 200
    depts = d_res.json()
    assert len(depts) > 0
    d_id = depts[0]["id"]

    d_detail = client.get(f"/api/departments/{d_id}")
    assert d_detail.status_code == 200
    assert d_detail.json()["id"] == d_id
    assert "total_contracts" in d_detail.json()
