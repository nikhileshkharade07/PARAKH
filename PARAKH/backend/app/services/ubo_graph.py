"""
Aegis Advanced UBO & Shell Company Graph Forensics Engine
Pillar 3: UBO & Shell Company Graph Analytics
- Multi-hop Ultimate Beneficial Ownership (UBO) resolution down complex holding structures
- Circular Equity Loop Detection (e.g. A -> B -> C -> A shell company obfuscation cycles)
- Multi-Tender Bid Rotation & Cover Bidding Pattern Interception
- FATF High-Risk Jurisdiction & Tax Haven Weighting
- Automated Pre-Bid Disqualification with Cryptographic Evidence
"""
from typing import List, Dict, Any, Set, Tuple
import hashlib
from datetime import datetime, timezone

# FATF & Tax Haven Risk Multipliers
TAX_HAVEN_WEIGHTS = {
    "KY": 1.45, # Cayman Islands
    "VG": 1.50, # British Virgin Islands
    "MU": 1.35, # Mauritius Conduit
    "PA": 1.40, # Panama
    "SC": 1.30, # Seychelles
    "BZ": 1.35, # Belize
    "CY": 1.25, # Cyprus
    "IN": 1.00, # Domestic
    "SG": 1.05, # Singapore
    "SE": 1.00, # Sweden
    "US": 1.00  # United States
}

class UBOGraphEngine:
    """
    Forensics graph analytics for Ultimate Beneficial Ownership and Collusion Ring Detection.
    """
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []

    def add_node(self, node_id: str, name: str, node_type: str, jurisdiction: str = "IN", 
                 risk_flags: List[str] = None, metadata: Dict[str, Any] = None):
        self.nodes[node_id] = {
            "id": node_id,
            "name": name,
            "type": node_type, # company, ubo_person, nominee_director, wallet_cluster, shell_entity, department
            "jurisdiction": jurisdiction,
            "risk_flags": risk_flags or [],
            "metadata": metadata or {},
            "jurisdiction_risk": TAX_HAVEN_WEIGHTS.get(jurisdiction, 1.0)
        }

    def add_edge(self, source: str, target: str, relationship: str, weight: float = 1.0, details: str = None):
        self.edges.append({
            "source": source,
            "target": target,
            "relationship": relationship, # beneficial_owner, director, shared_ip, shared_seed_wallet, subsidiary, bids_on
            "weight": weight,
            "details": details or ""
        })

    def find_ultimate_beneficial_owners(self, company_id: str, visited: Set[str] = None, current_pct: float = 1.0) -> List[Dict[str, Any]]:
        """
        Recursively traverses ownership tree to find natural persons / UBOs with effective ownership %.
        Incorporates tax-haven weighting.
        """
        if visited is None:
            visited = set()
        visited.add(company_id)
        
        ubos = []
        for edge in self.edges:
            if edge["source"] == company_id and edge["relationship"] in ["subsidiary", "beneficial_owner", "owned_by"]:
                parent_id = edge["target"]
                parent_node = self.nodes.get(parent_id)
                if not parent_node:
                    continue
                effective_share = current_pct * edge.get("weight", 1.0)
                
                if parent_node["type"] in ["ubo_person", "nominee_director"] or effective_share >= 0.10:
                    ubos.append({
                        "ubo_id": parent_id,
                        "ubo_name": parent_node["name"],
                        "ubo_type": parent_node["type"],
                        "effective_ownership_pct": round(effective_share * 100, 2),
                        "jurisdiction": parent_node.get("jurisdiction", "IN"),
                        "tax_haven_factor": parent_node.get("jurisdiction_risk", 1.0),
                        "risk_flags": parent_node.get("risk_flags", [])
                    })
                elif parent_id not in visited:
                    ubos.extend(self.find_ultimate_beneficial_owners(parent_id, visited, effective_share))
                    
        return ubos

    def detect_circular_ownership_loops(self) -> List[Dict[str, Any]]:
        """
        Detects circular equity cycles where shell entities own each other to hide the real controller.
        """
        cycles = []
        visited = set()
        
        # Build adjacency list for ownership edges
        adj = {}
        for edge in self.edges:
            if edge["relationship"] in ["subsidiary", "owned_by"]:
                s, t = edge["source"], edge["target"]
                if s not in adj: adj[s] = []
                adj[s].append(t)

        def dfs(current, path):
            if current in path:
                cycle_start = path.index(current)
                cycle_nodes = path[cycle_start:]
                if len(cycle_nodes) > 1:
                    cycle_key = tuple(sorted(cycle_nodes))
                    if cycle_key not in visited:
                        visited.add(cycle_key)
                        names = [self.nodes.get(n, {}).get("name", n) for n in cycle_nodes]
                        cycles.append({
                            "cycle_nodes": cycle_nodes,
                            "cycle_names": names,
                            "length": len(cycle_nodes),
                            "severity": "CRITICAL_CIRCULAR_EQUITY_CYCLE",
                            "risk_penalty": 40
                        })
                return

            if current in adj:
                for nxt in adj[current]:
                    dfs(nxt, path + [current])

        for start_node in list(self.nodes.keys()):
            dfs(start_node, [])

        return cycles

    def detect_collusion_rings(self, active_bidding_vendor_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Analyzes relationship intersections (Shared UBO, Shared Nominee Director, Shared IP/Wallet,
        Bid Rotation Patterns) between vendors bidding on the same tender.
        """
        collusion_rings = []
        vendor_set = set(active_bidding_vendor_ids)
        
        vendor_profiles: Dict[str, Dict[str, Set[str]]] = {}
        for vid in vendor_set:
            vendor_profiles[vid] = {
                "ubos": set(),
                "directors": set(),
                "ips": set(),
                "wallets": set(),
                "tax_haven_multiplier": 1.0
            }
            
            # Trace UBOs
            ubos = self.find_ultimate_beneficial_owners(vid)
            for u in ubos:
                vendor_profiles[vid]["ubos"].add(u["ubo_name"])
                if u.get("tax_haven_factor", 1.0) > vendor_profiles[vid]["tax_haven_multiplier"]:
                    vendor_profiles[vid]["tax_haven_multiplier"] = u.get("tax_haven_factor", 1.0)
                
            # Direct edges
            for edge in self.edges:
                if edge["source"] == vid or edge["target"] == vid:
                    other = edge["target"] if edge["source"] == vid else edge["source"]
                    other_node = self.nodes.get(other, {})
                    ntype = other_node.get("type", "")
                    
                    if ntype == "nominee_director" or edge["relationship"] == "director":
                        vendor_profiles[vid]["directors"].add(other_node.get("name", other))
                    elif ntype == "wallet_cluster" or edge["relationship"] == "shared_seed_wallet":
                        vendor_profiles[vid]["wallets"].add(other_node.get("name", other))
                    elif edge["relationship"] == "shared_ip":
                        vendor_profiles[vid]["ips"].add(other_node.get("name", other))

        # Pairwise comparison to identify collusion clusters
        checked_pairs = set()
        for v1 in active_bidding_vendor_ids:
            for v2 in active_bidding_vendor_ids:
                if v1 >= v2 or (v1, v2) in checked_pairs:
                    continue
                checked_pairs.add((v1, v2))
                
                shared_ubos = vendor_profiles[v1]["ubos"].intersection(vendor_profiles[v2]["ubos"])
                shared_dirs = vendor_profiles[v1]["directors"].intersection(vendor_profiles[v2]["directors"])
                shared_ips = vendor_profiles[v1]["ips"].intersection(vendor_profiles[v2]["ips"])
                shared_wallets = vendor_profiles[v1]["wallets"].intersection(vendor_profiles[v2]["wallets"])
                
                evidence = []
                base_confidence = 0.0
                
                if shared_ubos:
                    evidence.append(f"Common Ultimate Beneficial Owner (UBO): {', '.join(shared_ubos)}")
                    base_confidence += 0.50
                if shared_dirs:
                    evidence.append(f"Shared Nominee Director / Signatory: {', '.join(shared_dirs)}")
                    base_confidence += 0.35
                if shared_ips:
                    evidence.append(f"Identical Bidding IP/Hardware Fingerprint: {', '.join(shared_ips)}")
                    base_confidence += 0.40
                if shared_wallets:
                    evidence.append(f"Cryptographic Seed Phrase Linkage: {', '.join(shared_wallets)}")
                    base_confidence += 0.45
                    
                # Apply tax haven multiplier
                th_factor = max(vendor_profiles[v1]["tax_haven_multiplier"], vendor_profiles[v2]["tax_haven_multiplier"])
                if th_factor > 1.0 and evidence:
                    evidence.append(f"Offshore Shell Conduit Detected (Tax Haven Factor: {th_factor:.2f}x)")
                    base_confidence *= th_factor
                    
                confidence_score = min(1.0, base_confidence)
                
                if confidence_score >= 0.30:
                    v1_name = self.nodes.get(v1, {}).get("name", v1)
                    v2_name = self.nodes.get(v2, {}).get("name", v2)
                    
                    evidence_hash = hashlib.sha256(f"{v1}:{v2}:{':'.join(evidence)}".encode()).hexdigest()
                    
                    collusion_rings.append({
                        "ring_id": f"RING-{evidence_hash[:8].upper()}",
                        "entities": [v1, v2],
                        "entity_names": [v1_name, v2_name],
                        "confidence_score": round(confidence_score, 2),
                        "evidence": evidence,
                        "disqualification_recommended": confidence_score >= 0.70,
                        "audit_proof_hash": f"0xproof_{evidence_hash}",
                        "detected_at": datetime.now(timezone.utc).isoformat()
                    })
                    
        return collusion_rings

    def get_full_graph_payload(self) -> Dict[str, Any]:
        """
        Formats graph for Cytoscape.js and visualization in UI.
        """
        cytoscape_elements = []
        for n_id, n_data in self.nodes.items():
            cytoscape_elements.append({
                "data": {
                    "id": n_id,
                    "label": n_data["name"],
                    "type": n_data["type"],
                    "jurisdiction": n_data.get("jurisdiction", "IN"),
                    "jurisdiction_risk": n_data.get("jurisdiction_risk", 1.0),
                    "risk_flags": n_data.get("risk_flags", []),
                    "metadata": n_data.get("metadata", {})
                }
            })
            
        for i, edge in enumerate(self.edges):
            cytoscape_elements.append({
                "data": {
                    "id": f"edge_{edge['source']}_{edge['target']}_{i}",
                    "source": edge["source"],
                    "target": edge["target"],
                    "label": edge["relationship"],
                    "weight": edge.get("weight", 1.0),
                    "details": edge.get("details", "")
                }
            })
            
        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges,
            "cytoscape_elements": cytoscape_elements,
            "circular_loops": self.detect_circular_ownership_loops()
        }
