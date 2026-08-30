"""
Aegis Pre-Seeded Realistic Datasets & OCDS Registry
Contains realistic procurement tenders, UBO forensics graphs, zk-commitments, and satellite/IoT telemetry feeds.
"""
from typing import Dict, Any, List
try:
    from app.services.ubo_graph import UBOGraphEngine
except ImportError:
    from backend.app.services.ubo_graph import UBOGraphEngine

# Initialize and seed UBO Graph Engine
ubo_engine = UBOGraphEngine()

# Seed Nodes
# Companies
ubo_engine.add_node("comp_apex_infra", "Apex Infrastructure Ltd", "company", "IN", 
                    ["HIGH_COLLUSION_RISK", "SHARED_UBO"], {"tax_id": "IN-GST-99214A", "wallet": "0x4aB1...90F2"})
ubo_engine.add_node("comp_titan_build", "Titan Heavy Build Corp", "company", "IN", 
                    ["HIGH_COLLUSION_RISK", "SHARED_NOMINEE"], {"tax_id": "IN-GST-88120B", "wallet": "0x4aB1...90F2"})
ubo_engine.add_node("comp_zenith_heavy", "Zenith Project Systems", "company", "IN", 
                    ["HIGH_COLLUSION_RISK", "SHARED_IP_CLUSTER"], {"tax_id": "IN-GST-77341C", "wallet": "0x98D2...11E4"})
ubo_engine.add_node("comp_transglobal", "TransGlobal Engineering NV", "company", "SG", 
                    ["CLEAN_VERIFIED"], {"tax_id": "SG-UEN-2019441Z", "wallet": "0x33C1...889A"})
ubo_engine.add_node("comp_nordic_telecom", "Nordic Grid Solutions", "company", "SE", 
                    ["CLEAN_VERIFIED"], {"tax_id": "SE-VAT-556102", "wallet": "0x11E9...772B"})
ubo_engine.add_node("comp_bharat_vax", "Bharat BioPharma Logistics", "company", "IN", 
                    ["CLEAN_VERIFIED"], {"tax_id": "IN-GST-554411D", "wallet": "0x55B2...334A"})

# Offshore Shells
ubo_engine.add_node("shell_aurora_holdings", "Aurora Global Equities Ltd (Mauritius)", "shell_entity", "MU", 
                    ["OFFSHORE_CONDUIT", "ZERO_OPERATIONAL_STAFF"], {"incorporation": "2021-03-12"})
ubo_engine.add_node("shell_cayman_trust", "Kailash Citadel Trust (Cayman)", "shell_entity", "KY", 
                    ["TAX_HAVEN_TRUST", "BEARER_SHARES"], {"incorporation": "2019-11-04"})

# UBOs and Nominees
ubo_engine.add_node("person_vikram_singh", "Vikramaditya Singhania (Hidden UBO)", "ubo_person", "IN", 
                    ["PEP_ASSOCIATE", "BENEFICIAL_OWNER_FLAG"], {"citizenship": "IN / St Kitts Passports"})
ubo_engine.add_node("person_rajesh_nominee", "Rajesh Kumar Sharma (Nominee Director)", "nominee_director", "IN", 
                    ["DIRECTOR_ON_42_SHELL_COMPANIES"], {"address": "12 Nariman Point, Floor 14"})
ubo_engine.add_node("person_elena_lindqvist", "Elena Lindqvist (Legitimate MD)", "ubo_person", "SE", 
                    [], {"citizenship": "SE"})

# Technical Fingerprints
ubo_engine.add_node("ip_cluster_delhi", "Subnet 103.21.144.0/24 (Shared VPN / Bidding Enclave)", "shell_entity", "IN", 
                    ["CO_LOCATED_BIDDING_IP"], {"asn": "AS13335"})
ubo_engine.add_node("wallet_cluster_alpha", "HD Wallet Root 0x4aB1...90F2 (Common Seed Derivation)", "wallet_cluster", "GLOBAL", 
                    ["CO_SPONSORING_TX_GAS"], {"derivation_path": "m/44'/60'/0'/0/1-3"})

# Government Entities
ubo_engine.add_node("dept_nhai", "National Highways Authority (NHAI)", "department", "IN", [], {})
ubo_engine.add_node("dept_powergrid", "Power Grid Corporation of India", "department", "IN", [], {})
ubo_engine.add_node("dept_health", "Ministry of Health & Family Welfare", "department", "IN", [], {})

# Seed Edges (Ownership & Forensics Links)
# Ownership tree for Singhania -> Cayman -> Mauritius -> Apex & Titan
ubo_engine.add_edge("shell_cayman_trust", "person_vikram_singh", "beneficial_owner", 1.0, "100% Beneficiary of Cayman Trust")
ubo_engine.add_edge("shell_aurora_holdings", "shell_cayman_trust", "subsidiary", 0.95, "95% Shareholding via Mauritius Conduit")
ubo_engine.add_edge("comp_apex_infra", "shell_aurora_holdings", "subsidiary", 0.72, "72% Direct Equity Ownership")
ubo_engine.add_edge("comp_titan_build", "shell_aurora_holdings", "subsidiary", 0.68, "68% Direct Equity Ownership")

# Zenith linked via nominee director and shared IP
ubo_engine.add_edge("comp_zenith_heavy", "person_rajesh_nominee", "director", 1.0, "Sole Managing Director")
ubo_engine.add_edge("comp_apex_infra", "person_rajesh_nominee", "director", 1.0, "Executive Director")
ubo_engine.add_edge("comp_apex_infra", "ip_cluster_delhi", "shared_ip", 1.0, "Bid submitted from identical IP timestamp +0.4s")
ubo_engine.add_edge("comp_titan_build", "ip_cluster_delhi", "shared_ip", 1.0, "Bid submitted from identical IP timestamp +1.2s")
ubo_engine.add_edge("comp_zenith_heavy", "ip_cluster_delhi", "shared_ip", 1.0, "Bid submitted from identical IP timestamp +2.8s")

# Shared wallet cluster
ubo_engine.add_edge("comp_apex_infra", "wallet_cluster_alpha", "shared_seed_wallet", 1.0, "Gas funded by parent treasury wallet")
ubo_engine.add_edge("comp_titan_build", "wallet_cluster_alpha", "shared_seed_wallet", 1.0, "Gas funded by parent treasury wallet")

# Legitimate entity edges
ubo_engine.add_edge("comp_nordic_telecom", "person_elena_lindqvist", "beneficial_owner", 0.40, "40% Founder Shares")

# TENDERS REGISTRY (OCDS v1.1)
TENDERS_DB: Dict[str, Dict[str, Any]] = {
    "ocds-aegis-in-2026-nh48": {
        "id": "ocds-aegis-in-2026-nh48",
        "ocid": "ocds-aegis-in-2026-nh48",
        "title": "NH-48 Golden Quadrilateral 6-Lane Expressway (Sector 4-B Expansion)",
        "description": "Smart highway construction with Synthetic Aperture Radar (SAR) and Drone LIDAR telemetry smart escrow release.",
        "pillar": "Satellite & IoT Smart-Escrow Milestones",
        "procuring_entity": {
            "id": "dept_nhai",
            "name": "National Highways Authority of India (NHAI)",
            "jurisdiction": "IN"
        },
        "status": "escrow_active",
        "budget_ceiling": {"amount": 45000000.00, "currency": "USD"},
        "submission_deadline": "2026-06-15T18:00:00Z",
        "smart_contract_address": "0x7E5a4bCc82E6E2D2F73f27F11C881F94b159AA21",
        "awarded_vendor": {
            "id": "comp_transglobal",
            "name": "TransGlobal Engineering NV",
            "wallet": "0x33C1...889A",
            "awarded_amount": 41850000.00
        },
        "benchmark_requirements": [
            {"parameter_name": "Pavement Quality Concrete Grade", "target_value": "M40", "weight": 25, "is_hard_gate": True},
            {"parameter_name": "Bituminous Layer Thickness (mm)", "target_value": 150, "tolerance": 0.05, "weight": 25, "is_hard_gate": True},
            {"parameter_name": "Highway Length (km)", "target_value": 45.0, "tolerance": 0.0, "weight": 25, "is_hard_gate": True},
            {"parameter_name": "Automated Toll RFID Sensors", "target_value": 24, "tolerance": 0.0, "weight": 25, "is_hard_gate": False}
        ],
        "milestones": [
            {
                "id": "MS-NH48-01",
                "title": "Milestone 1: Sub-grade Earthwork & Embankment Stabilization",
                "target_percentage": 30.0,
                "allocated_amount": 13500000.00,
                "currency": "USD",
                "status": "funds_released",
                "telemetry_type": "sar_satellite",
                "satellite_scene_id": "SENTINEL-1-SAR-20260714-S4B",
                "expected_metrics": {"backscatter_delta_db": 4.5, "target_volumetric_m3": 450000.0},
                "actual_telemetry_metrics": {"backscatter_delta_db": 4.82, "volumetric_m3": 456200.0, "completion_percentage": 100.0},
                "release_tx_hash": "0xtx_a94f83c18b109e248a31e8471c2b54da719124401a7114e91b5c9284fa901234",
                "verified_at": "2026-07-16T10:14:22Z"
            },
            {
                "id": "MS-NH48-02",
                "title": "Milestone 2: Dense Bituminous Macadam (DBM) Layer 45km",
                "target_percentage": 40.0,
                "allocated_amount": 18000000.00,
                "currency": "USD",
                "status": "pending_telemetry",
                "telemetry_type": "sar_satellite",
                "satellite_scene_id": "SENTINEL-1-SAR-20260824-S4B",
                "expected_metrics": {"backscatter_delta_db": 6.2, "target_volumetric_m3": 620000.0},
                "actual_telemetry_metrics": {"backscatter_delta_db": 6.45, "volumetric_m3": 621500.0, "completion_percentage": 100.0},
                "release_tx_hash": None,
                "verified_at": None
            },
            {
                "id": "MS-NH48-03",
                "title": "Milestone 3: Intelligent Transport Toll RFID & Signage Integration",
                "target_percentage": 30.0,
                "allocated_amount": 13500000.00,
                "currency": "USD",
                "status": "pending_telemetry",
                "telemetry_type": "rfid_warehouse",
                "expected_metrics": {"sensors_online": 24, "rfid_gate_handshake_ok": True},
                "actual_telemetry_metrics": None,
                "release_tx_hash": None,
                "verified_at": None
            }
        ]
    },

    "ocds-aegis-in-2026-vax9": {
        "id": "ocds-aegis-in-2026-vax9",
        "ocid": "ocds-aegis-in-2026-vax9",
        "title": "National Strategic Cold-Chain Vaccine & Life-Saving API Logistics",
        "description": "Physical pharmaceutical procurement gated by automated IoT weighbridge and RFID gate telemetry.",
        "pillar": "Satellite & IoT Smart-Escrow Milestones",
        "procuring_entity": {
            "id": "dept_health",
            "name": "Ministry of Health & Family Welfare",
            "jurisdiction": "IN"
        },
        "status": "escrow_active",
        "budget_ceiling": {"amount": 12500000.00, "currency": "USD"},
        "submission_deadline": "2026-07-01T12:00:00Z",
        "smart_contract_address": "0x3B99c158F2a912B9a184C1C4f8A631398bb55420",
        "awarded_vendor": {
            "id": "comp_bharat_vax",
            "name": "Bharat BioPharma Logistics",
            "wallet": "0x55B2...334A",
            "awarded_amount": 11800000.00
        },
        "benchmark_requirements": [
            {"parameter_name": "Cold Chain Temp Rating (deg C)", "target_value": -20.0, "tolerance": 0.10, "weight": 40, "is_hard_gate": True},
            {"parameter_name": "API Purity Assay (%)", "target_value": 99.5, "tolerance": 0.005, "weight": 30, "is_hard_gate": True},
            {"parameter_name": "Total Quantity (Doses)", "target_value": 5000000, "tolerance": 0.0, "weight": 30, "is_hard_gate": True}
        ],
        "milestones": [
            {
                "id": "MS-VAX-01",
                "title": "Milestone 1: 2.5M Cold-Chain Vials Ingestion at Central Depot",
                "target_percentage": 50.0,
                "allocated_amount": 5900000.00,
                "currency": "USD",
                "status": "funds_released",
                "telemetry_type": "iot_weighbridge",
                "expected_metrics": {"net_weight_kg": 42500.0, "rfid_tag": "VAX-LOT-2026-0811A"},
                "actual_telemetry_metrics": {"net_weight_kg": 42485.0, "weight_deviation_pct": 0.035, "rfid_tag_verified": True},
                "release_tx_hash": "0xtx_44e99120ba991c01e51b6672c84a51187491114092b115e478901248a31e8471",
                "verified_at": "2026-08-12T14:20:00Z"
            },
            {
                "id": "MS-VAX-02",
                "title": "Milestone 2: Remaining 2.5M Vials & Temperature Telemetry Handshake",
                "target_percentage": 50.0,
                "allocated_amount": 5900000.00,
                "currency": "USD",
                "status": "pending_telemetry",
                "telemetry_type": "iot_weighbridge",
                "expected_metrics": {"net_weight_kg": 42500.0, "rfid_tag": "VAX-LOT-2026-0824B"},
                "actual_telemetry_metrics": {"net_weight_kg": 42510.0, "weight_deviation_pct": 0.023, "rfid_tag_verified": True},
                "release_tx_hash": None,
                "verified_at": None
            }
        ]
    },

    "ocds-aegis-in-2026-grid": {
        "id": "ocds-aegis-in-2026-grid",
        "ocid": "ocds-aegis-in-2026-grid",
        "title": "Cyber-Hardened SCADA Substation Hardware for National Power Grid",
        "description": "High-security grid substation hardware with strict Blind zk-SNARK bid commitment and verifiable time-lock encryption.",
        "pillar": "Blind zk-Bidding",
        "procuring_entity": {
            "id": "dept_powergrid",
            "name": "Power Grid Corporation of India",
            "jurisdiction": "IN"
        },
        "status": "active_blind_bidding",
        "budget_ceiling": {"amount": 28000000.00, "currency": "USD"},
        "submission_deadline": "2026-09-30T23:59:59Z",
        "smart_contract_address": "0x91F4a76B124cA58A91B88C441e8932e12B4A7710",
        "benchmark_requirements": [
            {"parameter_name": "IEC 61850 Protocol Compliance", "target_value": True, "weight": 35, "is_hard_gate": True},
            {"parameter_name": "Hardware Security Module (HSM) Level", "target_value": "FIPS-140-3-L3", "weight": 35, "is_hard_gate": True},
            {"parameter_name": "MTBF Mean Time Between Failures (Hours)", "target_value": 100000, "tolerance": 0.05, "weight": 30, "is_hard_gate": False}
        ],
        "milestones": []
    },

    "ocds-aegis-in-2026-rail": {
        "id": "ocds-aegis-in-2026-rail",
        "ocid": "ocds-aegis-in-2026-rail",
        "title": "Metro Transit Rail Automated Train Control (CBTC) Signaling",
        "description": "Algorithmic evaluation showcase featuring automated UBO collusion ring disqualification and zero-human scoring sheets.",
        "pillar": "Algorithmic Technical Evaluation & UBO Forensics",
        "procuring_entity": {
            "id": "dept_nhai",
            "name": "National Transit Infrastructure Board",
            "jurisdiction": "IN"
        },
        "status": "awarded",
        "budget_ceiling": {"amount": 35000000.00, "currency": "USD"},
        "submission_deadline": "2026-05-10T15:00:00Z",
        "smart_contract_address": "0x12A984bC901e1948B31c4419E9237B154aBc8892",
        "benchmark_requirements": [
            {"parameter_name": "SIL-4 Safety Integrity Level Certified", "target_value": True, "weight": 30, "is_hard_gate": True},
            {"parameter_name": "Headway Interval Minimum (Seconds)", "target_value": 90, "tolerance": 0.10, "weight": 25, "is_hard_gate": True},
            {"parameter_name": "Warranty Period (Years)", "target_value": 5, "tolerance": 0.0, "weight": 20, "is_hard_gate": False},
            {"parameter_name": "Cyber ISO 27001 Certified", "target_value": True, "weight": 25, "is_hard_gate": True}
        ],
        "milestones": []
    }
}

# SEED COMMITMENTS FOR BLIND ZK-BIDDING
ZK_COMMITMENTS_DB: List[Dict[str, Any]] = [
    {
        "commitment_hash": "0xzk_8f9a21b44e0192a8174c82b19284aa51901b248a31e8471c2b54da719124401a",
        "tender_ocid": "ocds-aegis-in-2026-grid",
        "vendor_name": "Nordic Grid Solutions",
        "vendor_pubkey": "0x11E9...772B",
        "submission_timestamp": "2026-08-25T09:12:00Z",
        "block_height": 19482104,
        "tx_hash": "0xtx_99a814c8109e248a31e8471c2b54da719124401a7114e91b5c9284fa901234a",
        "zk_snark_proof": {
            "protocol": "Groth16_BN254",
            "circuit": "AegisBidComplianceVerifier.circom",
            "is_valid": True,
            "claims": {"budget_ceiling_respected": True, "minimum_solvency_verified": True, "disclosed_amount_to_officials": False}
        },
        "timelock_status": "LOCKED_UNTIL_2026-09-30T23:59:59Z",
        "status": "COMMITTED_LOCKED"
    },
    {
        "commitment_hash": "0xzk_33b819c4019e248a31e8471c2b54da719124401a7114e91b5c9284fa901234bc",
        "tender_ocid": "ocds-aegis-in-2026-grid",
        "vendor_name": "TransGlobal Engineering NV",
        "vendor_pubkey": "0x33C1...889A",
        "submission_timestamp": "2026-08-26T11:45:10Z",
        "block_height": 19482890,
        "tx_hash": "0xtx_22b109e248a31e8471c2b54da719124401a7114e91b5c9284fa901234991aa",
        "zk_snark_proof": {
            "protocol": "Groth16_BN254",
            "circuit": "AegisBidComplianceVerifier.circom",
            "is_valid": True,
            "claims": {"budget_ceiling_respected": True, "minimum_solvency_verified": True, "disclosed_amount_to_officials": False}
        },
        "timelock_status": "LOCKED_UNTIL_2026-09-30T23:59:59Z",
        "status": "COMMITTED_LOCKED"
    }
]

# SEEDED BIDS FOR RAILWAY SIGNALLING SHOWCASE (Algorithmic Eval + Disqualification)
RAIL_BIDS_DATA: List[Dict[str, Any]] = [
    {
        "vendor_id": "comp_apex_infra",
        "vendor_name": "Apex Infrastructure Ltd",
        "amount": 34800000.00,
        "tech_eval": {
            "overall_tech_score": 88.0,
            "hard_gate_passed": True,
            "disqualified": False,
            "disqualification_reasons": []
        },
        "track_record_score": 80.0
    },
    {
        "vendor_id": "comp_titan_build",
        "vendor_name": "Titan Heavy Build Corp",
        "amount": 34950000.00,
        "tech_eval": {
            "overall_tech_score": 85.0,
            "hard_gate_passed": True,
            "disqualified": False,
            "disqualification_reasons": []
        },
        "track_record_score": 78.0
    },
    {
        "vendor_id": "comp_zenith_heavy",
        "vendor_name": "Zenith Project Systems",
        "amount": 34990000.00,
        "tech_eval": {
            "overall_tech_score": 82.0,
            "hard_gate_passed": True,
            "disqualified": False,
            "disqualification_reasons": []
        },
        "track_record_score": 75.0
    },
    {
        "vendor_id": "comp_transglobal",
        "vendor_name": "TransGlobal Engineering NV",
        "amount": 31500000.00,
        "tech_eval": {
            "overall_tech_score": 96.5,
            "hard_gate_passed": True,
            "disqualified": False,
            "disqualification_reasons": []
        },
        "track_record_score": 92.0
    }
]
