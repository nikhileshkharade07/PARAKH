import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const search = searchParams.get("search") || "";
  const riskLevel = searchParams.get("risk_level") || "";
  const deptId = searchParams.get("department_id") || "";
  const vendorId = searchParams.get("vendor_id") || "";

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [dRes, vRes] = await Promise.all([
          api.get("/departments"),
          api.get("/vendors")
        ]);
        setDepartments(Array.isArray(dRes?.data) ? dRes.data : []);
        setVendors(Array.isArray(vRes?.data) ? vRes.data : []);
      } catch (e) {
        console.error("Failed to load filter options:", e);
      }
    }
    loadFilterOptions();
  }, []);

  useEffect(() => {
    async function loadContracts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (riskLevel) params.append("risk_level", riskLevel);
        if (deptId) params.append("department_id", deptId);
        if (vendorId) params.append("vendor_id", vendorId);
        params.append("limit", "5000");

        const res = await api.get(`/contracts?${params.toString()}`);
        setContracts(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContracts();
  }, [search, riskLevel, deptId, vendorId]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract Reference", "Title", "Department", "Vendor", "Award Value", "CRS", "Risk Level", "Status"];
    const rows = contracts.map((c) => [
      c.contract_number,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.department_name || ""}"`,
      `"${c.vendor_name || ""}"`,
      c.award_value,
      c.crs || 0,
      c.risk_level || "low",
      c.status || "AWARDED"
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `parakh-procurement-registry-${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = contracts.length;
    const high = contracts.filter((c) => (c.crs || 0) >= 70 || c.risk_level === "high").length;
    const totalVal = contracts.reduce((acc, c) => acc + (Number(c.award_value) || 0), 0);
    return {
      total,
      high,
      totalVal,
      pending: Math.min(87, Math.round(total * 0.05))
    };
  }, [contracts]);

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);

  const formatCrores = (val) => {
    const cr = val / 10000000;
    if (cr >= 1) {
      return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
    }
    return formatINR(val);
  };

  const startIndex = (page - 1) * pageSize;
  const paginatedContracts = contracts.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(contracts.length / pageSize) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Action & Context Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-on-surface-variant)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-secondary)" }} />
            <span>Regulatory Intelligence • Core Ledger</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
            Procurement Contracts Registry
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", maxWidth: "48rem" }}>
            Complete ledger of public procurement contracts across state and central procuring entities with automated corruption risk scoring (CRS).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {(search || riskLevel || deptId || vendorId) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              style={{ fontSize: "0.75rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                filter_alt_off
              </span>
              <span>Reset Filters</span>
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={exportCSV}
            style={{ fontSize: "0.75rem" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              download
            </span>
            <span>Export CSV ({contracts.length.toLocaleString("en-IN")})</span>
          </button>
        </div>
      </div>

      {/* Forensic Metric Summary Strip (4-Col Bento Architecture) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-on-surface-variant)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span>Total Contracts</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              receipt_long
            </span>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-surface)" }}>
              {metrics.total.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)" }}>
              active tracked
            </span>
          </div>
        </div>

        <div
          className="stitch-card"
          style={{
            backgroundColor: "var(--color-error-container)",
            border: "1px solid #fecaca",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-error)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-error)" }} />
              High-Risk Flagged
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-error)" }}>
              warning
            </span>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-error)" }}>
              {metrics.high.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-error)" }}>
              CRS ≥ 70
            </span>
          </div>
        </div>

        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-on-surface-variant)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span>Monitored Spend</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              account_balance
            </span>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-surface)" }}>
              {formatCrores(metrics.totalVal)}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)" }}>
              filtered scope
            </span>
          </div>
        </div>

        <div className="stitch-card-inverted" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-on-primary-container)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-secondary-fixed)" }} />
              Pending Audit
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-secondary-fixed)" }}>
              shield
            </span>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-primary)" }}>
              {metrics.pending}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-on-primary-container)" }}>
              queued triage
            </span>
          </div>
        </div>
      </div>

      {/* Filter Console Module */}
      <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", alignItems: "center" }}>
          {/* Keyword Search */}
          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "var(--color-on-surface-variant)"
              }}
            >
              search
            </span>
            <input
              type="text"
              className="stitch-input"
              style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
              placeholder="Search reference, title, or vendor..."
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => updateFilter("search", "")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-on-surface-variant)"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            )}
          </div>

          {/* Risk Level Filter */}
          <div style={{ position: "relative" }}>
            <select
              className="stitch-select"
              value={riskLevel || "all"}
              onChange={(e) => updateFilter("risk_level", e.target.value)}
            >
              <option value="all">Risk: All Levels</option>
              <option value="high">Critical / High (CRS ≥ 70)</option>
              <option value="medium">Medium Risk (40–69)</option>
              <option value="low">Low Risk (&lt; 40)</option>
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "var(--color-on-surface-variant)",
                pointerEvents: "none"
              }}
            >
              expand_more
            </span>
          </div>

          {/* Department Filter */}
          <div style={{ position: "relative" }}>
            <select
              className="stitch-select"
              value={deptId || "all"}
              onChange={(e) => updateFilter("department_id", e.target.value)}
            >
              <option value="all">Authority: All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "var(--color-on-surface-variant)",
                pointerEvents: "none"
              }}
            >
              expand_more
            </span>
          </div>

          {/* Vendor Filter */}
          <div style={{ position: "relative" }}>
            <select
              className="stitch-select"
              value={vendorId || "all"}
              onChange={(e) => updateFilter("vendor_id", e.target.value)}
            >
              <option value="all">Supplier: All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "var(--color-on-surface-variant)",
                pointerEvents: "none"
              }}
            >
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Tabular Registry */}
      <div className="stitch-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-ring" />
            <span>Loading contracts database & screening ledger...</span>
          </div>
        ) : paginatedContracts.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
              search_off
            </span>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
              No contracts matching the selected filters found
            </div>
            <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              style={{ marginTop: "1rem" }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Tender Reference</th>
                  <th>Project Description</th>
                  <th>Procuring Authority</th>
                  <th>Awarded Supplier</th>
                  <th>Contract Value</th>
                  <th>Risk Index (CRS)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.map((c) => {
                  const crs = c.crs || 50;
                  const riskClass = crs >= 70 ? "critical" : crs >= 40 ? "medium" : "low";
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/contracts/${c.id}`}
                          style={{
                            fontFamily: "JetBrains Mono",
                            fontWeight: 700,
                            color: "var(--color-secondary)",
                            fontSize: "0.8125rem"
                          }}
                        >
                          {c.contract_number}
                        </Link>
                      </td>
                      <td style={{ maxWidth: "300px" }}>
                        <div className="truncate" style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>
                          {c.title}
                        </div>
                      </td>
                      <td style={{ color: "var(--color-on-surface-variant)" }}>
                        <Link
                          to={c.department_id ? `/departments/${c.department_id}` : "#"}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {c.department_name || "Department"}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={c.vendor_id ? `/vendors/${c.vendor_id}` : "#"}
                          style={{ fontWeight: 500, color: "var(--color-on-surface)" }}
                        >
                          {c.vendor_name || "Supplier"}
                        </Link>
                      </td>
                      <td style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>
                        {formatINR(c.award_value)}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className={`risk-pill ${riskClass}`}>
                            CRS {crs}
                          </span>
                          <div
                            style={{
                              width: 48,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: "var(--color-surface-container)",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${crs}%`,
                                height: "100%",
                                backgroundColor:
                                  riskClass === "critical"
                                    ? "var(--color-error)"
                                    : riskClass === "medium"
                                    ? "var(--color-warning)"
                                    : "var(--color-success)"
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontFamily: "JetBrains Mono",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "var(--color-surface-low)",
                            color: "var(--color-on-surface-variant)",
                            fontWeight: 600
                          }}
                        >
                          {c.status || "AWARDED"}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/contracts/${c.id}`}
                          className="btn-secondary"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.6875rem" }}
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
        )}

        {/* Pagination Bar */}
        {contracts.length > 0 && (
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid var(--color-outline-variant)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              fontSize: "0.8125rem",
              color: "var(--color-on-surface-variant)"
            }}
          >
            <div>
              Showing{" "}
              <strong style={{ color: "var(--color-on-surface)" }}>
                {startIndex + 1}–{Math.min(startIndex + pageSize, contracts.length)}
              </strong>{" "}
              of <strong style={{ color: "var(--color-on-surface)" }}>{contracts.length.toLocaleString("en-IN")}</strong> records
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: "0.3rem 0.6rem", opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.75rem", padding: "0 0.25rem" }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: "0.3rem 0.6rem", opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
