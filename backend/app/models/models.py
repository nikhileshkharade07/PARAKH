from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    Date, DateTime, ForeignKey, Numeric, String, Text, Integer, Float, Boolean, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

def _utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120), default="")
    role: Mapped[str] = mapped_column(String(30), default="INVESTIGATOR", index=True) # ADMIN, AUDITOR, INVESTIGATOR, DEPARTMENT_OFFICER
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    
    cases_assigned: Mapped[List["InvestigationCase"]] = relationship(back_populates="assigned_to")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    contracts: Mapped[List["Contract"]] = relationship(back_populates="department")
    users: Mapped[List["User"]] = relationship()

class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    product_description: Mapped[str] = mapped_column(Text, default="")
    contracts: Mapped[List["Contract"]] = relationship(back_populates="vendor")

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    specification: Mapped[str] = mapped_column(Text, default="")
    contract_date: Mapped[date] = mapped_column(Date, index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"), index=True)
    estimate_value: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    award_value: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    tender_start: Mapped[datetime] = mapped_column(DateTime)
    tender_end: Mapped[datetime] = mapped_column(DateTime)
    procurement_category: Mapped[str] = mapped_column(String(100), default="Goods & Services")
    location: Mapped[str] = mapped_column(String(150), default="National")
    
    department: Mapped["Department"] = relationship(back_populates="contracts")
    vendor: Mapped["Vendor"] = relationship(back_populates="contracts")
    bids: Mapped[List["Bid"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    risk_assessment: Mapped[Optional["RiskAssessment"]] = relationship(back_populates="contract", uselist=False, cascade="all, delete-orphan")
    risk_flags: Mapped[List["RiskFlag"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    extensions: Mapped[List["ContractExtension"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    investigation_cases: Mapped[List["InvestigationCase"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    blockchain_anchors: Mapped[List["BlockchainAnchor"]] = relationship(back_populates="contract", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    vendor_name: Mapped[str] = mapped_column(String(200))
    bid_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    contract: Mapped["Contract"] = relationship(back_populates="bids")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), unique=True, index=True)
    crs: Mapped[int] = mapped_column(Integer, index=True)
    rule_score: Mapped[float] = mapped_column(Float)
    anomaly_score: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    contract: Mapped["Contract"] = relationship(back_populates="risk_assessment")

class RiskFlag(Base):
    __tablename__ = "risk_flags"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    flag_id: Mapped[str] = mapped_column(String(20), index=True)
    detected: Mapped[bool] = mapped_column(Boolean, index=True)
    severity: Mapped[str] = mapped_column(String(20))
    score: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str] = mapped_column(Text)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_json: Mapped[str] = mapped_column(Text, default="{}")
    contract: Mapped["Contract"] = relationship(back_populates="risk_flags")

class ContractExtension(Base):
    __tablename__ = "contract_extensions"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    extension_days: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text, default="")
    contract: Mapped["Contract"] = relationship(back_populates="extensions")

class InvestigationCase(Base):
    __tablename__ = "investigation_cases"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(30), default="NEW", index=True) # NEW, UNDER_REVIEW, EVIDENCE_COLLECTION, ESCALATED, CLEARED, CONFIRMED_SUSPICIOUS, CLOSED
    priority: Mapped[str] = mapped_column(String(20), default="HIGH", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    assigned_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_to_name: Mapped[str] = mapped_column(String(120), default="Unassigned")
    notes_summary: Mapped[str] = mapped_column(Text, default="")
    resolution_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)
    
    contract: Mapped["Contract"] = relationship(back_populates="investigation_cases")
    assigned_to: Mapped[Optional["User"]] = relationship(back_populates="cases_assigned")
    notes: Mapped[List["CaseNote"]] = relationship(back_populates="case", cascade="all, delete-orphan", order_by="CaseNote.created_at.desc()")
    evidence: Mapped[List["CaseEvidence"]] = relationship(back_populates="case", cascade="all, delete-orphan", order_by="CaseEvidence.created_at.desc()")

class CaseNote(Base):
    __tablename__ = "case_notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("investigation_cases.id"), index=True)
    author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(120), default="Investigator")
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    case: Mapped["InvestigationCase"] = relationship(back_populates="notes")

class CaseEvidence(Base):
    __tablename__ = "case_evidence"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("investigation_cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    evidence_type: Mapped[str] = mapped_column(String(50), default="DOCUMENT") # DOCUMENT, SPECIFICATION_DIFF, NETWORK_CLUSTER, PRICE_ANALYSIS, EXTERNAL_REPORT
    description: Mapped[str] = mapped_column(Text, default="")
    data_payload: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[str] = mapped_column(String(120), default="Investigator")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    case: Mapped["InvestigationCase"] = relationship(back_populates="evidence")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    username: Mapped[str] = mapped_column(String(80), default="system", index=True)
    role: Mapped[str] = mapped_column(String(30), default="ANONYMOUS")
    action: Mapped[str] = mapped_column(String(80), index=True) # LOGIN, LOGOUT, INGEST_DATA, RISK_CALCULATE, CREATE_CASE, UPDATE_CASE, ADD_NOTE, ATTACH_EVIDENCE, BLOCKCHAIN_ANCHOR, BLOCKCHAIN_VERIFY
    resource_type: Mapped[str] = mapped_column(String(50), index=True) # CONTRACT, CASE, INGESTION, BLOCKCHAIN, AUTH
    resource_id: Mapped[str] = mapped_column(String(100), default="")
    details: Mapped[str] = mapped_column(Text, default="")
    ip_address: Mapped[str] = mapped_column(String(60), default="127.0.0.1")
    result: Mapped[str] = mapped_column(String(20), default="SUCCESS") # SUCCESS, FAILURE
    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")

class BlockchainAnchor(Base):
    __tablename__ = "blockchain_anchors"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    contract_number: Mapped[str] = mapped_column(String(100), index=True)
    canonical_hash: Mapped[str] = mapped_column(String(66), index=True) # 0x...
    tx_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True) # 0x...
    block_number: Mapped[int] = mapped_column(Integer)
    network: Mapped[str] = mapped_column(String(50), default="Ethereum Sepolia Testnet")
    contract_address: Mapped[str] = mapped_column(String(42))
    status: Mapped[str] = mapped_column(String(20), default="ANCHORED") # ANCHORED, VERIFIED, COMPROMISED
    anchored_by: Mapped[str] = mapped_column(String(120), default="auditor")
    anchored_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    raw_payload: Mapped[str] = mapped_column(Text, default="")
    contract: Mapped["Contract"] = relationship(back_populates="blockchain_anchors")
