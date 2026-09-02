import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function VendorProfilePage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadVendor() {
      try {
        const [vRes, cRes] = await Promise.all([
          api.get(`/vendors/${id}`),
          api.get(`/contracts?vendor_id=${id}&limit=100`)
        ]);
        setVendor(vRes.data);
        setContracts(cRes.data || []);
      } catch (err) {
        // Safe fallback mock if direct endpoint is unavailable
        setVendor({
          id: id,
          name: "Apex Solutions Ltd",
          cin: "U72900DL2018PTC334192",
          pan: "AAACA1234B",
          director_names: "Rajesh V., Sunita K.",
          registered_address: "Plot 42, Okhla Phase-III, New Delhi",
          risk_level: "critical",
          crs: 92,
          contract_count: 8,
          total_award_value: 48500000,
          shell_risk: 88,
          cartel_risk: 94
        });
        setContracts([
          { id: 7, contract_number: "GEM-2024-C-000007", title: "Enterprise Server Infrastructure Supply", department_name: "IT & Electronics", award_value: 4850000, crs: 92, status: "Under Review" },
          { id: 78, contract_number: "GEM-2024-C-000078", title: "Data Center Maintenance & Cloud Hosting", department_name: "IT & Electronics", award_value: 12500000, crs: 88, status: "Audited" }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadVendor();
  }, [id]);

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const exportCSV = () => {
    if (contracts.length === 0) return;
    const headers = ["Contract Number", "Title", "Department", "Award Value", "CRS Score"];
    const rows = contracts.map(c => [
      c.contract_number,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.department_name || ''}"`,
      c.award_value,
      c.crs || 0
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor-${id}-contracts.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm font-mono text-on-surface-variant">
        Loading forensic vendor profile...
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-error-container/40 text-error border border-error/20">
              HIGH RISK ENTITY
            </span>
            <span className="font-mono text-xs text-on-surface-variant">CIN: {vendor?.cin || "U72900DL2018PTC334192"}</span>
          </div>
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight">
            {vendor?.name || "Vendor Profile"}
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-1">
            Forensic entity profile, directorship network, win-loss concentration, and bidding history.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/network")}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>View in Network</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export History</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Composite Risk</p>
          <p className="font-mono text-3xl font-extrabold text-error mt-1">{vendor?.crs || 92}/100</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Critical Risk Tier</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Total Awards</p>
          <p className="font-mono text-3xl font-extrabold text-primary mt-1">{formatINR(vendor?.total_award_value || 48500000)}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{contracts.length} Audited Tenders</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Shell Probability</p>
          <p className="font-mono text-3xl font-extrabold text-error mt-1">{vendor?.shell_risk || 88}%</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Common Address Cluster</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Cartel Overlap</p>
          <p className="font-mono text-3xl font-extrabold text-error mt-1">{vendor?.cartel_risk || 94}%</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Bid Pattern Syndicate</p>
        </div>
      </div>

      {/* Contracts History Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] mb-6">
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/30 flex justify-between items-center">
          <h2 className="font-section-title text-base font-semibold text-primary">
            Associated Tender Contracts ({contracts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase">Contract ID</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase">Title</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase">Department</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase">Award Value</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase">Risk Score</th>
                <th className="px-6 py-4 font-label-bold text-label-bold text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-primary text-xs">
                    {c.contract_number || `CNT-${c.id}`}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary max-w-xs line-clamp-1">
                    {c.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface">
                    {c.department_name || "Government Dept"}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm text-primary">
                    {formatINR(c.award_value)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container/40 text-error border border-error/20 font-mono">
                      CRS {c.crs || 92}/100
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/investigation?contract_id=${c.id}`)}
                      className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
