import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random

# Add backend directory as primary sys.path root
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.database.session import SessionLocal, engine
from app.models.base import Base
from app.models import (
    Department, Vendor, Contract, Bid, ContractExtension,
    User, InvestigationCase, CaseNote, CaseEvidence, AuditLog, BlockchainAnchor
)
from app.core.auth import hash_password
from ml.risk_engine.engine import RiskEngine
from ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts
from app.services.blockchain_service import BlockchainService

random.seed(42)

DEPARTMENTS = [
    "Public Works Department", "Health Services Directorate",
    "Education Infrastructure Division", "Municipal Services Department",
    "Transport & Logistics Authority", "Water Resources Department",
    "Digital Services Directorate", "Urban Development Department",
]

VENDORS = [
    ("Apex Systems India", "enterprise network switches routers firewall managed network services"),
    ("Bharat Infrastructure Works", "road bridge civil construction asphalt drainage infrastructure"),
    ("CivicTech Solutions", "municipal software citizen services data analytics platform"),
    ("MedSupply Bharat", "medical equipment diagnostic devices hospital supplies"),
    ("EduBuild Projects", "school furniture classroom equipment education infrastructure"),
    ("TransitWorks India", "transport fleet maintenance buses logistics tracking"),
    ("Northstar Engineering", "water pumps pipelines treatment engineering"),
    ("GreenGrid Services", "solar lighting energy efficient municipal infrastructure"),
    ("Precision Office Systems", "office computers printers scanners procurement systems"),
]

DEMO_USERS = [
    {"username": "admin", "email": "admin@parakh.gov.in", "full_name": "Chief Audit Officer (Admin)", "role": "ADMIN", "password": "admin"},
    {"username": "auditor", "email": "auditor@parakh.gov.in", "full_name": "Rajesh Kumar (Lead Auditor)", "role": "AUDITOR", "password": "auditor"},
    {"username": "investigator", "email": "investigator@parakh.gov.in", "full_name": "Priya Sharma (Forensic Investigator)", "role": "INVESTIGATOR", "password": "investigator"},
    {"username": "officer", "email": "officer@pwd.gov.in", "full_name": "Amit Deshmukh (Dept Officer)", "role": "DEPARTMENT_OFFICER", "password": "officer"},
]

def main():
    print("Rebuilding database schema...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()

    # 1. Seed Users
    print("Seeding demo users...")
    users = []
    for u in DEMO_USERS:
        user = User(
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            hashed_password=hash_password(u["password"]),
            is_active=True
        )
        db.add(user)
        users.append(user)
    db.commit()
    investigator_user = users[2]

    # 2. Seed Departments and Vendors
    print("Seeding departments and suppliers...")
    departments = [Department(name=x) for x in DEPARTMENTS]
    vendors = [Vendor(name=n, product_description=d) for n, d in VENDORS]
    db.add_all(departments + vendors)
    db.commit()

    # 3. Seed Contracts with relationship appends
    print("Generating 2,500 synthetic procurement contracts in-memory...")
    contracts = []
    for i in range(1, 2501):
        dept = departments[(i * 7) % len(departments)]
        if dept.name == "Public Works Department" and i % 5 != 0:
            vendor = vendors[1]
        elif dept.name == "Digital Services Directorate" and i % 4 != 0:
            vendor = vendors[0]
        else:
            vendor = vendors[(i * 11) % len(vendors)]

        estimate = Decimal(random.randint(150_000, 12_000_000))
        award = Decimal(round(float(estimate) * random.uniform(0.88, 1.38), 2))
        start = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 900))
        end = start + timedelta(days=random.choice([4, 5, 6, 10, 15, 21, 30]))
        showcase = i in {7, 77, 777, 1777}

        if showcase:
            dept, vendor = departments[0], vendors[0]
            estimate, award = Decimal("3500000"), Decimal("4650000")
            start, end = datetime(2025, 4, 1), datetime(2025, 4, 5)

        spec_text = vendor.product_description if showcase else random.choice([
            "Supply and installation of standard enterprise network switches and firewall hardware",
            "Civil engineering road resurfacing, structural asphalt, storm drainage works",
            "Municipal software platform maintenance, database optimization, citizen portal",
            "Hospital diagnostic equipment supplies, certified calibration and warranty maintenance",
            "Classroom furniture, ergonomic desks, interactive smart boards and projectors",
        ])

        c = Contract(
            contract_number=f"GEM-DEMO-{i:06d}",
            title=f"Demo Procurement Contract #{i:04d}",
            specification=spec_text,
            contract_date=start.date(),
            department_id=dept.id,
            vendor_id=vendor.id,
            estimate_value=estimate,
            award_value=award,
            tender_start=start,
            tender_end=end,
            procurement_category="IT & Digital Services" if "network" in spec_text or "software" in spec_text else "Infrastructure & Civil Works" if "Civil" in spec_text else "Healthcare & Medical",
            location="New Delhi" if i % 3 == 0 else "Mumbai" if i % 3 == 1 else "Bengaluru"
        )
        c.department = dept
        c.vendor = vendor

        count = 1 if showcase or i % 17 == 0 else random.choice([2, 3, 4, 5])
        for b in range(count):
            name = vendor.name if b == 0 else f"Demo Bidder {((i + b) * 13) % 400:03d}"
            bid_val = award if b == 0 else award * Decimal(1.04 + (b * 0.02))
            c.bids.append(Bid(vendor_name=name, bid_value=bid_val))

        if showcase:
            c.extensions.append(ContractExtension(extension_days=120, reason="Statutory delivery delay waiver"))
            c.extensions.append(ContractExtension(extension_days=100, reason="Vendor supply chain extension"))

        contracts.append(c)

    db.add_all(contracts)
    db.commit()

    # 4. Analyze Risk Scores
    print("Executing batch ML Anomaly Detection & Risk Engine...")
    engine_service = RiskEngine()
    anomaly_scores = anomaly_scores_for_contracts(contracts)
    
    dept_contracts_map = {}
    for c in contracts:
        dept_contracts_map.setdefault(c.department_id, []).append(c)

    for c in contracts:
        peers = dept_contracts_map.get(c.department_id, [c])
        engine_service.analyze_contract(c, db, anomaly_score=anomaly_scores[id(c)], peers=peers, auto_commit=False)
    db.commit()

    # 5. Seed Initial Forensic Cases for Showcase Anomalies
    print("Opening initial investigation cases for showcase high-risk tenders...")
    showcase_contracts = [c for c in contracts if c.contract_number in {"GEM-DEMO-000007", "GEM-DEMO-000077", "GEM-DEMO-000777", "GEM-DEMO-001777"}]
    for sc in showcase_contracts:
        crs = sc.risk_assessment.crs if sc.risk_assessment else 85
        case = InvestigationCase(
            case_number=f"CASE-2608-{sc.id:04d}",
            contract_id=sc.id,
            title=f"Forensic Audit of {sc.contract_number} ({sc.vendor.name})",
            status="UNDER_REVIEW",
            priority="CRITICAL" if crs >= 85 else "HIGH",
            assigned_to_id=investigator_user.id,
            assigned_to_name=investigator_user.full_name,
            notes_summary=f"Automated risk threshold exceeded (CRS {crs}/100). Flagged for specification tailoring and bidder collusion review.",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        case.notes.append(CaseNote(
            author_id=investigator_user.id,
            author_name=investigator_user.full_name,
            content="Preliminary audit confirms 90%+ TF-IDF similarity with vendor catalog and 4-day tender window.",
            created_at=datetime.now(timezone.utc)
        ))
        case.evidence.append(CaseEvidence(
            title="Tender Specification Overlap Matrix",
            evidence_type="SPECIFICATION_DIFF",
            description="NLP Cosine similarity detected 0.94 specification overlap with winning vendor description.",
            data_payload='{"cosine_similarity": 0.94, "vendor": "Apex Systems India", "flag": "RF-7"}',
            created_by=investigator_user.full_name,
            created_at=datetime.now(timezone.utc)
        ))
        db.add(case)

    db.commit()

    # 6. Seed Blockchain Anchor Records for Showcase Contracts
    print("Anchoring showcase contracts to Sepolia testnet cryptographic ledger...")
    bc_service = BlockchainService(db)
    for sc in showcase_contracts:
        bc_service.anchor_contract(sc.id, user=investigator_user)

    # 7. Seed Initial Audit Log
    db.add(AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=users[0].id,
        username=users[0].username,
        role=users[0].role,
        action="SEED_DATABASE",
        resource_type="SYSTEM",
        resource_id="parakh.db",
        details='{"total_contracts": 2500, "showcase_cases": 4}',
        ip_address="127.0.0.1",
        result="SUCCESS"
    ))
    db.commit()
    db.close()

    print(f"Successfully seeded {len(contracts)} contracts, 4 users, {len(showcase_contracts)} active cases, and blockchain proofs.")

if __name__ == "__main__":
    main()
