import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.models import Contract, Vendor, Department, RiskAssessment, RiskFlag, Bid, InvestigationCase
from app.schemas.assistant import AssistantQueryResponse, EvidenceCitation

class AssistantService:
    def __init__(self, db: Session):
        self.db = db

    def query(self, user_query: str, contract_id: Optional[int] = None) -> AssistantQueryResponse:
        """Analyze investigator query against actual database evidence and return grounded forensic answer."""
        q = user_query.lower().strip()
        citations: List[EvidenceCitation] = []
        answer = ""

        # Pattern 1: Specific contract investigation (e.g., "GEM-DEMO-000007" or ID or context)
        contract_match = re.search(r"gem-demo-\d+|imp-\d+-\d+|contract\s*#?\s*(\d+)|tender\s*#?\s*(\d+)", q)
        target_contract = None
        
        if contract_id:
            target_contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        elif contract_match:
            term = contract_match.group(0).upper()
            if term.isdigit():
                target_contract = self.db.query(Contract).filter(Contract.id == int(term)).first()
            else:
                target_contract = self.db.query(Contract).filter(Contract.contract_number.ilike(f"%{term}%")).first()

        if target_contract:
            c = target_contract
            crs = c.risk_assessment.crs if c.risk_assessment else 0
            flags = [f for f in c.risk_flags if f.detected]
            
            flag_bullets = "\n".join([f"- **[{f.flag_id}]** {f.explanation} (Severity: {f.severity.upper()}, Contribution: +{int(f.score)})" for f in flags])
            
            answer = (
                f"### Forensic Audit for Tender **{c.contract_number}**\n\n"
                f"- **Title**: {c.title}\n"
                f"- **Department**: {c.department.name if c.department else 'N/A'}\n"
                f"- **Winning Vendor**: {c.vendor.name if c.vendor else 'N/A'}\n"
                f"- **Corruption Risk Score (CRS)**: **{crs}/100** ({'CRITICAL' if crs >= 80 else 'HIGH' if crs >= 60 else 'MEDIUM' if crs >= 30 else 'LOW'})\n"
                f"- **Rule Score**: {c.risk_assessment.rule_score if c.risk_assessment else 0:.0f} | **Statistical Anomaly Score**: {c.risk_assessment.anomaly_score if c.risk_assessment else 0:.1f}\n\n"
                f"**Detected Heuristic Flags:**\n{flag_bullets if flag_bullets else '- No heuristic red flags detected.'}\n\n"
                f"**Key Metrics:**\n"
                f"- Awarded Value: ₹{c.award_value:,.2f} vs Estimate: ₹{c.estimate_value:,.2f}\n"
                f"- Total Bidders: {len(c.bids)}\n"
                f"- Tender Window: {(c.tender_end - c.tender_start).total_seconds() / 86400:.1f} days\n"
                f"- Extensions: {len(c.extensions)} uncompetitive extensions"
            )
            citations.append(EvidenceCitation(
                title=f"Tender {c.contract_number}",
                citation_type="CONTRACT",
                reference_id=c.contract_number,
                summary=f"CRS {crs}/100 | {len(flags)} Red Flags | Value ₹{c.award_value:,.0f}",
                link=f"/contracts/{c.id}"
            ))
            return AssistantQueryResponse(query=user_query, answer=answer, citations=citations)

        # Pattern 2: High win rates / suspicious vendors
        if "vendor" in q and ("win" in q or "rate" in q or "suspicious" in q or "monopoly" in q or "lock" in q or "winner" in q):
            vendors = self.db.query(Vendor).all()
            vendor_stats = []
            for v in vendors:
                cs = v.contracts
                if not cs:
                    continue
                scores = [c.risk_assessment.crs for c in cs if c.risk_assessment]
                avg_crs = sum(scores) / len(scores) if scores else 0
                total_val = sum(float(c.award_value) for c in cs)
                vendor_stats.append((v, len(cs), total_val, avg_crs))
            
            vendor_stats.sort(key=lambda x: (x[3], x[1]), reverse=True)
            top_vendors = vendor_stats[:5]

            lines = []
            for v, count, val, avg_crs in top_vendors:
                lines.append(f"1. **{v.name}**: Won **{count} contracts** totaling **₹{val:,.0f}** | Avg CRS: **{avg_crs:.1f}**")
                citations.append(EvidenceCitation(
                    title=v.name,
                    citation_type="VENDOR",
                    reference_id=str(v.id),
                    summary=f"{count} contracts won | Avg CRS {avg_crs:.1f}",
                    link=f"/vendors/{v.id}"
                ))

            answer = (
                f"### High-Risk & High-Volume Vendors Analysis\n\n"
                f"Based on the analyzed contracts in the database, the following suppliers exhibit the highest risk profiles and contract concentrations:\n\n"
                + "\n".join(lines) + "\n\n"
                f"**Forensic Note**: High repeat win rates in specific departments with single-bidder tenders indicate potential vendor lock-in (RF-2) and repeat winner collusion patterns (RF-6)."
            )
            return AssistantQueryResponse(query=user_query, answer=answer, citations=citations)

        # Pattern 3: Departments with suspicious concentration
        if "department" in q or "ministry" in q or "concentration" in q or "collusion" in q:
            departments = self.db.query(Department).all()
            dept_stats = []
            for d in departments:
                cs = d.contracts
                if not cs:
                    continue
                scores = [c.risk_assessment.crs for c in cs if c.risk_assessment]
                high_count = sum(s >= 70 for s in scores)
                avg_crs = sum(scores) / len(scores) if scores else 0
                dept_stats.append((d, len(cs), high_count, avg_crs))

            dept_stats.sort(key=lambda x: (x[2], x[3]), reverse=True)
            lines = []
            for d, total, high, avg_crs in dept_stats[:5]:
                lines.append(f"- **{d.name}**: {high} high-risk contracts out of {total} total (Avg CRS: {avg_crs:.1f})")
                citations.append(EvidenceCitation(
                    title=d.name,
                    citation_type="DEPARTMENT",
                    reference_id=str(d.id),
                    summary=f"{high}/{total} High-Risk Tenders | Avg CRS {avg_crs:.1f}",
                    link=f"/departments/{d.id}"
                ))

            answer = (
                f"### Departmental Risk & Vendor Concentration Overview\n\n"
                f"The following government departments show the highest concentration of anomalous tenders and heuristic red flags:\n\n"
                + "\n".join(lines) + "\n\n"
                f"**Recommendation**: Initiate targeted audit sampling on single-bidder and threshold-split contracts in these departments."
            )
            return AssistantQueryResponse(query=user_query, answer=answer, citations=citations)

        # Pattern 4: Single bidder + short tender window
        if "single bidder" in q or "one bidder" in q or "short" in q or "compressed" in q or "rf-1" in q or "rf-4" in q:
            contracts = (
                self.db.query(Contract)
                .join(RiskAssessment)
                .order_by(RiskAssessment.crs.desc())
                .limit(100)
                .all()
            )
            matching = []
            for c in contracts:
                flag_ids = [f.flag_id for f in c.risk_flags if f.detected]
                if "RF-1" in flag_ids and "RF-4" in flag_ids:
                    matching.append(c)

            lines = []
            for c in matching[:5]:
                crs = c.risk_assessment.crs if c.risk_assessment else 0
                dur = (c.tender_end - c.tender_start).total_seconds() / 86400
                lines.append(f"- **{c.contract_number}** ({c.vendor.name if c.vendor else 'Vendor'}): Window open for only **{dur:.1f} days**, **1 bidder** (Award: ₹{c.award_value:,.0f}, CRS: **{crs}**)")
                citations.append(EvidenceCitation(
                    title=f"Tender {c.contract_number}",
                    citation_type="CONTRACT",
                    reference_id=c.contract_number,
                    summary=f"Single Bidder + {dur:.1f} Day Window | CRS {crs}",
                    link=f"/contracts/{c.id}"
                ))

            answer = (
                f"### Tenders with Single Bidder & Compressed Submission Windows (RF-1 + RF-4)\n\n"
                f"Found **{len(matching)} contracts** exhibiting the classic fast-track single-bidder risk pattern:\n\n"
                + ("\n".join(lines) if lines else "- No exact RF-1 + RF-4 combo matches found in the current dataset.") + "\n\n"
                f"**Investigation Tip**: A tender window under 7 days with only one bidder strongly suggests the procurement was tailored or concealed from competing bidders."
            )
            return AssistantQueryResponse(query=user_query, answer=answer, citations=citations)

        # Default fallback summary
        total_contracts = self.db.query(Contract).count()
        high_risk = self.db.query(RiskAssessment).filter(RiskAssessment.crs >= 70).count()
        cases_count = self.db.query(InvestigationCase).count()

        answer = (
            f"### PARAKH System Investigation Summary\n\n"
            f"The database currently holds **{total_contracts:,} procurement contracts**, with **{high_risk} contracts** classified as **High Risk (CRS ≥ 70)** and **{cases_count} active investigation cases**.\n\n"
            f"You can ask me questions such as:\n"
            f"- *\"Why is tender GEM-DEMO-000007 high risk?\"*\n"
            f"- *\"Which vendors have unusually high win rates?\"*\n"
            f"- *\"Show departments with suspicious vendor concentration.\"*\n"
            f"- *\"Which tenders had one bidder and unusually short submission windows?\"*\n"
            f"- *\"Show contracts with high price deviations.\"*"
        )
        return AssistantQueryResponse(query=user_query, answer=answer, citations=citations)
