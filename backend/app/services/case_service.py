import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models import InvestigationCase, CaseNote, CaseEvidence, Contract, User
from app.services.audit_service import log_audit

class CaseService:
    def __init__(self, db: Session):
        self.db = db

    def get_cases(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List investigation cases with contract, vendor, and risk metadata."""
        query = (
            self.db.query(InvestigationCase)
            .options(
                joinedload(InvestigationCase.contract).joinedload(Contract.vendor),
                joinedload(InvestigationCase.contract).joinedload(Contract.department),
                joinedload(InvestigationCase.contract).joinedload(Contract.risk_assessment),
                joinedload(InvestigationCase.assigned_to)
            )
        )
        if status:
            query = query.filter(InvestigationCase.status == status.upper())
        if priority:
            query = query.filter(InvestigationCase.priority == priority.upper())
        if assigned_to_id:
            query = query.filter(InvestigationCase.assigned_to_id == assigned_to_id)

        cases = query.order_by(InvestigationCase.updated_at.desc()).offset(offset).limit(limit).all()
        
        results = []
        for case in cases:
            c = case.contract
            crs = c.risk_assessment.crs if c and c.risk_assessment else 0
            results.append({
                "id": case.id,
                "case_number": case.case_number,
                "contract_id": case.contract_id,
                "contract_number": c.contract_number if c else "UNKNOWN",
                "title": case.title,
                "status": case.status,
                "priority": case.priority,
                "assigned_to_name": case.assigned_to_name,
                "crs": crs,
                "vendor_name": c.vendor.name if c and c.vendor else "Unknown",
                "department_name": c.department.name if c and c.department else "Unknown",
                "award_value": c.award_value if c else 0,
                "created_at": case.created_at,
                "updated_at": case.updated_at
            })
        return results

    def get_case(self, case_id: int) -> Optional[Dict[str, Any]]:
        """Get complete investigation case dossier with notes, evidence, and risk flags."""
        case = (
            self.db.query(InvestigationCase)
            .options(
                joinedload(InvestigationCase.contract).joinedload(Contract.vendor),
                joinedload(InvestigationCase.contract).joinedload(Contract.department),
                joinedload(InvestigationCase.contract).joinedload(Contract.risk_assessment),
                joinedload(InvestigationCase.contract).joinedload(Contract.risk_flags),
                joinedload(InvestigationCase.notes),
                joinedload(InvestigationCase.evidence)
            )
            .filter(InvestigationCase.id == case_id)
            .first()
        )
        if not case:
            return None

        c = case.contract
        crs = c.risk_assessment.crs if c and c.risk_assessment else 0
        risk_flags = [
            {
                "flag_id": f.flag_id,
                "severity": f.severity,
                "score": f.score,
                "explanation": f.explanation,
                "detected": f.detected
            } for f in (c.risk_flags if c else []) if f.detected
        ]

        notes = [
            {
                "id": n.id,
                "case_id": n.case_id,
                "author_name": n.author_name,
                "content": n.content,
                "created_at": n.created_at
            } for n in case.notes
        ]

        evidence = [
            {
                "id": e.id,
                "case_id": e.case_id,
                "title": e.title,
                "evidence_type": e.evidence_type,
                "description": e.description,
                "data_payload": e.data_payload,
                "created_by": e.created_by,
                "created_at": e.created_at
            } for e in case.evidence
        ]

        return {
            "id": case.id,
            "case_number": case.case_number,
            "contract_id": case.contract_id,
            "contract_number": c.contract_number if c else "UNKNOWN",
            "title": case.title,
            "status": case.status,
            "priority": case.priority,
            "assigned_to_name": case.assigned_to_name,
            "crs": crs,
            "vendor_name": c.vendor.name if c and c.vendor else "Unknown",
            "department_name": c.department.name if c and c.department else "Unknown",
            "award_value": c.award_value if c else 0,
            "notes_summary": case.notes_summary,
            "resolution_notes": case.resolution_notes,
            "created_at": case.created_at,
            "updated_at": case.updated_at,
            "notes": notes,
            "evidence": evidence,
            "risk_flags": risk_flags
        }

    def create_case(
        self,
        contract_id: int,
        title: Optional[str] = None,
        priority: str = "HIGH",
        notes_summary: str = "",
        assigned_to_id: Optional[int] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Open a new investigation case for a contract."""
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise ValueError(f"Contract with ID {contract_id} not found")

        # Check if active case already exists
        existing = (
            self.db.query(InvestigationCase)
            .filter(InvestigationCase.contract_id == contract_id, InvestigationCase.status.notin_(["CLOSED", "CLEARED"]))
            .first()
        )
        if existing:
            return self.get_case(existing.id)

        case_number = f"CASE-{datetime.now().strftime('%y%m%d')}-{contract.id:04d}"
        case_title = title or f"Investigation into Tender {contract.contract_number} ({contract.vendor.name if contract.vendor else 'Vendor'})"
        
        assigned_name = "Unassigned"
        if assigned_to_id:
            u = self.db.query(User).filter(User.id == assigned_to_id).first()
            if u:
                assigned_name = u.full_name or u.username
        elif user:
            assigned_to_id = user.id
            assigned_name = user.full_name or user.username

        new_case = InvestigationCase(
            case_number=case_number,
            contract_id=contract_id,
            title=case_title,
            status="NEW",
            priority=priority.upper(),
            assigned_to_id=assigned_to_id,
            assigned_to_name=assigned_name,
            notes_summary=notes_summary or f"Case opened automatically from risk assessment. Tender {contract.contract_number} flagged for review.",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        self.db.add(new_case)
        self.db.flush()

        # Add initial note
        initial_note = CaseNote(
            case_id=new_case.id,
            author_id=user.id if user else None,
            author_name=user.full_name or user.username if user else "System",
            content=f"Case opened. Assigned priority {priority.upper()}.",
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(initial_note)

        # Attach initial risk evidence if flags exist
        if contract.risk_flags:
            flag_summary = ", ".join([f.flag_id for f in contract.risk_flags if f.detected])
            evidence = CaseEvidence(
                case_id=new_case.id,
                title="Automated Forensic Screening Flags",
                evidence_type="SPECIFICATION_DIFF",
                description=f"Detected Red Flags: {flag_summary}",
                data_payload=json.dumps([{"flag": f.flag_id, "score": f.score, "desc": f.explanation} for f in contract.risk_flags if f.detected]),
                created_by="PARAKH Risk Engine",
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(evidence)

        self.db.commit()

        log_audit(
            db=self.db,
            action="CREATE_CASE",
            resource_type="CASE",
            resource_id=new_case.case_number,
            details={"case_number": new_case.case_number, "contract_id": contract_id, "priority": priority},
            user=user
        )

        return self.get_case(new_case.id)

    def update_case(self, case_id: int, updates: Dict[str, Any], user: Optional[User] = None) -> Optional[Dict[str, Any]]:
        """Update case status, priority, assignee, or resolution."""
        case = self.db.query(InvestigationCase).filter(InvestigationCase.id == case_id).first()
        if not case:
            return None

        old_status = case.status
        if "status" in updates and updates["status"]:
            case.status = updates["status"].upper()
        if "priority" in updates and updates["priority"]:
            case.priority = updates["priority"].upper()
        if "notes_summary" in updates:
            case.notes_summary = updates["notes_summary"]
        if "resolution_notes" in updates:
            case.resolution_notes = updates["resolution_notes"]
        if "assigned_to_id" in updates and updates["assigned_to_id"]:
            u = self.db.query(User).filter(User.id == updates["assigned_to_id"]).first()
            if u:
                case.assigned_to_id = u.id
                case.assigned_to_name = u.full_name or u.username
        elif "assigned_to_name" in updates and updates["assigned_to_name"]:
            case.assigned_to_name = updates["assigned_to_name"]

        case.updated_at = datetime.now(timezone.utc)

        # Log status transition note if status changed
        if "status" in updates and updates["status"].upper() != old_status:
            status_note = CaseNote(
                case_id=case.id,
                author_id=user.id if user else None,
                author_name=user.full_name or user.username if user else "Investigator",
                content=f"Case status changed from {old_status} to {case.status}.",
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(status_note)

        self.db.commit()

        log_audit(
            db=self.db,
            action="UPDATE_CASE",
            resource_type="CASE",
            resource_id=case.case_number,
            details=updates,
            user=user
        )

        return self.get_case(case.id)

    def add_note(self, case_id: int, content: str, author_name: Optional[str] = None, user: Optional[User] = None) -> Dict[str, Any]:
        """Add investigator note to case timeline."""
        case = self.db.query(InvestigationCase).filter(InvestigationCase.id == case_id).first()
        if not case:
            raise ValueError("Case not found")

        name = author_name or (user.full_name or user.username if user else "Investigator")
        note = CaseNote(
            case_id=case_id,
            author_id=user.id if user else None,
            author_name=name,
            content=content,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(note)
        case.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(note)

        log_audit(
            db=self.db,
            action="ADD_NOTE",
            resource_type="CASE",
            resource_id=case.case_number,
            details={"note_id": note.id, "preview": content[:100]},
            user=user
        )

        return {
            "id": note.id,
            "case_id": note.case_id,
            "author_name": note.author_name,
            "content": note.content,
            "created_at": note.created_at
        }

    def add_evidence(
        self,
        case_id: int,
        title: str,
        evidence_type: str = "DOCUMENT",
        description: str = "",
        data_payload: str = "",
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Attach evidence artifact to investigation case."""
        case = self.db.query(InvestigationCase).filter(InvestigationCase.id == case_id).first()
        if not case:
            raise ValueError("Case not found")

        author = user.full_name or user.username if user else "Investigator"
        evidence = CaseEvidence(
            case_id=case_id,
            title=title,
            evidence_type=evidence_type.upper(),
            description=description,
            data_payload=data_payload,
            created_by=author,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(evidence)
        case.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(evidence)

        log_audit(
            db=self.db,
            action="ATTACH_EVIDENCE",
            resource_type="CASE",
            resource_id=case.case_number,
            details={"evidence_id": evidence.id, "title": title, "type": evidence_type},
            user=user
        )

        return {
            "id": evidence.id,
            "case_id": evidence.case_id,
            "title": evidence.title,
            "evidence_type": evidence.evidence_type,
            "description": evidence.description,
            "data_payload": evidence.data_payload,
            "created_by": evidence.created_by,
            "created_at": evidence.created_at
        }
