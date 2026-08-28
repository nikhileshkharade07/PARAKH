import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [highRiskContracts, setHighRiskContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, contractsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/contracts?risk_level=high&limit=8")
        ]);
        setStats(statsRes.data);
        setHighRiskContracts(contractsRes.data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="loading-spinner">Loading audit statistics...</div>;

  const pieData = stats ? [
    { name: "High Risk (CRS ≥ 70)", value: stats.high_risk_contracts, color: "#ef4444" },
    { name: "Medium Risk (40–69)", value: stats.medium_risk_contracts, color: "#f59e0b" },
    { name: "Low Risk (< 40)", value: stats.low_risk_contracts, color: "#10b981" },
  ] : [];

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow">AI PROCUREMENT RISK AUDITOR</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Procurement Risk Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Screening synthetic public procurement contracts for red flags, price deviations, single-bidder patterns, and specification tailoring.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Audited Contracts</div>
          <div className="kpi-value">{stats?.total_contracts?.toLocaleString() || 0}</div>
          <div className="kpi-sub">Synthetic dataset</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Procured Value</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatINR(stats?.total_value || 0)}</div>
          <div className="kpi-sub">Cumulative spending</div>
        </div>

        <div className="kpi-card" style={{ borderColor: "var(--risk-high-border)" }}>
          <div className="kpi-label">High-Risk Contracts</div>
          <div className="kpi-value" style={{ color: "var(--risk-high)" }}>{stats?.high_risk_contracts}</div>
          <div className="kpi-sub">CRS ≥ 70 (Requires Review)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average CRS Score</div>
          <div className="kpi-value">{stats?.average_crs?.toFixed(1) || 0} / 100</div>
          <div className="kpi-sub">Systemic risk indicator</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-title">
            <span>Risk Breakdown</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Rule + Isolation Forest</span>
          </div>
          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#172033", borderColor: "#1e293b", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13 }}>
            {pieData.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                <span>{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Core Detection Methodology</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>PARAKH</strong> uses a two-tiered scoring pipeline:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
              <li><strong>8 Explainable Rules (80% weight)</strong>: Single bids, supplier lock-in, tender duration, estimate deviation, repeat wins, specification similarity.</li>
              <li><strong>Isolation Forest (20% weight)</strong>: Statistical outlier scoring across contract value, extensions, and tender duration.</li>
            </ul>
            <p>
              Score Formula: <code style={{ color: "var(--accent-cyan)", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: 4 }}>CRS = round(0.80 × Rule + 0.20 × Anomaly)</code>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>High-Risk Contracts Watchlist</span>
          <Link to="/contracts?risk_level=high" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 13 }}>View All High Risk →</Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract No.</th>
                <th>Title</th>
                <th>Department</th>
                <th>Vendor</th>
                <th>Award Value</th>
                <th>CRS Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {highRiskContracts.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{c.contract_number}</td>
                  <td>
                    <Link to={`/contracts/${c.id}`} style={{ fontWeight: 600, color: "#fff" }}>{c.title}</Link>
                  </td>
                  <td>
                    <Link to={`/departments/${c.department_id}`}>{c.department_name}</Link>
                  </td>
                  <td>
                    <Link to={`/vendors/${c.vendor_id}`}>{c.vendor_name}</Link>
                  </td>
                  <td className="font-mono">{formatINR(c.award_value)}</td>
                  <td>
                    <span className={`risk-badge ${c.risk_level}`}>
                      CRS {c.crs}
                    </span>
                  </td>
                  <td>
                    <Link to={`/contracts/${c.id}`} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Investigate</Link>
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
