import sys
from pathlib import Path
# Add the backend directory to the sys.path so we can import from app and ml
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta
from decimal import Decimal
import random

from app.database.session import SessionLocal, engine
from app.models.base import Base
from app.models import Department, Vendor, Contract, Bid, ContractExtension
from ml.risk_engine.engine import RiskEngine
from ml.anomaly_detection.isolation_forest import anomaly_scores_for_contracts

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

def main():
    Base.metadata.create_all(engine)
    db = SessionLocal()

    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    departments = [Department(name=x) for x in DEPARTMENTS]
    vendors = [Vendor(name=n, product_description=d) for n,d in VENDORS]
    db.add_all(departments + vendors)
    db.commit()

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
        start = datetime(2024,1,1) + timedelta(days=random.randint(0,900))
        end = start + timedelta(days=random.choice([4,5,6,10,15,21,30]))
        showcase = i in {7,77,777,1777}

        if showcase:
            dept, vendor = departments[0], vendors[0]
            estimate, award = Decimal("3500000"), Decimal("4650000")
            start, end = datetime(2025,4,1), datetime(2025,4,5)

        c = Contract(
            contract_number=f"GEM-DEMO-{i:06d}",
            title=f"Demo Procurement Contract {i}",
            specification=vendor.product_description if showcase else random.choice([
                "Supply and installation of standard equipment with warranty and maintenance support",
                "Civil works including materials, testing, installation and site restoration",
                "Procurement of computers, peripherals and implementation support",
                "Supply of medical equipment meeting applicable technical standards",
            ]),
            contract_date=start.date(), department_id=dept.id, vendor_id=vendor.id,
            estimate_value=estimate, award_value=award, tender_start=start, tender_end=end
        )
        db.add(c); db.flush()

        count = 1 if showcase or i % 17 == 0 else random.choice([2,3,4,5])
        for b in range(count):
            name = vendor.name if b == 0 else f"Demo Bidder {((i+b)*13)%400:03d}"
            db.add(Bid(contract_id=c.id, vendor_name=name))
        if showcase:
            db.add(ContractExtension(contract_id=c.id, extension_days=120, reason="Demo extension"))
            db.add(ContractExtension(contract_id=c.id, extension_days=100, reason="Demo extension"))
        contracts.append(c)

    db.commit()
    engine_service = RiskEngine()
    anomaly_scores = anomaly_scores_for_contracts(contracts)
    for c in contracts:
        engine_service.analyze_contract(c, db, anomaly_score=anomaly_scores[id(c)])
    db.close()
    print(f"Seeded {len(contracts)} synthetic demo contracts.")

if __name__ == "__main__":
    main()
