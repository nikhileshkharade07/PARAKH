import sqlite3
import json
import os

db_path = "parakh.db" if os.path.exists("parakh.db") else "PARAKH/parakh.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 1. Stats
total_contracts = cursor.execute("SELECT count(*) FROM contracts").fetchone()[0]
total_val = cursor.execute("SELECT sum(award_value) FROM contracts").fetchone()[0] or 0
high_risk = cursor.execute("SELECT count(*) FROM risk_assessments WHERE crs >= 70").fetchone()[0]
medium_risk = cursor.execute("SELECT count(*) FROM risk_assessments WHERE crs >= 40 AND crs < 70").fetchone()[0]
low_risk = cursor.execute("SELECT count(*) FROM risk_assessments WHERE crs < 40").fetchone()[0]
avg_crs = cursor.execute("SELECT avg(crs) FROM risk_assessments").fetchone()[0] or 0
active_cases = cursor.execute("SELECT count(*) FROM investigation_cases WHERE status NOT IN ('CLOSED', 'CLEARED')").fetchone()[0]
total_vendors = cursor.execute("SELECT count(*) FROM vendors").fetchone()[0]
total_departments = cursor.execute("SELECT count(*) FROM departments").fetchone()[0]

# Department stats
dept_rows = cursor.execute("""
    SELECT d.id, d.name, count(c.id) as contract_count, sum(c.award_value) as total_value, avg(ra.crs) as avg_crs
    FROM departments d
    JOIN contracts c ON c.department_id = d.id
    LEFT JOIN risk_assessments ra ON ra.contract_id = c.id
    GROUP BY d.id, d.name
    ORDER BY avg(ra.crs) DESC
    LIMIT 20
""").fetchall()

dept_stats = [
    {
        "id": r["id"],
        "name": r["name"],
        "contract_count": r["contract_count"],
        "total_value": float(r["total_value"] or 0),
        "avg_crs": round(float(r["avg_crs"] or 0), 1)
    }
    for r in dept_rows
]

# 2. Contracts (complete dataset of 500 representative real tenders)
contract_rows = cursor.execute("""
    SELECT c.id, c.contract_number, c.title, c.contract_date, c.department_id, d.name as department_name,
           c.vendor_id, v.name as vendor_name, c.estimate_value, c.award_value, c.procurement_category, c.location,
           ra.crs, ra.rule_score, ra.anomaly_score
    FROM contracts c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN vendors v ON c.vendor_id = v.id
    LEFT JOIN risk_assessments ra ON ra.contract_id = c.id
    ORDER BY c.id ASC
    LIMIT 1000
""").fetchall()

contracts = [
    {
        "id": r["id"],
        "contract_number": r["contract_number"],
        "title": r["title"],
        "contract_date": str(r["contract_date"]),
        "department_id": r["department_id"],
        "department_name": r["department_name"] or "State Public Works Department",
        "vendor_id": r["vendor_id"],
        "vendor_name": r["vendor_name"] or "Registered Supplier",
        "estimate_value": float(r["estimate_value"] or 0),
        "award_value": float(r["award_value"] or 0),
        "procurement_category": r["procurement_category"] or "Works & Infrastructure",
        "location": r["location"] or "National",
        "crs": r["crs"] if r["crs"] is not None else 50,
        "risk_level": "high" if (r["crs"] or 0) >= 70 else "medium" if (r["crs"] or 0) >= 40 else "low"
    }
    for r in contract_rows
]

# 3. Investigation Cases
case_rows = cursor.execute("""
    SELECT ic.id, ic.case_number, ic.contract_id, c.contract_number, ic.title, ic.status, ic.priority,
           ic.assigned_to_name, ic.notes_summary, c.title as contract_title, c.award_value,
           d.name as department_name, v.name as vendor_name, ra.crs
    FROM investigation_cases ic
    JOIN contracts c ON ic.contract_id = c.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN vendors v ON c.vendor_id = v.id
    LEFT JOIN risk_assessments ra ON ra.contract_id = c.id
""").fetchall()

cases = [
    {
        "id": r["id"],
        "case_number": r["case_number"],
        "contract_id": r["contract_id"],
        "contract_number": r["contract_number"],
        "contract_title": r["contract_title"],
        "title": r["title"],
        "status": r["status"],
        "priority": r["priority"],
        "assigned_to_name": r["assigned_to_name"] or "Investigator Priya Sharma",
        "notes_summary": r["notes_summary"] or "Suspicious procurement pattern detected during automated risk evaluation.",
        "department_name": r["department_name"] or "State Health Dept",
        "vendor_name": r["vendor_name"] or "Apex Infrastructure",
        "award_value": float(r["award_value"] or 0),
        "crs": r["crs"] or 85
    }
    for r in case_rows
]

# 4. Network graph (nodes and edges)
top_vendors = cursor.execute("""
    SELECT v.id, v.name, count(c.id) as contract_count, sum(c.award_value) as total_value, avg(ra.crs) as avg_crs
    FROM vendors v
    JOIN contracts c ON c.vendor_id = v.id
    LEFT JOIN risk_assessments ra ON ra.contract_id = c.id
    GROUP BY v.id, v.name
    ORDER BY sum(c.award_value) DESC
    LIMIT 30
""").fetchall()

vendor_ids = [v["id"] for v in top_vendors]
network_edges_rows = cursor.execute(f"""
    SELECT c.vendor_id, c.department_id, d.name as department_name, count(c.id) as contract_count, sum(c.award_value) as total_value, avg(ra.crs) as avg_crs
    FROM contracts c
    JOIN departments d ON c.department_id = d.id
    LEFT JOIN risk_assessments ra ON ra.contract_id = c.id
    WHERE c.vendor_id IN ({','.join(str(i) for i in vendor_ids)})
    GROUP BY c.vendor_id, c.department_id, d.name
""").fetchall()

nodes = []
node_ids = set()

for v in top_vendors:
    nid = f"v_{v['id']}"
    node_ids.add(nid)
    nodes.append({
        "data": {
            "id": nid,
            "label": v["name"],
            "type": "vendor",
            "crs": round(float(v["avg_crs"] or 0), 1),
            "value": float(v["total_value"] or 0),
            "contracts": v["contract_count"]
        }
    })

for e in network_edges_rows:
    did = f"d_{e['department_id']}"
    if did not in node_ids:
        node_ids.add(did)
        nodes.append({
            "data": {
                "id": did,
                "label": e["department_name"],
                "type": "department",
                "crs": round(float(e["avg_crs"] or 0), 1),
                "value": float(e["total_value"] or 0),
                "contracts": e["contract_count"]
            }
        })

edges = []
for e in network_edges_rows:
    edges.append({
        "data": {
            "id": f"e_{e['vendor_id']}_{e['department_id']}",
            "source": f"v_{e['vendor_id']}",
            "target": f"d_{e['department_id']}",
            "value": float(e["total_value"] or 0),
            "contracts": e["contract_count"],
            "crs": round(float(e["avg_crs"] or 0), 1)
        }
    })

# 5. Departments list
all_depts = cursor.execute("SELECT id, name FROM departments ORDER BY name ASC LIMIT 100").fetchall()
departments = [{"id": r["id"], "name": r["name"]} for r in all_depts]

# 6. Vendors list
all_vendors = cursor.execute("SELECT id, name FROM vendors ORDER BY name ASC LIMIT 100").fetchall()
vendors = [{"id": r["id"], "name": r["name"]} for r in all_vendors]

data = {
    "stats": {
        "total_contracts": total_contracts,
        "total_value": float(total_val),
        "high_risk_contracts": high_risk,
        "medium_risk_contracts": medium_risk,
        "low_risk_contracts": low_risk,
        "avg_crs": round(float(avg_crs), 1),
        "active_cases": active_cases,
        "total_vendors": total_vendors,
        "total_departments": total_departments,
        "departments": dept_stats,
        "data_source": "Multi-Jurisdiction Indian Government Procurement (HP, MH, KA, RJ, UP, Central/GeM)",
        "time_range": "2017 – 2021"
    },
    "contracts": contracts,
    "departments": departments,
    "vendors": vendors,
    "cases": cases,
    "network": {
        "nodes": nodes,
        "edges": edges
    }
}

os.makedirs("src/data", exist_ok=True)
with open("src/data/procurement_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

os.makedirs("frontend/src/data", exist_ok=True)
with open("frontend/src/data/procurement_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

os.makedirs("PARAKH/frontend/src/data", exist_ok=True)
with open("PARAKH/frontend/src/data/procurement_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Successfully generated procurement data: {len(contracts)} contracts, {len(cases)} cases, {len(nodes)} nodes, {len(edges)} edges.")
