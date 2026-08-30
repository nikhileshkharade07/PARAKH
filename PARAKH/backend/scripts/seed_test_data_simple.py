"""
Simple seed script for creating test contracts without risk engine.
"""
import sys
from pathlib import Path
# Add the backend directory to the sys.path so we can import from app and ml
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta
from decimal import Decimal

from app.database.session import SessionLocal, engine
from app.models.base import Base
from app.models import Department, Vendor, Contract, Bid, ContractExtension
from ml.risk_engine.engine import RiskEngine

def main():
    # Create tables
    Base.metadata.create_all(engine)
    db = SessionLocal()

    # Clear existing data
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    # Create departments
    dept_public_works = Department(name="Public Works Department")
    dept_health = Department(name="Health Services Directorate")
    dept_education = Department(name="Education Infrastructure Division")
    dept_digital = Department(name="Digital Services Directorate")
    db.add_all([dept_public_works, dept_health, dept_education, dept_digital])
    db.flush()

    # Create vendors
    vendor_apex = Vendor(name="Apex Systems India",
                         product_description="enterprise network switches routers firewall managed network services")
    vendor_bharat = Vendor(name="Bharat Infrastructure Works",
                           product_description="road bridge civil construction asphalt drainage infrastructure")
    vendor_civictech = Vendor(name="CivicTech Solutions",
                              product_description="municipal software citizen services data analytics platform")
    vendor_medsupply = Vendor(name="MedSupply Bharat",
                              product_description="medical equipment diagnostic devices hospital supplies")
    vendor_edubuild = Vendor(name="EduBuild Projects",
                             product_description="school furniture classroom equipment education infrastructure")
    db.add_all([vendor_apex, vendor_bharat, vendor_civictech, vendor_medsupply, vendor_edubuild])
    db.flush()

    # We'll create 10 test contracts
    contracts = []

    # Contract 1: Normal contract (low risk)
    c1 = Contract(
        contract_number="TEST-NORMAL-001",
        title="Normal Office Supplies Procurement",
        specification="Standard office supplies including paper, pens, and printers",
        award_date=datetime(2024, 1, 15).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_apex.id,
        estimate_value=Decimal("500000"),
        award_value=Decimal("520000"),
        tender_start=datetime(2024, 1, 1),
        tender_end=datetime(2024, 1, 10)  # 9 days window
    )
    db.add(c1); db.flush()
    # Add bids: 3 bidders
    db.add(Bid(contract_id=c1.id, vendor_name="Apex Systems India", bid_value=c1.award_value))
    db.add(Bid(contract_id=c1.id, vendor_name="Bidder A", bid_value=None))
    db.add(Bid(contract_id=c1.id, vendor_name="Bidder B", bid_value=None))
    contracts.append(c1)

    # Contract 2: Single bidder (RF-1)
    c2 = Contract(
        contract_number="TEST-SINGLE-002",
        title="Specialized Network Equipment",
        specification="High-end routers and switches for core network",
        award_date=datetime(2024, 2, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_apex.id,
        estimate_value=Decimal("2000000"),
        award_value=Decimal("2100000"),
        tender_start=datetime(2024, 1, 15),
        tender_end=datetime(2024, 1, 20)  # 5 days window
    )
    db.add(c2); db.flush()
    # Add bids: only one bidder (the winner)
    db.add(Bid(contract_id=c2.id, vendor_name="Apex Systems India", bid_value=c2.award_value))
    contracts.append(c2)

    # Contract 3: High award value (suspiciously high) - RF-5
    c3 = Contract(
        contract_number="TEST-HIGHVALUE-003",
        title="Road Construction Project",
        specification="Asphalt laying and road repair for 5km stretch",
        award_date=datetime(2024, 3, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_bharat.id,
        estimate_value=Decimal("1000000"),  # 1 million estimate
        award_value=Decimal("1400000"),     # 40% above estimate -> triggers RF-5 (>30%)
        tender_start=datetime(2024, 2, 1),
        tender_end=datetime(2024, 2, 15)    # 14 days window
    )
    db.add(c3); db.flush()
    # Add bids: 3 bidders
    db.add(Bid(contract_id=c3.id, vendor_name="Bharat Infrastructure Works", bid_value=c3.award_value))
    db.add(Bid(contract_id=c3.id, vendor_name="Bidder C", bid_value=None))
    db.add(Bid(contract_id=c3.id, vendor_name="Bidder D", bid_value=None))
    contracts.append(c3)

    # Contract 4: Vendor lock-in first contract (Public Works, vendor Apex)
    c4 = Contract(
        contract_number="TEST-LOCKIN-004",
        title="Office Furniture Purchase",
        specification="Desks and chairs for government offices",
        award_date=datetime(2024, 4, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_apex.id,
        estimate_value=Decimal("300000"),
        award_value=Decimal("310000"),
        tender_start=datetime(2024, 3, 15),
        tender_end=datetime(2024, 3, 25)   # 10 days window
    )
    db.add(c4); db.flush()
    # Add bids: 2 bidders
    db.add(Bid(contract_id=c4.id, vendor_name="Apex Systems India", bid_value=c4.award_value))
    db.add(Bid(contract_id=c4.id, vendor_name="Bidder E", bid_value=None))
    contracts.append(c4)

    # Contract 5: Vendor lock-in second contract (Public Works, vendor Apex)
    c5 = Contract(
        contract_number="TEST-LOCKIN-005",
        title="Network Maintenance Services",
        specification="Annual maintenance for network infrastructure",
        award_date=datetime(2024, 5, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_apex.id,
        estimate_value=Decimal("800000"),
        award_value=Decimal("820000"),
        tender_start=datetime(2024, 4, 10),
        tender_end=datetime(2024, 4, 20)   # 10 days window
    )
    db.add(c5); db.flush()
    # Add bids: 2 bidders
    db.add(Bid(contract_id=c5.id, vendor_name="Apex Systems India", bid_value=c5.award_value))
    db.add(Bid(contract_id=c5.id, vendor_name="Bidder F", bid_value=None))
    contracts.append(c5)

    # Contract 6: Vendor lock-in third contract (Public Works, vendor Apex)
    c6 = Contract(
        contract_number="TEST-LOCKIN-006",
        title="IT Equipment Upgrade",
        specification="Laptops and desktops for staff",
        award_date=datetime(2024, 6, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_public_works.id,
        vendor_id=vendor_apex.id,
        estimate_value=Decimal("600000"),
        award_value=Decimal("620000"),
        tender_start=datetime(2024, 5, 1),
        tender_end=datetime(2024, 5, 10)   # 9 days window
    )
    db.add(c6); db.flush()
    # Add bids: 2 bidders
    db.add(Bid(contract_id=c6.id, vendor_name="Apex Systems India", bid_value=c6.award_value))
    db.add(Bid(contract_id=c6.id, vendor_name="Bidder G", bid_value=None))
    contracts.append(c6)

    # Contract 7: Compressed tender window (RF-4)
    c7 = Contract(
        contract_number="TEST-WINDOW-007",
        title="Emergency Medical Supplies",
        specification="Purchase of syringes and gloves for clinics",
        award_date=datetime(2024, 4, 15).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_health.id,
        vendor_id=vendor_medsupply.id,
        estimate_value=Decimal("150000"),
        award_value=Decimal("160000"),
        tender_start=datetime(2024, 4, 10),
        tender_end=datetime(2024, 4, 11)   # 1 day window -> triggers RF-4 (<7 days)
    )
    db.add(c7); db.flush()
    # Add bids: 2 bidders
    db.add(Bid(contract_id=c7.id, vendor_name="MedSupply Bharat", bid_value=c7.award_value))
    db.add(Bid(contract_id=c7.id, vendor_name="Bidder H", bid_value=None))
    contracts.append(c7)

    # Contract 8: Specification tailoring (RF-7)
    # We want the specification to be very similar to the vendor's product description.
    # Vendor CivicTech product description: "municipal software citizen services data analytics platform"
    # We'll make the specification: "Procurement of a municipal software platform for citizen services and data analytics"
    c8 = Contract(
        contract_number="TEST-SPEC-008",
        title="Citizen Services Software Platform",
        specification="Procurement of a municipal software platform for citizen services and data analytics",
        award_date=datetime(2024, 5, 15).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_education.id,
        vendor_id=vendor_civictech.id,
        estimate_value=Decimal("2500000"),
        award_value=Decimal("2600000"),
        tender_start=datetime(2024, 4, 20),
        tender_end=datetime(2024, 5, 5)    # 15 days window
    )
    db.add(c8); db.flush()
    # Add bids: 3 bidders
    db.add(Bid(contract_id=c8.id, vendor_name="CivicTech Solutions", bid_value=c8.award_value))
    db.add(Bid(contract_id=c8.id, vendor_name="Bidder I", bid_value=None))
    db.add(Bid(contract_id=c8.id, vendor_name="Bidder J", bid_value=None))
    contracts.append(c8)

    # Contract 9: Unusual extensions (RF-8)
    c9 = Contract(
        contract_number="TEST-EXTENSION-009",
        title="Water Treatment Plant Expansion",
        specification="Construction of additional water treatment tanks",
        award_date=datetime(2024, 3, 1).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_digital.id,  # Note: using Digital department for variety
        vendor_id=vendor_edubuild.id,   # Using EduBuild vendor for variety
        estimate_value=Decimal("5000000"),
        award_value=Decimal("5200000"),
        tender_start=datetime(2024, 2, 1),
        tender_end=datetime(2024, 2, 20)  # 19 days window
    )
    db.add(c9); db.flush()
    # Add bids: 2 bidders
    db.add(Bid(contract_id=c9.id, vendor_name="EduBuild Projects", bid_value=c9.award_value))
    db.add(Bid(contract_id=c9.id, vendor_name="Bidder K", bid_value=None))
    # Add two extensions: each >90 days
    db.add(ContractExtension(contract_id=c9.id, extension_days=120, reason="Delay in material delivery"))
    db.add(ContractExtension(contract_id=c9.id, extension_days=100, reason="Weather-related delays"))
    contracts.append(c9)

    # Contract 10: Multiple flags (RF-1, RF-5, RF-7)
    # We'll make it: single bidder, high award value, and specification tailoring.
    # We'll use the same vendor and department as c8 but change the values.
    c10 = Contract(
        contract_number="TEST-MULTIPLE-010",
        title="Advanced Data Analytics Suite",
        specification="Procurement of an advanced data analytics platform for municipal services",
        award_date=datetime(2024, 6, 15).date(),
        category=None,
        location=None,
        procurement_method=None,
        contract_start_date=None,
        contract_end_date=None,
        department_id=dept_education.id,
        vendor_id=vendor_civictech.id,
        estimate_value=Decimal("1800000"),
        award_value=Decimal("2500000"),  # ~39% over estimate -> triggers RF-5
        tender_start=datetime(2024, 5, 20),
        tender_end=datetime(2024, 5, 31)   # 11 days window
    )
    db.add(c10); db.flush()
    # Add bids: only one bidder (the winner) -> triggers RF-1
    db.add(Bid(contract_id=c10.id, vendor_name="CivicTech Solutions", bid_value=c10.award_value))
    # We want specification tailoring: we'll set the specification to be very similar to the vendor's product description.
    # Vendor CivicTech product description: "municipal software citizen services data analytics platform"
    # We'll set specification: "Procurement of a municipal software platform for citizen services and data analytics" (same as c8) -> triggers RF-7
    # But note: we already set the specification above. We'll change it to be similar.
    c10.specification = "Procurement of a municipal software platform for citizen services and data analytics"
    contracts.append(c10)

    # Flush to get contracts in the database so they are visible for risk engine queries
    db.flush()

    # Run risk engine on each contract
    risk_engine = RiskEngine()
    for contract in contracts:
        risk_engine.analyze_contract(contract, db)

    # Commit the contracts and risk assessments
    db.commit()
    print(f"Seeded {len(contracts)} test contracts.")

if __name__ == "__main__":
    main()