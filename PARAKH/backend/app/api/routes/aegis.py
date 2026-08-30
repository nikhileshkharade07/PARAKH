"""
Aegis REST API Router
Exposes zero-human-discretion endpoints for:
1. Blind zk-Bidding
2. Algorithmic Technical Evaluation
3. UBO & Shell Company Graph Analytics
4. Satellite & IoT Smart-Escrow Milestones
5. OCDS 1.1 International Export Packages
"""
from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import time
import hashlib
import secrets
import random

def secrets_hex(n: int = 16) -> str:
    return secrets.token_hex(n)

try:
    from app.services.zk_engine import ZkCommitmentEngine
    from app.services.algorithmic_eval import AlgorithmicEvaluationEngine
    from app.services.ubo_graph import UBOGraphEngine
    from app.services.telemetry_oracle import TelemetryEscrowOracle
    from app.services.ocds_exporter import OCDSExporter
    from app.services.aegis_data import (
        TENDERS_DB, ZK_COMMITMENTS_DB, RAIL_BIDS_DATA, ubo_engine
    )
except ImportError:
    from backend.app.services.zk_engine import ZkCommitmentEngine
    from backend.app.services.algorithmic_eval import AlgorithmicEvaluationEngine
    from backend.app.services.ubo_graph import UBOGraphEngine
    from backend.app.services.telemetry_oracle import TelemetryEscrowOracle
    from backend.app.services.ocds_exporter import OCDSExporter
    from backend.app.services.aegis_data import (
        TENDERS_DB, ZK_COMMITMENTS_DB, RAIL_BIDS_DATA, ubo_engine
    )

router = APIRouter()

@router.get("/stats")
def get_aegis_kpi_stats():
    """
    Returns global Aegis ecosystem transparency and zero-human-discretion metrics.
    """
    total_locked_budget = sum(t["budget_ceiling"]["amount"] for t in TENDERS_DB.values())
    total_commitments = len(ZK_COMMITMENTS_DB)
    active_tenders = len(TENDERS_DB)
    
    released_funds = 0.0
    for t in TENDERS_DB.values():
        for ms in t.get("milestones", []):
            if ms.get("status") == "funds_released":
                released_funds += ms.get("allocated_amount", 0.0)

    return {
        "platform_name": "Aegis Zero-Human-Discretion Procurement Engine",
        "standard": "Open Contracting Data Standard (OCDS v1.1)",
        "human_discretion_index": "0.00% (Strict Algorithmic & Telemetry Gating)",
        "total_budget_under_aegis_usd": total_locked_budget,
        "total_smart_escrow_released_usd": released_funds,
        "active_tenders_count": active_tenders,
        "cryptographic_zk_commitments_on_chain": total_commitments,
        "collusion_rings_intercepted": 1,
        "oracle_telemetry_verifications": 2,
        "immutable_contracts_deployed": 4
    }

@router.get("/tenders")
def list_tenders(pillar: Optional[str] = None):
    tenders = list(TENDERS_DB.values())
    if pillar:
        tenders = [t for t in tenders if pillar.lower() in t.get("pillar", "").lower()]
    return tenders

@router.get("/tenders/{ocid}")
def get_tender_by_ocid(ocid: str):
    if ocid not in TENDERS_DB:
        raise HTTPException(status_code=404, detail="Tender not found in Aegis OCDS registry.")
    return TENDERS_DB[ocid]

@router.get("/ocds/{ocid}/export")
def export_ocds_package(ocid: str):
    """
    Exports full OCDS 1.1 JSON Release Package.
    """
    pkg = OCDSExporter.generate_release_package(ocid)
    if not pkg:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return JSONResponse(content=pkg)

# ----------------- PILLAR 1: BLIND ZK-BIDDING -----------------

@router.post("/zk/commit")
def submit_zk_bid_commitment(payload: Dict[str, Any] = Body(...)):
    tender_ocid = payload.get("tender_ocid")
    amount = float(payload.get("amount", 0))
    secret_salt = payload.get("secret_salt") or hashlib.sha256(str(time.time()).encode()).hexdigest()[:16]
    vendor_name = payload.get("vendor_name", "Anonymous Bidder")
    vendor_pubkey = payload.get("vendor_pubkey", f"0x{secrets_hex(20)}")
    bank_hash = payload.get("bank_credential_hash", "0x89abf7201c89012a")
    solvency_ratio = float(payload.get("solvency_ratio", 2.2))
    
    if tender_ocid not in TENDERS_DB:
        raise HTTPException(status_code=404, detail="Target tender does not exist.")
        
    tender = TENDERS_DB[tender_ocid]
    budget_ceiling = tender["budget_ceiling"]["amount"]
    
    commitment_hash = ZkCommitmentEngine.compute_poseidon_commitment(
        amount, secret_salt, vendor_pubkey, tender_ocid
    )
    
    snark_proof = ZkCommitmentEngine.generate_zk_snark_proof(
        amount, budget_ceiling, solvency_ratio, bank_hash, secret_salt
    )
    
    deadline_epoch = int(time.time()) + 86400 * 14
    timelock_cipher = ZkCommitmentEngine.encrypt_timelock_payload(
        {"vendor": vendor_name, "amount": amount, "spec": payload.get("proposal_spec", {})},
        deadline_epoch
    )
    
    block_height = 19483000 + len(ZK_COMMITMENTS_DB)
    tx_hash = f"0xtx_{hashlib.sha256(f'{commitment_hash}:{block_height}'.encode()).hexdigest()}"
    
    record = {
        "commitment_hash": commitment_hash,
        "tender_ocid": tender_ocid,
        "vendor_name": vendor_name,
        "vendor_pubkey": vendor_pubkey,
        "submission_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "block_height": block_height,
        "tx_hash": tx_hash,
        "secret_salt": secret_salt,
        "zk_snark_proof": snark_proof,
        "timelock_envelope": timelock_cipher,
        "status": "COMMITTED_LOCKED"
    }
    
    ZK_COMMITMENTS_DB.append(record)
    return record

@router.get("/zk/commitments")
def list_zk_commitments(tender_ocid: Optional[str] = None):
    if tender_ocid:
        return [c for c in ZK_COMMITMENTS_DB if c.get("tender_ocid") == tender_ocid]
    return ZK_COMMITMENTS_DB

# ----------------- PILLAR 2: ALGORITHMIC EVALUATION -----------------

@router.post("/algorithmic/evaluate")
def run_algorithmic_evaluation(tender_ocid: str = Query(...)):
    if tender_ocid not in TENDERS_DB:
        raise HTTPException(status_code=404, detail="Tender not found.")
        
    tender = TENDERS_DB[tender_ocid]
    budget_ceiling = tender["budget_ceiling"]["amount"]
    
    active_vendor_ids = [b["vendor_id"] for b in RAIL_BIDS_DATA]
    collusion_rings = ubo_engine.detect_collusion_rings(active_vendor_ids)
    
    disqualified_vendors = []
    for ring in collusion_rings:
        if ring.get("disqualification_recommended"):
            disqualified_vendors.extend(ring.get("entities", []))
            
    disqualified_vendors = list(set(disqualified_vendors))
    
    evaluated_bids = AlgorithmicEvaluationEngine.calculate_composite_score(
        RAIL_BIDS_DATA, budget_ceiling, disqualified_vendors
    )
    
    audit_hash = hashlib.sha256(f"{tender_ocid}:{len(evaluated_bids)}:{time.time()}".encode()).hexdigest()
    
    return {
        "tender_ocid": tender_ocid,
        "tender_title": tender["title"],
        "budget_ceiling_usd": budget_ceiling,
        "human_scoring_sheets_used": False,
        "evaluation_mode": "DETERMINISTIC_SMART_CONTRACT",
        "collusion_disqualified_count": len(disqualified_vendors),
        "collusion_rings_detected": collusion_rings,
        "evaluated_bids": evaluated_bids,
        "audit_receipt_hash": f"0xeval_{audit_hash}",
        "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# ----------------- PILLAR 3: UBO & SHELL GRAPH FORENSICS -----------------

@router.get("/ubo/graph")
def get_ubo_graph():
    payload = ubo_engine.get_full_graph_payload()
    all_company_ids = [n["id"] for n in payload["nodes"] if n["type"] == "company"]
    rings = ubo_engine.detect_collusion_rings(all_company_ids)
    payload["collusion_rings"] = rings
    return payload

@router.post("/ubo/trace-beneficial-owners")
def trace_ubos(company_id: str = Query(...)):
    ubos = ubo_engine.find_ultimate_beneficial_owners(company_id)
    return {
        "company_id": company_id,
        "company_name": ubo_engine.nodes.get(company_id, {}).get("name", company_id),
        "ultimate_beneficial_owners": ubos
    }

# ----------------- PILLAR 4: SATELLITE & IOT SMART ESCROW -----------------

@router.get("/escrow/milestones/{ocid}")
def get_tender_milestones(ocid: str):
    if ocid not in TENDERS_DB:
        raise HTTPException(status_code=404, detail="Tender not found.")
    return {
        "tender_ocid": ocid,
        "smart_contract_address": TENDERS_DB[ocid].get("smart_contract_address"),
        "milestones": TENDERS_DB[ocid].get("milestones", [])
    }

@router.post("/escrow/ingest-satellite-telemetry")
def ingest_satellite_telemetry(payload: Dict[str, Any] = Body(...)):
    scene_id = payload.get("scene_id", "SENTINEL-1-SAR-20260824-S4B")
    base_db = float(payload.get("baseline_radar_backscatter_db", 2.1))
    curr_db = float(payload.get("current_radar_backscatter_db", 6.45))
    target_delta = float(payload.get("target_structural_delta", 4.0))
    lidar_m3 = float(payload.get("lidar_volumetric_progress_m3", 621500.0))
    target_m3 = float(payload.get("target_volumetric_m3", 620000.0))
    
    result = TelemetryEscrowOracle.process_sar_satellite_telemetry(
        scene_id, base_db, curr_db, target_delta, lidar_m3, target_m3
    )
    return result

@router.post("/escrow/ingest-iot-telemetry")
def ingest_iot_telemetry(payload: Dict[str, Any] = Body(...)):
    dev_id = payload.get("device_id", "IOT-WB-MUMBAI-04")
    sensor_id = payload.get("gate_sensor_id", "RFID-GATE-CENTRAL-A")
    gross_kg = float(payload.get("gross_weight_kg", 54510.0))
    tare_kg = float(payload.get("tare_weight_kg", 12000.0))
    expected_net_kg = float(payload.get("expected_net_weight_kg", 42500.0))
    rfid_tag = payload.get("rfid_manifest_tag", "VAX-LOT-2026-0824B")
    manifest_hash = hashlib.sha256(rfid_tag.encode()).hexdigest()
    
    result = TelemetryEscrowOracle.process_iot_weighbridge_telemetry(
        dev_id, sensor_id, gross_kg, tare_kg, expected_net_kg, rfid_tag, manifest_hash
    )
    return result

@router.post("/escrow/trigger-release")
def trigger_smart_escrow_release(payload: Dict[str, Any] = Body(...)):
    ocid = payload.get("tender_ocid")
    milestone_id = payload.get("milestone_id")
    telemetry_data = payload.get("telemetry_data", {})
    
    if ocid not in TENDERS_DB:
        raise HTTPException(status_code=404, detail="Tender not found.")
        
    tender = TENDERS_DB[ocid]
    target_ms = None
    for ms in tender.get("milestones", []):
        if ms["id"] == milestone_id:
            target_ms = ms
            break
            
    if not target_ms:
        raise HTTPException(status_code=404, detail="Milestone not found in tender escrow.")
        
    vendor_wallet = tender.get("awarded_vendor", {}).get("wallet", "0x33C1...889A")
    escrow_addr = tender.get("smart_contract_address", "0x7E5a4bCc82E6E2D2F73f27F11C881F94b159AA21")
    
    release_res = TelemetryEscrowOracle.execute_smart_escrow_release(
        milestone_id, target_ms["allocated_amount"], target_ms["currency"],
        vendor_wallet, escrow_addr, telemetry_data
    )
    
    if release_res.get("success"):
        target_ms["status"] = "funds_released"
        target_ms["release_tx_hash"] = release_res.get("release_tx_hash")
        target_ms["verified_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        target_ms["actual_telemetry_metrics"] = telemetry_data
        
    return release_res

@router.get("/telemetry/live-sensor-stream")
def get_live_sensor_stream():
    """
    Live simulated telemetry feed returning instantaneous weighbridge and SAR radar readings.
    """
    jitter = random.uniform(-15.0, 15.0)
    net_weight = 42500.0 + jitter
    gross_weight = 12000.0 + net_weight
    radar_db = 6.40 + random.uniform(-0.05, 0.08)
    
    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "weighbridge": {
            "device_id": "IOT-WB-MUMBAI-04",
            "gross_weight_kg": round(gross_weight, 1),
            "tare_weight_kg": 12000.0,
            "net_weight_kg": round(net_weight, 1),
            "rfid_tag": "VAX-LOT-2026-0824B",
            "signal_status": "ONLINE_STABLE",
            "deviation_pct": round(abs(net_weight - 42500.0) / 42500.0 * 100.0, 3)
        },
        "satellite": {
            "scene_id": "SENTINEL-1-SAR-20260824-S4B",
            "backscatter_db": round(radar_db, 2),
            "volumetric_m3": 621500.0,
            "coherence_status": "LOCK_ACQUIRED"
        }
    }

def secrets_hex(n: int) -> str:
    import secrets
    return secrets.token_hex(n)
