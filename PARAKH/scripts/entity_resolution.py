"""
scripts/entity_resolution.py
-----------------------------
Conservative Entity Resolution Engine for Indian Public Procurement.
Standardizes supplier, contractor, department, and procuring entity names
while computing entity resolution confidence scores and alias mappings.
"""

import re
import hashlib
import unicodedata
from typing import Dict, Tuple, Optional, Set, List


# Standard Indian corporate legal suffix normalization map
LEGAL_SUFFIX_MAP = {
    r"\bpvt\.?\s*ltd\.?\b": "PRIVATE LIMITED",
    r"\bpvt\s+limited\b": "PRIVATE LIMITED",
    r"\bprivate\s+ltd\.?\b": "PRIVATE LIMITED",
    r"\bprivate\s+limited\b": "PRIVATE LIMITED",
    r"\bltd\.?\b": "LIMITED",
    r"\blimited\b": "LIMITED",
    r"\bllp\.?\b": "LLP",
    r"\binc\.?\b": "INC",
    r"\bcorp\.?\b": "CORP",
    r"\bco-op\.?\b": "COOPERATIVE",
    r"\bcoop\.?\b": "COOPERATIVE",
    r"\bco\.?\b": "COMPANY",
    r"\bcompany\b": "COMPANY",
    r"\bgovt\.?\s*contractor\b": "GOVERNMENT CONTRACTOR",
    r"\bgovt\s+contractors\b": "GOVERNMENT CONTRACTOR",
    r"\bcontractor\b": "CONTRACTOR",
    r"\bcontractors\b": "CONTRACTOR",
    r"\bengg\.?\b": "ENGINEERING",
    r"\benterprises\b": "ENTERPRISE",
    r"\benterprise\b": "ENTERPRISE",
    r"\bassoc\.?\b": "ASSOCIATES",
    r"\bassociates\b": "ASSOCIATES",
    r"\binfra\.?\b": "INFRASTRUCTURE",
    r"\bconstructions?\b": "CONSTRUCTION",
    r"\btech\.?\b": "TECHNOLOGY",
    r"\btechnologies\b": "TECHNOLOGY",
}

# Standard Indian government department titles
DEPT_TITLE_MAP = {
    r"\bhppwd\b": "HIMACHAL PRADESH PUBLIC WORKS DEPARTMENT",
    r"\bpwd\b": "PUBLIC WORKS DEPARTMENT",
    r"\bhpiph\b": "HIMACHAL PRADESH IRRIGATION AND PUBLIC HEALTH",
    r"\biph\b": "IRRIGATION AND PUBLIC HEALTH",
    r"\bjal\s+shakti\s+vibh?ag\b": "JAL SHAKTI DEPARTMENT",
    r"\bhealth\s+&\s+family\s+welfare\b": "HEALTH AND FAMILY WELFARE",
    r"\bhealth\s+and\s+family\s+welfare\b": "HEALTH AND FAMILY WELFARE",
    r"\bdit\b": "DEPARTMENT OF INFORMATION TECHNOLOGY",
    r"\bdoit\b": "DEPARTMENT OF INFORMATION TECHNOLOGY",
    r"\bfdc\b": "FOREST DEVELOPMENT CORPORATION",
    r"\bmc\s+shimla\b": "MUNICIPAL CORPORATION SHIMLA",
    r"\bee\s+rb\b": "EXECUTIVE ENGINEER ROADS AND BUILDINGS",
    r"\bee\b": "EXECUTIVE ENGINEER",
    r"\bdm\b": "DIVISIONAL MANAGER",
    r"\bxen\b": "EXECUTIVE ENGINEER",
    r"\bse\b": "SUPERINTENDING ENGINEER",
    r"\bce\b": "CHIEF ENGINEER",
}


def clean_text_base(text: str) -> str:
    """Strip unicode anomalies, punctuation, and multiple spaces."""
    if not text:
        return ""
    # Normalize unicode
    s = unicodedata.normalize("NFKD", str(text))
    # Uppercase
    s = s.upper().strip()
    # Replace separators with space
    s = re.sub(r"[\.,\-_\/\\|:;()&]+", " ", s)
    # Collapse multiple whitespaces
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_supplier_entity(raw_name: str) -> Tuple[str, str, float]:
    """
    Standardize a supplier/vendor legal identity string.
    Returns (normalized_name, entity_id, resolution_confidence).
    """
    if not raw_name or raw_name.strip() == "" or str(raw_name).lower() == "nan":
        return "UNKNOWN SUPPLIER", "ENT-SUP-UNKNOWN", 0.0

    raw_clean = clean_text_base(raw_name)
    s = raw_clean
    confidence = 1.0

    # Match and standardize legal suffix
    matched_legal = False
    for pat, rep in LEGAL_SUFFIX_MAP.items():
        if re.search(pat, s, re.IGNORECASE):
            s = re.sub(pat, rep, s, flags=re.IGNORECASE)
            matched_legal = True

    s = re.sub(r"\s+", " ", s).strip()

    # If minor transformations occurred
    if s != raw_clean:
        confidence = 0.95 if matched_legal else 0.90
    else:
        confidence = 1.0

    # Deterministic entity ID based on normalized canonical string
    core_name = re.sub(r"\b(PRIVATE LIMITED|LIMITED|LLP|COMPANY|GOVERNMENT CONTRACTOR|CONTRACTOR|ENTERPRISE|ASSOCIATES)\b", "", s).strip()
    core_name = re.sub(r"\s+", " ", core_name).strip()
    if not core_name:
        core_name = s

    hash_digest = hashlib.sha256(core_name.encode("utf-8")).hexdigest()[:10].upper()
    entity_id = f"ENT-SUP-{hash_digest}"

    return s, entity_id, round(confidence, 2)


def normalize_department_entity(raw_name: str, state_prefix: Optional[str] = None) -> Tuple[str, str, float]:
    """
    Standardize a government procuring entity / department name.
    Returns (normalized_name, entity_id, resolution_confidence).
    """
    if not raw_name or raw_name.strip() == "" or str(raw_name).lower() == "nan":
        return "GENERAL PUBLIC PROCURING ENTITY", "ENT-DEPT-GENERAL", 0.0

    raw_clean = clean_text_base(raw_name)
    s = raw_clean
    confidence = 1.0

    # Expand standard department acronyms
    for pat, rep in DEPT_TITLE_MAP.items():
        if re.search(pat, s, re.IGNORECASE):
            s = re.sub(pat, rep, s, flags=re.IGNORECASE)
            confidence = 0.95

    s = re.sub(r"\s+", " ", s).strip()

    # Core canonical identifier
    hash_digest = hashlib.sha256(s.encode("utf-8")).hexdigest()[:10].upper()
    entity_id = f"ENT-DEPT-{hash_digest}"

    return s, entity_id, round(confidence, 2)


class EntityClusterResolver:
    """In-memory alias manager for tracking multi-alias entity clusters."""

    def __init__(self):
        self.supplier_clusters: Dict[str, Set[str]] = {}
        self.entity_lookup: Dict[str, str] = {}

    def register_supplier(self, raw_name: str) -> Dict[str, any]:
        norm_name, entity_id, conf = normalize_supplier_entity(raw_name)
        if entity_id not in self.supplier_clusters:
            self.supplier_clusters[entity_id] = set()
        self.supplier_clusters[entity_id].add(raw_name)
        self.entity_lookup[raw_name] = entity_id

        return {
            "original_name": raw_name,
            "normalized_name": norm_name,
            "entity_id": entity_id,
            "confidence": conf,
            "alias_count": len(self.supplier_clusters[entity_id])
        }

    def get_aliases(self, entity_id: str) -> List[str]:
        return sorted(list(self.supplier_clusters.get(entity_id, set())))
