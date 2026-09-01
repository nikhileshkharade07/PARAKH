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

  if (loading) return <div className="loading-spinner">Loading forensic vendor profile...</div>;
  if (!vendor) return <div className="card">Vendor not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">SUPPLIER FORENSIC DOSSIER</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{vendor.name}</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Supplier contract history, win frequency, department concentration, and temporal risk profile.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={exportCSV}>
            📊 Export Vendor Dossier (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Contracts Won</div>
          <div className="kpi-value">{vendor.total_contracts}</div>
          <div className="kpi-sub">Win Rate: <strong>{vendor.win_rate || 100}%</strong></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Revenue Won</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{formatINR(vendor.total_value)}</div>
          <div className="kpi-sub">Avg: {formatINR(vendor.average_contract_value || 0)}</div>
        </div>

        <div className="kpi-card" style={{ borderColor: vendor.average_crs >= 60 ? "var(--risk-high-border)" : "var(--border-color)" }}>
          <div className="kpi-label">Average CRS Score</div>
          <div className="kpi-value" style={{ color: vendor.average_crs >= 70 ? "var(--risk-high)" : vendor.average_crs >= 40 ? "var(--risk-med)" : "var(--risk-low)" }}>
            {vendor.average_crs || 0} / 100
          </div>
          <div className="kpi-sub">{vendor.high_risk_contracts} high-risk contracts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Contract Extensions</div>
          <div className="kpi-value">{vendor.total_extensions || 0}</div>
          <div className="kpi-sub">Across {vendor.departments?.length || 0} departments</div>
        </div>
      </div>

      {/* Temporal Win Trend & Department Concentration */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Temporal Trends */}
        <div className="card">
          <div className="card-title">
            <span>Historical Contract Trend (Year-over-Year)</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Temporal Activity</span>
          </div>
          <div style={{ height: 240, marginTop: 10 }}>
            {vendor.yearly_trends && vendor.yearly_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendor.yearly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="contracts" name="Contracts Won" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: 80 }}>No yearly data available.</div>
            )}
          </div>
        </div>

        {/* Department Concentration */}
        <div className="card">
          <div className="card-title">
            <span>Procuring Department Concentration</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Market Share</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {vendor.department_breakdown?.slice(0, 5).map((d) => (
              <div key={d.department_id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <Link to={`/departments/${d.department_id}`} style={{ fontWeight: 600, color: "#fff" }}>
                    {d.department_name}
                  </Link>
                  <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                    {d.contract_count} ({d.concentration_pct}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, d.concentration_pct)}%`, height: "100%", background: d.concentration_pct > 50 ? "#ef4444" : "#38bdf8" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog & Specifications */}
      {vendor.product_description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Registered Product Catalog & Specification Keywords</div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0, fontStyle: "italic", background: "rgba(0,0,0,0.25)", padding: 12, borderRadius: 6 }}>
            "{vendor.product_description}"
          </p>
        </div>
      )}

      {/* Awarded Contracts Table */}
      <div className="card">
        <div className="card-title">Awarded Contracts ({contracts.length})</div>
        <div className="table-responsive">
          <table className="contracts-table">
            <thead>
              <tr>
                <th>Tender Reference</th>
                <th>Title</th>
                <th>Department</th>
                <th>Awarded Value</th>
                <th>CRS Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contracts/${c.id}`} className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>
                      {c.contract_number}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: 300 }}>{c.title}</td>
                  <td>{c.department_name}</td>
                  <td className="font-mono">{formatINR(c.award_value)}</td>
                  <td>
                    <span className={`risk-badge ${c.risk_level || 'low'}`}>CRS {c.crs || 0}</span>
                  </td>
                  <td>
                    <Link to={`/contracts/${c.id}`} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>
                      Audit Dossier →
                    </Link>
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
