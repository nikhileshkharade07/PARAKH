import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";

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

  if (loading) return <div className="loading-spinner">Loading department profile...</div>;
  if (!department) return <div className="card">Department not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">DEPARTMENT AUDIT PROFILE</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{department.name}</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Procurement expenditure, vendor concentration, risk profile, and issued tenders.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Contracts Issued</div>
          <div className="kpi-value">{department.total_contracts}</div>
          <div className="kpi-sub">Total procurement tenders</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Department Budget Spent</div>
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

      <div className="card">
        <div className="card-title">Issued Procurement Contracts</div>
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
