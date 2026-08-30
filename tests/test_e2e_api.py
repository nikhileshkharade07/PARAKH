"""
Aegis Full End-to-End HTTP API Integration Test
Validates all endpoints against the live running server at http://127.0.0.1:8000
"""
import sys
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_verification():
    print(f"=== Starting Aegis E2E API Verification against {BASE_URL} ===\n")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 1. Health & Web Portal
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] /health -> 200 OK: " + json.dumps(res.json()))

    res = client.get("/")
    assert res.status_code == 200, "Frontend index.html failed to load"
    assert "AEGIS" in res.text, "Index HTML missing Aegis title"
    print("[PASS] GET / (Web Dashboard) -> 200 OK (HTML Loaded)")

    # 2. Stats & Tenders
    res = client.get("/api/aegis/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["human_discretion_index"] == "0.00% (Strict Algorithmic & Telemetry Gating)"
    print("[PASS] GET /api/aegis/stats -> 200 OK (Human Discretion: 0.00%)")

    res = client.get("/api/aegis/tenders")
    assert res.status_code == 200
    tenders = res.json()
    assert len(tenders) >= 4
    print(f"[PASS] GET /api/aegis/tenders -> 200 OK ({len(tenders)} OCDS Tenders loaded)")

    # 3. Pillar 1: Blind zk-Bidding
    zk_payload = {
        "tender_ocid": "ocds-aegis-in-2026-grid",
        "vendor_name": "AeroSpace Dynamics Corp",
        "amount": 23850000.0,
        "secret_salt": "0xsalt_99881122aabb",
        "solvency_ratio": 2.4,
        "proposal_spec": {"IEC 61850 Protocol Compliance": True, "HSM Level": "FIPS-140-3-L3", "MTBF Hours": 105000}
    }
    res = client.post("/api/aegis/zk/commit", json=zk_payload)
    assert res.status_code == 200
    commit_data = res.json()
    assert commit_data["commitment_hash"].startswith("0xzk_")
    assert commit_data["zk_snark_proof"]["is_valid"] is True
    print(f"[PASS] POST /api/aegis/zk/commit -> 200 OK (Poseidon Hash: {commit_data['commitment_hash'][:20]}..., Groth16 Verified)")

    # 4. Pillar 3: UBO Graph & Forensics
    res = client.get("/api/aegis/ubo/graph")
    assert res.status_code == 200
    graph = res.json()
    assert len(graph["nodes"]) >= 10
    assert len(graph["collusion_rings"]) >= 1
    print(f"[PASS] GET /api/aegis/ubo/graph -> 200 OK ({len(graph['nodes'])} Nodes, {len(graph['collusion_rings'])} Collusion Ring Intercepted)")

    # 5. Pillar 2: Algorithmic Technical Evaluation
    res = client.post("/api/aegis/algorithmic/evaluate?tender_ocid=ocds-aegis-in-2026-rail")
    assert res.status_code == 200
    eval_res = res.json()
    assert eval_res["collusion_disqualified_count"] >= 3
    winner = [b for b in eval_res["evaluated_bids"] if b.get("is_winner")][0]
    assert winner["vendor_name"] == "TransGlobal Engineering NV"
    print(f"[PASS] POST /api/aegis/algorithmic/evaluate -> 200 OK (Winner: {winner['vendor_name']}, 3 Shell Entities Disqualified)")

    # 6. Pillar 4: Telemetry Smart Escrow (SAR Satellite & IoT Weighbridge)
    sat_payload = {
        "scene_id": "SENTINEL-1-SAR-20260824-S4B",
        "baseline_radar_backscatter_db": 2.1,
        "current_radar_backscatter_db": 6.45,
        "target_structural_delta": 4.0,
        "lidar_volumetric_progress_m3": 621500.0,
        "target_volumetric_m3": 620000.0
    }
    res = client.post("/api/aegis/escrow/ingest-satellite-telemetry", json=sat_payload)
    assert res.status_code == 200
    sat_data = res.json()
    assert sat_data["telemetry_criteria_met"] is True
    print(f"[PASS] POST /api/aegis/escrow/ingest-satellite-telemetry -> 200 OK (SAR Coherence & LIDAR 100% Verified)")

    release_payload = {
        "tender_ocid": "ocds-aegis-in-2026-nh48",
        "milestone_id": "MS-NH48-02",
        "telemetry_data": sat_data
    }
    res = client.post("/api/aegis/escrow/trigger-release", json=release_payload)
    assert res.status_code == 200
    release_data = res.json()
    assert release_data["success"] is True
    assert release_data["status"] == "FUNDS_RELEASED_ONCHAIN"
    print(f"[PASS] POST /api/aegis/escrow/trigger-release -> 200 OK (Released: ${release_data['released_amount']:,.2f} USD, Tx: {release_data['release_tx_hash'][:24]}...)")

    print("\n=======================================================")
    print("ALL 4 ZERO-HUMAN-DISCRETION PILLARS FUNCTION END-TO-END!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e_verification()
