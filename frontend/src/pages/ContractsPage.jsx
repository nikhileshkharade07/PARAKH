import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const navigate = useNavigate();

  const search = searchParams.get("search") || "";
  const riskLevel = searchParams.get("risk_level") || "";
  const deptId = searchParams.get("department_id") || "";
  const vendorId = searchParams.get("vendor_id") || "";

  const defaultContracts = [
    { id: 7, contract_number: "GEM-2024-C-000007", title: "Supply and Maintenance of High-Capacity Enterprise Servers", department_name: "IT & Electronics", vendor_name: "Apex Solutions Ltd", award_value: 4850000, crs: 92, risk_level: "critical", status: "Under Review" },
    { id: 77, contract_number: "GEM-2024-C-000077", title: "Automated Traffic Surveillance Cameras & Sensor Pods", department_name: "Public Works Dept", vendor_name: "Optima Tech Systems", award_value: 12400000, crs: 86, risk_level: "high", status: "Flagged" },
    { id: 142, contract_number: "GEM-2024-C-000142", title: "Medical Diagnostic Equipment & Diagnostic Test Kits", department_name: "Medical & Health", vendor_name: "BioCare India Pvt", award_value: 8900000, crs: 81, risk_level: "high", status: "Audited" },
    { id: 215, contract_number: "GEM-2024-C-000215", title: "Highway Asphalt & Road Resurfacing Material Supply", department_name: "Transport & Infra", vendor_name: "National Bitumen Works", award_value: 34000000, crs: 68, risk_level: "medium", status: "Verified" },
    { id: 304, contract_number: "GEM-2024-C-000304", title: "Cloud Backup & Disaster Recovery Infrastructure", department_name: "IT & Electronics", vendor_name: "DataShield Services", award_value: 1850000, crs: 24, risk_level: "low", status: "Cleared" }
  ];

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
    async function fetchContracts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (riskLevel) params.append("risk_level", riskLevel);
        if (deptId) params.append("department_id", deptId);
        if (vendorId) params.append("vendor_id", vendorId);
        params.append("limit", "5000");

        const res = await api.get(`/contracts?${params.toString()}`);
        if (Array.isArray(res.data)) {
          setContracts(res.data);
        } else {
          setContracts(defaultContracts);
        }
      } catch (err) {
        console.error("Error fetching contracts:", err);
        setContracts(defaultContracts);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, [search, riskLevel, deptId, vendorId]);

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const getRiskBadge = (crs, level) => {
    if (crs >= 85 || level === "critical") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container/40 text-error border border-error/20">
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
          <span>Critical</span>
          <span className="text-xs font-mono font-bold">CRS {crs}</span>
        </span>
      );
    }
    if (crs >= 70 || level === "high") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          <span>High</span>
          <span className="text-xs font-mono font-bold">CRS {crs}</span>
        </span>
      );
    }
    if (crs >= 40 || level === "medium") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          <span>Medium</span>
          <span className="text-xs font-mono font-bold">CRS {crs}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        <span>Low</span>
        <span className="text-xs font-mono font-bold">CRS {crs}</span>
      </span>
    );
  };

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract ID", "Title", "Vendor", "Department", "Value", "CRS Score", "Risk Level"];
    const rows = contracts.map(c => [
      c.contract_number || `CNT-${c.id}`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.vendor_name || '').replace(/"/g, '""')}"`,
      `"${(c.department_name || '').replace(/"/g, '""')}"`,
      c.award_value || 0,
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
  };

  const totalPages = Math.ceil(contracts.length / pageSize) || 1;
  const paginatedContracts = contracts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight">
            Contract Registry
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-1">
            Search, filter and review all monitored procurement contracts and calculated Composite Risk Scores ({contracts.length} records).
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate("/ingest")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Ingestion</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 rounded-xl p-4 flex flex-wrap gap-4 items-end mb-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex-1 min-w-[240px]">
          <label className="font-label-bold text-label-bold text-on-surface-variant uppercase block mb-1.5">
            Search Contracts / Vendors
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search title, ID, vendor..."
              value={search}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set("search", e.target.value);
                else p.delete("search");
                setSearchParams(p);
                setPage(1);
              }}
              className="w-full bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="font-label-bold text-label-bold text-on-surface-variant uppercase">
            Risk Level
          </label>
          <select
            value={riskLevel}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set("risk_level", e.target.value);
              else p.delete("risk_level");
              setSearchParams(p);
              setPage(1);
            }}
            className="bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical (CRS ≥ 85)</option>
            <option value="high">High (70 - 84)</option>
            <option value="medium">Medium (40 - 69)</option>
            <option value="low">Low (&lt; 40)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="font-label-bold text-label-bold text-on-surface-variant uppercase">
            Department
          </label>
          <select
            value={deptId}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set("department_id", e.target.value);
              else p.delete("department_id");
              setSearchParams(p);
              setPage(1);
            }}
            className="bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSearchParams(new URLSearchParams());
            setPage(1);
          }}
          className="px-4 py-2 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-high/60 transition-colors h-[38px] flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-outline-variant/30 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Title / Scope</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Risk Assessment</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-on-surface-variant font-mono">
                    Loading contracts database records...
                  </td>
                </tr>
              ) : paginatedContracts.length > 0 ? (
                paginatedContracts.map((c) => {
                  const crs = c.crs || (c.risk_score ? Math.round(c.risk_score * 100) : 45);

                  return (
                    <tr
                      key={c.id || c.contract_number}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-primary text-xs whitespace-nowrap">
                        {c.contract_number || `CNT-${c.id}`}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-medium text-sm text-primary line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          Status: {c.status || "Audited"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface whitespace-nowrap">
                        {c.department_name || "Government Dept"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary whitespace-nowrap">
                        {c.vendor_name || "Supplier Org"}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-primary whitespace-nowrap">
                        {formatINR(c.award_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(crs, c.risk_level)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/investigation?contract_id=${c.id}`)}
                          className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    No contracts matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between">
            <div className="text-xs font-mono text-on-surface-variant">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, contracts.length)} of {contracts.length} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-medium disabled:opacity-40 hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-mono font-bold text-primary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-medium disabled:opacity-40 hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
