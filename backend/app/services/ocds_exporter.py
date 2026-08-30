"""
Aegis Open Contracting Data Standard (OCDS v1.1) Exporter
Generates international OCDS release and record packages for public oversight and Open Contracting API integration.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
try:
    from app.services.aegis_data import TENDERS_DB, ZK_COMMITMENTS_DB
except ImportError:
    from backend.app.services.aegis_data import TENDERS_DB, ZK_COMMITMENTS_DB

class OCDSExporter:
    """
    Standard-compliant OCDS 1.1 Serializer.
    """

    @staticmethod
    def generate_release_package(ocid: str) -> Dict[str, Any]:
        if ocid not in TENDERS_DB:
            return {}
            
        t = TENDERS_DB[ocid]
        
        release = {
            "ocid": t["ocid"],
            "id": f"{t['ocid']}-RELEASE-{hashlib.sha256(t['ocid'].encode()).hexdigest()[:8]}",
            "date": datetime.now(timezone.utc).isoformat(),
            "tag": ["tender", "award", "contract", "implementation"],
            "initiationType": "tender",
            "parties": [
                {
                    "id": t["procuring_entity"]["id"],
                    "name": t["procuring_entity"]["name"],
                    "roles": ["procuringEntity", "buyer"],
                    "address": {"countryName": t["procuring_entity"].get("jurisdiction", "IN")}
                }
            ],
            "buyer": {
                "id": t["procuring_entity"]["id"],
                "name": t["procuring_entity"]["name"]
            },
            "tender": {
                "id": t["id"],
                "title": t["title"],
                "description": t["description"],
                "status": t["status"],
                "value": {
                    "amount": t["budget_ceiling"]["amount"],
                    "currency": t["budget_ceiling"]["currency"]
                },
                "tenderPeriod": {
                    "endDate": t["submission_deadline"]
                },
                "submissionMethod": ["electronicAuction", "zeroKnowledgeBlindBidding"],
                "criteria": t.get("benchmark_requirements", [])
            },
            "contracts": [
                {
                    "id": f"{t['ocid']}-CONTRACT-01",
                    "status": "active" if t.get("awarded_vendor") else "pending",
                    "value": {
                        "amount": t.get("awarded_vendor", {}).get("awarded_amount", t["budget_ceiling"]["amount"]),
                        "currency": t["budget_ceiling"]["currency"]
                    },
                    "implementation": {
                        "milestones": [
                            {
                                "id": ms["id"],
                                "title": ms["title"],
                                "type": "delivery",
                                "status": "met" if ms.get("status") == "funds_released" else "scheduled",
                                "value": {"amount": ms["allocated_amount"], "currency": ms["currency"]},
                                "telemetryVerificationType": ms.get("telemetry_type"),
                                "blockchainReleaseTx": ms.get("release_tx_hash")
                            }
                            for ms in t.get("milestones", [])
                        ]
                    }
                }
            ],
            "aegisZeroHumanDiscretionExtensions": {
                "smartContractAddress": t.get("smart_contract_address"),
                "humanDiscretionIndex": "0.00%",
                "cryptographicCommitmentLedger": "Sepolia / Permissioned Layer-2",
                "telemetryOraclesActive": True
            }
        }
        
        if t.get("awarded_vendor"):
            v = t["awarded_vendor"]
            release["parties"].append({
                "id": v["id"],
                "name": v["name"],
                "roles": ["supplier", "payee"],
                "details": {"wallet": v.get("wallet")}
            })
            release["awards"] = [{
                "id": f"{t['ocid']}-AWARD-01",
                "title": "Deterministic Algorithmic Award",
                "status": "active",
                "suppliers": [{"id": v["id"], "name": v["name"]}],
                "value": {"amount": v.get("awarded_amount"), "currency": "USD"}
            }]

        return {
            "uri": f"https://aegis-procurement.gov/api/ocds/releases/{ocid}.json",
            "version": "1.1",
            "extensions": [
                "https://raw.githubusercontent.com/open-contracting-extensions/ocds_milestone_extension/master/extension.json",
                "https://aegis-procurement.gov/schema/extensions/zero-human-discretion-v1.json"
            ],
            "publishedDate": datetime.now(timezone.utc).isoformat(),
            "publisher": {
                "name": "Aegis Zero-Human-Discretion Transparency Protocol",
                "scheme": "AEGIS-OCDS-GLOBAL"
            },
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "releases": [release]
        }
