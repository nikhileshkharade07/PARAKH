import sys
import os
from pathlib import Path

# Add backend directory to sys.path if not present
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
root_dir = backend_dir.parent

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random

try:
    from app.database.session import SessionLocal, engine
    from app.models.base import Base
    from app.models import Department, Vendor, Contract, Bid, ContractExtension, User, InvestigationCase, CaseNote, CaseEvidence
    from app.core.auth import hash_password
    from ml.risk_engine.engine import RiskEngine
    from ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts
except ImportError:
    from backend.app.database.session import SessionLocal, engine
    from backend.app.models.base import Base
    from backend.app.models import Department, Vendor, Contract, Bid, ContractExtension, User, InvestigationCase, CaseNote, CaseEvidence
    from backend.app.core.auth import hash_password
    from backend.ml.risk_engine.engine import RiskEngine
    from backend.ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts

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

def main(contract_count: int = 100):
    """Seed demo procurement contracts, users, and cases."""
    Base.metadata.create_all(engine)
    db = SessionLocal()

    # Clear existing data cleanly
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    # 1. Seed Users
    users = []
    for u in DEMO_USERS:
        user = User(
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            hashed_password=hash_password(u["password"]),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(user)
        users.append(user)
    db.commit()

    # 2. Seed Departments & Vendors
    departments = [Department(name=x) for x in DEPARTMENTS]
    vendors = [Vendor(name=n, product_description=d) for n, d in VENDORS]
    db.add_all(departments + vendors)
    db.commit()

    # 3. Seed Contracts
    contracts = []
    for i in range(1, contract_count + 1):
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
        showcase = i in {7, 14, 21, 28}

        if showcase:
            dept, vendor = departments[0], vendors[0]
            estimate, award = Decimal("3500000"), Decimal("4650000")
            start, end = datetime(2025, 4, 1), datetime(2025, 4, 5)

        c = Contract(
            contract_number=f"GEM-DEMO-{i:06d}",
            title=f"Demo Procurement Contract {i}",
            specification=vendor.product_description if showcase else random.choice([
                "Supply and installation of standard equipment with warranty and maintenance support",
                "Civil works including materials, testing, installation and site restoration",
                "Procurement of computers, peripherals and implementation support",
                "Supply of medical equipment meeting applicable technical standards",
            ]),
            contract_date=start.date(),
            department_id=dept.id,
            vendor_id=vendor.id,
            estimate_value=estimate,
            award_value=award,
            tender_start=start,
            tender_end=end,
            procurement_category="Goods & Services" if i % 2 == 0 else "Works & Infrastructure",
            location=random.choice(["New Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "National"])
        )
        db.add(c)
        db.flush()

        count = 1 if showcase or i % 7 == 0 else random.choice([2, 3, 4, 5])
        for b in range(count):
            name = vendor.name if b == 0 else f"Demo Bidder {((i + b) * 13) % 400:03d}"
            db.add(Bid(contract_id=c.id, vendor_name=name, bid_value=award if b == 0 else award * Decimal(1.05)))
        
        if showcase:
            db.add(ContractExtension(contract_id=c.id, extension_days=120, reason="Environmental clearance delay"))
            db.add(ContractExtension(contract_id=c.id, extension_days=100, reason="Scope adjustment"))
        
        contracts.append(c)

    db.commit()

    # 4. Batch ML & Risk Assessment
    engine_service = RiskEngine()
    anomaly_scores = anomaly_scores_for_contracts(contracts)
    for c in contracts:
        engine_service.analyze_contract(c, db, anomaly_score=anomaly_scores.get(id(c), 15.0))
    
    # 5. Seed sample investigation case
    sample_flagged = [c for c in contracts if c.risk_assessment and c.risk_assessment.crs >= 70]
    if sample_flagged:
        target = sample_flagged[0]
        case = InvestigationCase(
            case_number="CASE-2026-0001",
            contract_id=target.id,
            title=f"Forensic Review into High Risk Tender {target.contract_number}",
            status="UNDER_REVIEW",
            priority="HIGH",
            assigned_to_id=users[2].id, # investigator
            assigned_to_name=users[2].full_name,
            notes_summary="Automated case generated due to multi-rule trigger (Single Bidder, Compressed Window).",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(case)
        db.flush()

        note = CaseNote(
            case_id=case.id,
            author_id=users[2].id,
            author_name=users[2].full_name,
            content="Initial review initiated. Requesting tender publishing logs and quotation files.",
            created_at=datetime.now(timezone.utc)
        )
        db.add(note)
        db.commit()

    db.close()
    print(f"Successfully seeded {len(contracts)} contracts, {len(users)} demo users, and initial cases.")

if __name__ == "__main__":
    main(100)
