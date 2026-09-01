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
        setDepartments(dRes.data);
        setVendors(vRes.data);
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
        params.append("limit", "100");

        const res = await api.get(`/contracts?${params.toString()}`);
        setContracts(res.data);
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

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract Number", "Title", "Department", "Vendor", "Estimate Value", "Award Value", "CRS Score", "Risk Level"];
    const rows = contracts.map(c => [
      c.contract_number,
      `"${c.title.replace(/"/g, '""')}"`,
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
            placeholder="Search by contract number or title..."
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
            <button className="btn btn-outline" onClick={() => setSearchParams({})}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Showing <strong>{contracts.length > 0 ? startIndex + 1 : 0} – {Math.min(startIndex + pageSize, contracts.length)}</strong> of <strong>{contracts.length}</strong> audited contracts
          </div>
          <button className="btn btn-outline" onClick={exportCSV} disabled={contracts.length === 0} style={{ padding: "6px 14px", fontSize: 13 }}>
            📊 Export to CSV
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading contracts database...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contract No.</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Vendor</th>
                    <th>Estimate Value</th>
                    <th>Award Value</th>
                    <th>CRS Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                        No contracts matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedContracts.map((c) => (
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
                        <td className="font-mono">{formatINR(c.estimate_value)}</td>
                        <td className="font-mono">{formatINR(c.award_value)}</td>
                        <td>
                          <span className={`risk-badge ${c.risk_level}`}>
                            CRS {c.crs}
                          </span>
                        </td>
                        <td>
                          <Link to={`/contracts/${c.id}`} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Audit</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "6px 14px", fontSize: 13 }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  className="btn btn-outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: "6px 14px", fontSize: 13 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
