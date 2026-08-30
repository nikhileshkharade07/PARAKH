"""
Open Contracting Data Standard (OCDS v1.1) Models & Aegis Extensions
Conforming to international transparency standards with zero-human-discretion cryptographic extensions.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class TenderStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE_BLIND_BIDDING = "active_blind_bidding"
    BIDDING_CLOSED_REVEAL = "bidding_closed_reveal"
    ALGORITHMIC_EVALUATION = "algorithmic_evaluation"
    AWARDED = "awarded"
    ESCROW_ACTIVE = "escrow_active"
    COMPLETED = "completed"
    DISQUALIFIED = "disqualified"

class MilestoneStatus(str, Enum):
    PENDING_TELEMETRY = "pending_telemetry"
    TELEMETRY_INGESTED = "telemetry_ingested"
    ORACLE_VERIFIED = "oracle_verified"
    FUNDS_RELEASED = "funds_released"
    FAILED_AUDIT = "failed_audit"

class TelemetryType(str, Enum):
    SAR_SATELLITE = "sar_satellite"
    DRONE_LIDAR = "drone_lidar"
    IOT_WEIGHBRIDGE = "iot_weighbridge"
    RFID_WAREHOUSE = "rfid_warehouse"

class Value(BaseModel):
    amount: float
    currency: str = "USD"

class Organization(BaseModel):
    id: str
    name: str
    roles: List[str] = []
    jurisdiction: str = "IN"
    tax_id: Optional[str] = None
    wallet_address: Optional[str] = None
    registration_number: Optional[str] = None

class ZkCommitment(BaseModel):
    commitment_hash: str
    solvency_proof_snark: str
    budget_ceiling_proof: str
    timelock_encrypted_payload: str
    submission_timestamp: str
    block_height: int
    tx_hash: str
    vendor_pubkey: str
    status: str = "COMMITTED_LOCKED"
    revealed_bid: Optional[Dict[str, Any]] = None

class BenchmarkRequirement(BaseModel):
    id: str
    parameter_name: str
    target_value: Any
    tolerance: float = 0.0
    weight: float
    is_hard_gate: bool = False
    verification_type: str = "semantic_vector_match"

class TelemetryMilestone(BaseModel):
    id: str
    title: str
    target_percentage: float
    allocated_amount: float
    currency: str = "USD"
    status: MilestoneStatus = MilestoneStatus.PENDING_TELEMETRY
    telemetry_type: TelemetryType
    expected_metrics: Dict[str, Any]
    actual_telemetry_metrics: Optional[Dict[str, Any]] = None
    satellite_scene_id: Optional[str] = None
    iot_device_ids: List[str] = []
    oracle_consensus_signatures: List[str] = []
    release_tx_hash: Optional[str] = None
    verified_at: Optional[str] = None

class Tender(BaseModel):
    id: str
    ocid: str
    title: str
    description: str
    procuring_entity: Organization
    status: TenderStatus
    budget_ceiling: Value
    currency: str = "USD"
    submission_deadline: str
    smart_contract_address: str
    benchmark_requirements: List[BenchmarkRequirement] = []
    commitments_count: int = 0
    disqualified_bids_count: int = 0
    milestones: List[TelemetryMilestone] = []

class UBONode(BaseModel):
    id: str
    name: str
    type: str # "company", "ubo_person", "nominee_director", "wallet_cluster", "shell_entity", "department"
    jurisdiction: str = "IN"
    ownership_pct: Optional[float] = None
    risk_flags: List[str] = []
    metadata: Dict[str, Any] = {}

class UBOEdge(BaseModel):
    source: str
    target: str
    relationship: str # "beneficial_owner", "director", "shared_ip", "shared_seed_wallet", "subsidiary", "bids_on"
    weight: float = 1.0
    details: Optional[str] = None

class UBOGraphData(BaseModel):
    nodes: List[UBONode]
    edges: List[UBOEdge]
    collusion_rings: List[Dict[str, Any]] = []

class OCDSRelease(BaseModel):
    ocid: str
    id: str
    date: str
    tag: List[str]
    initiationType: str = "tender"
    parties: List[Organization]
    tender: Tender
    language: str = "en"
