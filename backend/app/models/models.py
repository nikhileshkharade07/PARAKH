from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    contracts: Mapped[list["Contract"]] = relationship(back_populates="department")

class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    product_description: Mapped[str] = mapped_column(Text, default="")
    contracts: Mapped[list["Contract"]] = relationship(back_populates="vendor")

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    specification: Mapped[str] = mapped_column(Text, default="")
    contract_date: Mapped[date] = mapped_column(Date)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"))
    estimate_value: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    award_value: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    tender_start: Mapped[datetime] = mapped_column(DateTime)
    tender_end: Mapped[datetime] = mapped_column(DateTime)
    department: Mapped["Department"] = relationship(back_populates="contracts")
    vendor: Mapped["Vendor"] = relationship(back_populates="contracts")
    bids: Mapped[list["Bid"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    risk_assessment: Mapped["RiskAssessment | None"] = relationship(back_populates="contract", uselist=False, cascade="all, delete-orphan")
    risk_flags: Mapped[list["RiskFlag"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    extensions: Mapped[list["ContractExtension"]] = relationship(back_populates="contract", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    vendor_name: Mapped[str] = mapped_column(String(200))
    bid_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    contract: Mapped["Contract"] = relationship(back_populates="bids")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), unique=True)
    crs: Mapped[int] = mapped_column(Integer)
    rule_score: Mapped[float] = mapped_column(Float)
    anomaly_score: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(50), default="0.1")
    contract: Mapped["Contract"] = relationship(back_populates="risk_assessment")

class RiskFlag(Base):
    __tablename__ = "risk_flags"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    flag_id: Mapped[str] = mapped_column(String(20), index=True)
    detected: Mapped[bool] = mapped_column(Boolean)
    severity: Mapped[str] = mapped_column(String(20))
    score: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str] = mapped_column(Text)
    contract: Mapped["Contract"] = relationship(back_populates="risk_flags")

class ContractExtension(Base):
    __tablename__ = "contract_extensions"
    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    extension_days: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text, default="")
    contract: Mapped["Contract"] = relationship(back_populates="extensions")
