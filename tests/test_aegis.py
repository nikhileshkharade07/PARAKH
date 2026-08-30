"""
Aegis End-to-End Automated Test Suite
Verifies all 4 Zero-Human-Discretion Pillars:
1. Blind zk-Bidding (Poseidon Commitment, Groth16 SNARK Proof, Time-Lock Delay)
2. Algorithmic Technical Evaluation (Deterministic Scoring, Zero Human Sheets)
3. UBO & Shell Company Graph Forensics (Collusion Ring Detection & Disqualification)
4. Satellite & IoT Smart Escrow (Multi-Oracle Telemetry Payout Gating)
"""
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
import time
try:
    from app.services.zk_engine import ZkCommitmentEngine
    from app.services.algorithmic_eval import AlgorithmicEvaluationEngine
    from app.services.ubo_graph import UBOGraphEngine
    from app.services.telemetry_oracle import TelemetryEscrowOracle
except ImportError:
    try:
        from backend.app.services.zk_engine import ZkCommitmentEngine
        from backend.app.services.algorithmic_eval import AlgorithmicEvaluationEngine
        from backend.app.services.ubo_graph import UBOGraphEngine
        from backend.app.services.telemetry_oracle import TelemetryEscrowOracle
    except ImportError:
        from PARAKH.backend.app.services.zk_engine import ZkCommitmentEngine
        from PARAKH.backend.app.services.algorithmic_eval import AlgorithmicEvaluationEngine
        from PARAKH.backend.app.services.ubo_graph import UBOGraphEngine
        from PARAKH.backend.app.services.telemetry_oracle import TelemetryEscrowOracle

def test_pillar1_zk_bidding_commitment_and_proof():
    # 1. Vendor commits $24,500,000 against a $28,000,000 ceiling
    amount = 24500000.0
    budget_ceiling = 28000000.0
    salt = "secret_entropy_salt_9981"
    pubkey = "0x11E9942a78B1"
    ocid = "ocds-aegis-in-2026-grid"
    
    commitment = ZkCommitmentEngine.compute_poseidon_commitment(amount, salt, pubkey, ocid)
    assert commitment.startswith("0xzk_")
    
    # 2. zk-SNARK proof verification
    proof = ZkCommitmentEngine.generate_zk_snark_proof(amount, budget_ceiling, 2.4, "0xbank_cred_hash", salt)
    assert proof["is_valid"] is True
    assert proof["claims"]["budget_ceiling_respected"] is True
    assert proof["claims"]["disclosed_amount_to_officials"] is False
    
    # 3. Time-lock encryption
    unlock_time = int(time.time()) + 100
    timelock = ZkCommitmentEngine.encrypt_timelock_payload({"amount": amount}, unlock_time)
    assert timelock["status"] == "TIMELOCKED_IMMUTABLE"
    
    # Reveal before deadline must fail with zero human override
    reveal_fail = ZkCommitmentEngine.verify_and_reveal_bid(commitment, amount, salt, pubkey, ocid, timelock, current_epoch=int(time.time()))
    assert reveal_fail["success"] is False
    assert "TIMELOCK_ACTIVE" in reveal_fail["error"]

def test_pillar2_algorithmic_evaluation():
    reqs = [
        {"parameter_name": "IEC 61850 Protocol Compliance", "target_value": True, "weight": 40, "is_hard_gate": True},
        {"parameter_name": "MTBF Hours", "target_value": 100000, "tolerance": 0.05, "weight": 30, "is_hard_gate": False},
        {"parameter_name": "HSM Level", "target_value": "FIPS-140-3-L3", "weight": 30, "is_hard_gate": True}
    ]
    
    # Compliant Proposal
    valid_spec = {"IEC 61850 Protocol Compliance": True, "MTBF Hours": 105000, "HSM Level": "FIPS-140-3-L3"}
    res_valid = AlgorithmicEvaluationEngine.evaluate_technical_compliance(valid_spec, reqs)
    assert res_valid["hard_gate_passed"] is True
    assert res_valid["overall_tech_score"] >= 95.0
    
    # Non-compliant Proposal (Fails Hard Gate)
    invalid_spec = {"IEC 61850 Protocol Compliance": False, "MTBF Hours": 100000, "HSM Level": "FIPS-140-3-L3"}
    res_invalid = AlgorithmicEvaluationEngine.evaluate_technical_compliance(invalid_spec, reqs)
    assert res_invalid["hard_gate_passed"] is False
    assert res_invalid["disqualified"] is True

def test_pillar3_ubo_graph_collusion_ring_detection():
    g = UBOGraphEngine()
    g.add_node("comp_a", "Company A", "company")
    g.add_node("comp_b", "Company B", "company")
    g.add_node("person_singh", "Vikramaditya Singhania", "ubo_person")
    g.add_node("ip_hub", "Shared Bidding Proxy", "shell_entity")
    
    # Shared UBO & Shared IP
    g.add_edge("comp_a", "person_singh", "beneficial_owner", 0.70)
    g.add_edge("comp_b", "person_singh", "beneficial_owner", 0.65)
    g.add_edge("comp_a", "ip_hub", "shared_ip", 1.0)
    g.add_edge("comp_b", "ip_hub", "shared_ip", 1.0)
    
    rings = g.detect_collusion_rings(["comp_a", "comp_b"])
    assert len(rings) == 1
    assert rings[0]["confidence_score"] >= 0.75
    assert rings[0]["disqualification_recommended"] is True

def test_pillar4_satellite_and_iot_smart_escrow():
    # SAR Satellite test
    sat_res = TelemetryEscrowOracle.process_sar_satellite_telemetry(
        "SENTINEL-1-TEST-01", baseline_radar_backscatter_db=2.0, current_radar_backscatter_db=6.5,
        target_structural_delta=4.0, lidar_volumetric_progress_m3=625000.0, target_volumetric_m3=620000.0
    )
    assert sat_res["telemetry_criteria_met"] is True
    
    # Automated Smart Escrow Release
    escrow_payout = TelemetryEscrowOracle.execute_smart_escrow_release(
        "MS-TEST-01", 18000000.0, "USD", "0xVendorWallet123", "0xEscrowContract456", sat_res
    )
    assert escrow_payout["success"] is True
    assert escrow_payout["status"] == "FUNDS_RELEASED_ONCHAIN"
    assert "Zero Human Discretion" in escrow_payout["human_discretion_used"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
