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
        setContracts(Array.isArray(cRes?.data) ? cRes.data : []);
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
    const headers = ["Contract Reference", "Title", "Winning Vendor", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map((c) => [
      c.contract_number,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.vendor_name || ""}"`,
      c.award_value,
      c.crs || 0,
      c.risk_level || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `department-${(department?.name || "dept").toLowerCase().replace(/\s+/g, "-")}-contracts.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <span>Loading department audit profile...</span>
      </div>
    );
  }

  if (!department) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2>Department Not Found</h2>
        <Link to="/contracts" className="btn-primary" style={{ marginTop: "1rem" }}>
          Return to Registry
        </Link>
      </div>
    );
  }

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);

  // Group contracts by vendor
  const vendorWinCounts = {};
  contracts.forEach((c) => {
    const vName = c.vendor_name || "Primary Supplier";
    vendorWinCounts[vName] = (vendorWinCounts[vName] || 0) + 1;
  });

  const COLORS = ["#4b41e1", "#ba1a1a", "#b45309", "#059669", "#64748b"];
  const vendorPieData = Object.entries(vendorWinCounts).slice(0, 5).map(([name, count], idx) => ({
    name: name.length > 20 ? name.substring(0, 18) + "..." : name,
    fullName: name,
    value: count,
    color: COLORS[idx % COLORS.length]
  }));

  const avgCrs = department.average_crs || 0;
  const riskClass = avgCrs >= 70 ? "critical" : avgCrs >= 40 ? "medium" : "low";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-on-surface-variant)" }}>
        <Link to="/contracts" style={{ color: "inherit" }}>
          Contract Registry
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
          chevron_right
        </span>
        <span style={{ color: "var(--color-primary)" }}>Department Intelligence</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className={`risk-pill ${riskClass}`}>
              Avg CRS {avgCrs}/100
            </span>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-on-surface-variant)" }}>
              ID: DEPT-{department.id}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
            {department.name}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Procurement expenditure, vendor concentration, risk profile, and issued tenders.
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={exportCSV} style={{ fontSize: "0.75rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            download
          </span>
          <span>Export Department Dossier (CSV)</span>
        </button>
      </div>

      {/* 4-Card Bento Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stitch-card">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Contracts Issued
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-surface)" }}>
            {department.total_contracts}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Total tenders audited
          </div>
        </div>

        <div className="stitch-card">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Cumulative Expenditure
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-surface)" }}>
            {formatINR(department.total_value)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Total sanctioned budget
          </div>
        </div>

        <div className="stitch-card" style={{ borderLeft: (department.vendor_concentration || 0) > 0.5 ? "4px solid var(--color-error)" : "4px solid var(--color-outline-variant)" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Vendor Concentration
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: (department.vendor_concentration || 0) > 0.5 ? "var(--color-error)" : "var(--color-on-surface)" }}>
            {((department.vendor_concentration || 0.6) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: (department.vendor_concentration || 0) > 0.5 ? "var(--color-error)" : "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            {(department.vendor_concentration || 0) > 0.5 ? "RF-2 Lock-in Violated" : "Acceptable dispersion"}
          </div>
        </div>

        <div className="stitch-card-inverted">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-primary-container)" }}>
            Average Risk Index
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-primary)" }}>
            {avgCrs} / 100
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-primary-container)", marginTop: "0.25rem" }}>
            {department.high_risk_contracts || 0} high-risk contracts
          </div>
        </div>
      </div>

      {/* Contract Table */}
      <div className="stitch-table-container">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-outline-variant)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
            Contracts Issued by {department.name}
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="stitch-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Project Description</th>
                <th>Awarded Contractor</th>
                <th>Contract Value</th>
                <th>Risk Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const crs = c.crs || 50;
                const rCls = crs >= 70 ? "critical" : crs >= 40 ? "medium" : "low";
                return (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/contracts/${c.id}`}
                        style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-secondary)" }}
                      >
                        {c.contract_number}
                      </Link>
                    </td>
                    <td style={{ maxWidth: "320px" }}>
                      <div className="truncate" style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>
                        {c.title}
                      </div>
                    </td>
                    <td>{c.vendor_name || "Supplier"}</td>
                    <td style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>
                      {formatINR(c.award_value)}
                    </td>
                    <td>
                      <span className={`risk-pill ${rCls}`}>
                        CRS {crs}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/contracts/${c.id}`}
                        className="btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}
                      >
                        Dossier →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
