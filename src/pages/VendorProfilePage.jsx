import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";

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
        setContracts(Array.isArray(cRes?.data) ? cRes.data : []);
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
    const headers = ["Contract Reference", "Title", "Department", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map((c) => [
      c.contract_number,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.department_name || ""}"`,
      c.award_value,
      c.crs || 0,
      c.risk_level || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor-${(vendor?.name || "entity").toLowerCase().replace(/\s+/g, "-")}-contracts.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <span>Loading supplier forensic profile...</span>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2>Vendor Not Found</h2>
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

  const avgCrs = vendor.average_crs || 0;
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
        <span style={{ color: "var(--color-primary)" }}>Vendor Intelligence</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className={`risk-pill ${riskClass}`}>
              Avg CRS {avgCrs}/100
            </span>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-on-surface-variant)" }}>
              ID: VEN-{vendor.id}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
            {vendor.name}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Supplier contract history, win frequency, department concentration, and temporal risk profile.
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={exportCSV} style={{ fontSize: "0.75rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            download
          </span>
          <span>Export Vendor Dossier (CSV)</span>
        </button>
      </div>

      {/* 4-Card Bento KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stitch-card">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Contracts Won
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-surface)" }}>
            {vendor.total_contracts}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Win Rate: <strong style={{ color: "var(--color-on-surface)" }}>{vendor.win_rate || 100}%</strong>
          </div>
        </div>

        <div className="stitch-card">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Cumulative Revenue
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-surface)" }}>
            {formatINR(vendor.total_value)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Avg: {formatINR(vendor.average_contract_value || 0)}
          </div>
        </div>

        <div className="stitch-card" style={{ borderLeft: avgCrs >= 70 ? "4px solid var(--color-error)" : "4px solid var(--color-outline-variant)" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
            Average Risk Index
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: avgCrs >= 70 ? "var(--color-error)" : "var(--color-on-surface)" }}>
            {avgCrs} / 100
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-error)", fontWeight: 600, marginTop: "0.25rem" }}>
            {vendor.high_risk_contracts || 0} high-risk contracts
          </div>
        </div>

        <div className="stitch-card-inverted">
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-primary-container)" }}>
            Contract Extensions
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", marginTop: "0.5rem", color: "var(--color-on-primary)" }}>
            {vendor.total_extensions || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-on-primary-container)", marginTop: "0.25rem" }}>
            Across {vendor.departments?.length || 0} departments
          </div>
        </div>
      </div>

      {/* Contract History Table */}
      <div className="stitch-table-container">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-outline-variant)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
            Contract History for {vendor.name}
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="stitch-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Project Description</th>
                <th>Procuring Department</th>
                <th>Awarded Value</th>
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
                    <td style={{ color: "var(--color-on-surface-variant)" }}>
                      {c.department_name || "Department"}
                    </td>
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
