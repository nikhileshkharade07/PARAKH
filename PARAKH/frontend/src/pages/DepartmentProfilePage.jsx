import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function DepartmentProfilePage() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDepartment() {
      try {
        const [dRes, cRes] = await Promise.all([
          api.get(`/departments/${id}`),
          api.get(`/contracts?department_id=${id}&limit=100`)
        ]);
        setDepartment(dRes.data);
        setContracts(cRes.data);
      } catch (err) {
        console.error("Error loading department profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDepartment();
  }, [id]);

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract Number", "Title", "Winning Vendor", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map(c => [
      c.contract_number,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.vendor_name || ''}"`,
      c.award_value,
      c.crs || 0,
      c.risk_level || ''
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `department-${department.name.toLowerCase().replace(/\s+/g, '-')}-contracts.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner">Loading department profile...</div>;
  if (!department) return <div className="card">Department not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  // Group contracts by vendor
  const vendorWinCounts = {};
  contracts.forEach(c => {
    const vName = c.vendor_name || "Unknown Vendor";
    vendorWinCounts[vName] = (vendorWinCounts[vName] || 0) + 1;
  });

  const COLORS = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#2dd4bf"];
  const vendorPieData = Object.entries(vendorWinCounts).map(([name, count], idx) => ({
    name,
    value: count,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">DEPARTMENT AUDIT PROFILE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{department.name}</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Procurement expenditure, vendor concentration, risk profile, and issued tenders.
          </p>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>
          📊 Export Department Dossier (CSV)
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Contracts Issued</div>
          <div className="kpi-value">{department.total_contracts}</div>
          <div className="kpi-sub">Total procurement tenders</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Budget Spent</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatINR(department.total_value)}</div>
          <div className="kpi-sub">Total value awarded</div>
        </div>

        <div className="kpi-card" style={{ borderColor: department.vendor_concentration > 0.5 ? "var(--risk-high-border)" : "var(--border-color)" }}>
          <div className="kpi-label">Vendor Concentration</div>
          <div className="kpi-value" style={{ color: department.vendor_concentration > 0.5 ? "var(--risk-high)" : "#fff" }}>
            {(department.vendor_concentration * 100).toFixed(0)}%
          </div>
          <div className="kpi-sub">Top vendor award dominance (RF-2)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average Department CRS</div>
          <div className="kpi-value">{department.average_crs?.toFixed(1) || 0} / 100</div>
          <div className="kpi-sub">Average risk score</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Vendor Share Distribution</div>
          <div style={{ height: 220, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vendorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {vendorPieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#172033", borderColor: "#1e293b", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", fontSize: 12 }}>
            {vendorPieData.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
                <span>{v.name}: <strong>{v.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Lock-in & Concentration Analysis</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Vendor Lock-in Heuristic (RF-2)</strong> flags departments where a single supplier wins more than 60% of all issued tenders.
            </p>
            <div style={{ padding: 14, borderRadius: 8, background: department.vendor_concentration > 0.6 ? "var(--risk-high-bg)" : "var(--risk-low-bg)", border: `1px solid ${department.vendor_concentration > 0.6 ? "var(--risk-high-border)" : "var(--risk-low-border)"}` }}>
              <strong style={{ color: department.vendor_concentration > 0.6 ? "var(--risk-high)" : "var(--risk-low)" }}>
                {department.vendor_concentration > 0.6 ? "⚠️ High Vendor Concentration Detected" : "✓ Healthy Vendor Competition"}
              </strong>
              <p style={{ fontSize: 13, marginTop: 4, margin: 0 }}>
                Top vendor captured {(department.vendor_concentration * 100).toFixed(1)}% of all contracts in this department.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Issued Procurement Contracts ({contracts.length})</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract No.</th>
                <th>Title</th>
                <th>Winning Vendor</th>
                <th>Award Value</th>
                <th>CRS Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono">{c.contract_number}</td>
                  <td>
                    <Link to={`/contracts/${c.id}`} style={{ fontWeight: 600, color: "#fff" }}>{c.title}</Link>
                  </td>
                  <td>
                    <Link to={`/vendors/${c.vendor_id}`}>{c.vendor_name}</Link>
                  </td>
                  <td className="font-mono">{formatINR(c.award_value)}</td>
                  <td>
                    <span className={`risk-badge ${c.risk_level}`}>CRS {c.crs}</span>
                  </td>
                  <td>
                    <Link to={`/contracts/${c.id}`} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Inspect</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
