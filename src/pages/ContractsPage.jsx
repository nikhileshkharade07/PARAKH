import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const riskLevel = searchParams.get("risk_level") || "";
  const deptId = searchParams.get("department_id") || "";
  const vendorId = searchParams.get("vendor_id") || "";

  useEffect(() => {
    async function loadFilters() {
      try {
        const [dRes, vRes] = await Promise.all([
          api.get("/departments"),
          api.get("/vendors")
        ]);
        setDepartments(dRes.data || []);
        setVendors(vRes.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadFilters();
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
        setContracts(res.data || []);
      } catch (err) {
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContracts();
  }, [search, riskLevel, deptId, vendorId]);

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
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
    const headers = ["Contract Number", "Title", "Department", "Vendor", "Estimate Value", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map(c => [
      c.contract_number,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      `"${c.department_name || ''}"`,
      `"${c.vendor_name || ''}"`,
      c.estimate_value,
      c.award_value,
      c.crs || 0,
      c.risk_level || ''
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `parakh-contracts-export-${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const startIndex = (page - 1) * pageSize;
  const paginatedContracts = contracts.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(contracts.length / pageSize) || 1;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">AUDIT REGISTRY</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Procurement Contracts</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Browse, filter, and search through audited procurement contracts.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="filter-bar">
          <input
            type="text"
            className="input-field"
            placeholder="Search by contract number, title, or supplier..."
            value={search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />

          <select
            className="select-field"
            value={riskLevel}
            onChange={(e) => updateFilter("risk_level", e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="high">High Risk (CRS ≥ 70)</option>
            <option value="medium">Medium Risk (40–69)</option>
            <option value="low">Low Risk (&lt; 40)</option>
          </select>

          <select
            className="select-field"
            value={deptId}
            onChange={(e) => updateFilter("department_id", e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            className="select-field"
            value={vendorId}
            onChange={(e) => updateFilter("vendor_id", e.target.value)}
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {(search || riskLevel || deptId || vendorId) && (
            <button
              className="btn btn-outline"
              onClick={clearFilters}
              style={{ fontSize: 13, padding: "8px 14px", height: "42px" }}
            >
              Clear Filters
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={exportCSV}
            style={{ marginLeft: "auto", fontSize: 13, padding: "8px 16px", height: "42px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <span>📥</span> Export CSV ({contracts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading contracts database...</div>
      ) : contracts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No contracts matching the selected filters</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
            Try broadening your search query or removing active filters.
          </p>
          <button className="btn btn-primary" onClick={clearFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Tender Ref</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Winning Vendor</th>
                  <th>Sanctioned Estimate</th>
                  <th>Awarded Value</th>
                  <th>CRS Score</th>
                  <th>Audit File</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/contracts/${c.id}`} className="font-mono" style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {c.contract_number}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: 280 }}>
                      <Link to={`/contracts/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {c.title}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/departments/${c.department_id}`} style={{ color: "var(--text-secondary)" }}>
                        {c.department_name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/vendors/${c.vendor_id}`} style={{ color: "var(--text-secondary)" }}>
                        {c.vendor_name}
                      </Link>
                    </td>
                    <td className="font-mono">{formatINR(c.estimate_value)}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{formatINR(c.award_value)}</td>
                    <td>
                      <span className={`risk-badge ${c.risk_level || 'low'}`}>
                        CRS {c.crs || 0}
                      </span>
                    </td>
                    <td>
                      <Link to={`/contracts/${c.id}`} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11, whiteSpace: "nowrap" }}>
                        Audit Dossier →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Showing {startIndex + 1}–{Math.min(startIndex + pageSize, contracts.length)} of {contracts.length} contracts
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
