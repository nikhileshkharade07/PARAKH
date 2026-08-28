import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function VendorProfilePage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendor() {
      try {
        const [vRes, cRes] = await Promise.all([
          api.get(`/vendors/${id}`),
          api.get(`/contracts?vendor_id=${id}&limit=100`)
        ]);
        setVendor(vRes.data);
        setContracts(cRes.data);
      } catch (err) {
        console.error("Error loading vendor profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVendor();
  }, [id]);

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract Number", "Title", "Department", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map(c => [
      c.contract_number,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.department_name || ''}"`,
      c.award_value,
      c.crs || 0,
      c.risk_level || ''
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor-${vendor.name.toLowerCase().replace(/\s+/g, '-')}-contracts.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner">Loading vendor profile...</div>;
  if (!vendor) return <div className="card">Vendor not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  // Group contracts by risk for chart
  const riskGroups = [
    { name: "High Risk", count: contracts.filter(c => (c.crs || 0) >= 70).length, color: "#ef4444" },
    { name: "Medium Risk", count: contracts.filter(c => (c.crs || 0) >= 40 && (c.crs || 0) < 70).length, color: "#f59e0b" },
    { name: "Low Risk", count: contracts.filter(c => (c.crs || 0) < 40).length, color: "#10b981" }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">VENDOR AUDIT PROFILE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{vendor.name}</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Vendor contract history, win frequency, department distribution, and aggregated risk score.
          </p>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>
          📊 Export Vendor Dossier (CSV)
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Contracts Won</div>
          <div className="kpi-value">{vendor.total_contracts}</div>
          <div className="kpi-sub">Total awarded contracts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Revenue Won</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatINR(vendor.total_value)}</div>
          <div className="kpi-sub">Cumulative awarded value</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average CRS Score</div>
          <div className="kpi-value">{vendor.average_crs?.toFixed(1) || 0} / 100</div>
          <div className="kpi-sub">Aggregated risk profile</div>
        </div>

        <div className="kpi-card" style={{ borderColor: "var(--risk-high-border)" }}>
          <div className="kpi-label">High-Risk Contracts</div>
          <div className="kpi-value" style={{ color: "var(--risk-high)" }}>{vendor.high_risk_contracts}</div>
          <div className="kpi-sub">Contracts with CRS ≥ 70</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Departments Awarded</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {vendor.departments.map((dept, idx) => (
              <span key={idx} style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {dept}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Contracts Risk Distribution</div>
          <div style={{ height: 160, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskGroups} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: "#172033", borderColor: "#1e293b", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {riskGroups.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Awarded Contracts List ({contracts.length})</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract No.</th>
                <th>Title</th>
                <th>Department</th>
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
                    <Link to={`/departments/${c.department_id}`}>{c.department_name}</Link>
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
