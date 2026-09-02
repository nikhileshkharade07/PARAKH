import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InvestigatorPage() {
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [selectedCase, setSelectedCase] = useState({
    id: "INV-2024-089",
    contractId: "GEM-2024-C-000007",
    title: "High-Capacity Enterprise Server Procurement",
    department: "IT & Electronics",
    vendor: "Apex Solutions Ltd",
    value: "₹ 48,50,000",
    riskScore: 92,
    status: "Investigating",
    priority: "CRITICAL",
    summary: "Proprietary server specifications tailored to Apex Solutions product line. Single qualified bidder after rejecting Delta Infotech on non-material clause.",
    evidenceCount: 4,
    leadInvestigator: "Priya Sharma"
  });
  const navigate = useNavigate();

  const casesList = [
    {
      id: "INV-2024-089",
      contractId: "GEM-2024-C-000007",
      title: "City Infrastructure - Phase 3 Enterprise Servers",
      department: "IT & Electronics",
      vendor: "Apex Solutions Ltd",
      value: "₹ 48,50,000",
      riskScore: 92,
      status: "Investigating",
      priority: "CRITICAL",
      summary: "Proprietary server specifications tailored to Apex Solutions product line. Single qualified bidder after rejecting Delta Infotech on non-material clause."
    },
    {
      id: "INV-2024-088",
      contractId: "GEM-2024-C-000077",
      title: "Automated Traffic Surveillance Cameras",
      department: "Public Works Dept",
      vendor: "Optima Tech Systems",
      value: "₹ 1,24,00,000",
      riskScore: 86,
      status: "Pending Review",
      priority: "HIGH",
      summary: "Published tender with only 4-day bidding window. Winning bidder price was 32% above engineer estimate."
    },
    {
      id: "INV-2024-087",
      contractId: "GEM-2024-C-000142",
      title: "Medical Diagnostic Equipment & Diagnostic Kits",
      department: "Medical & Health",
      vendor: "BioCare India Pvt",
      value: "₹ 89,00,000",
      riskScore: 81,
      status: "Investigating",
      priority: "HIGH",
      summary: "Tender awardee and runner-up registered with same PAN and registered office address."
    },
    {
      id: "INV-2024-086",
      contractId: "GEM-2024-C-000215",
      title: "Highway Asphalt & Resurfacing Material Supply",
      department: "Transport & Infra",
      vendor: "National Bitumen Works",
      value: "₹ 3,40,00,000",
      riskScore: 68,
      status: "Resolved",
      priority: "MEDIUM",
      summary: "Repeat contract extensions without re-tendering. Resolved after departmental refund audit."
    }
  ];

  const filteredCases = casesList.filter((c) => {
    if (activeTab === "ACTIVE") return c.status === "Investigating";
    if (activeTab === "HIGH_PRIORITY") return c.priority === "CRITICAL" || c.priority === "HIGH";
    if (activeTab === "PENDING_REVIEW") return c.status === "Pending Review";
    if (activeTab === "RESOLVED") return c.status === "Resolved";
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight">
            Investigator
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-1">
            Central case management workspace for forensic audits, evidence collection, and CVC referrals.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/ai-assistant")}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>AI Summary</span>
          </button>
          <button
            onClick={() => navigate("/investigation")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setActiveTab("ACTIVE")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "ACTIVE"
              ? "bg-surface-container-low border-primary shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low/40"
          }`}
        >
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Active Cases</p>
          <p className="font-mono text-3xl font-extrabold text-primary mt-1">24</p>
        </div>

        <div
          onClick={() => setActiveTab("HIGH_PRIORITY")}
          className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === "HIGH_PRIORITY"
              ? "bg-error-container/20 border-error shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/30 hover:bg-error-container/10"
          }`}
        >
          <p className="font-label-bold text-xs uppercase text-error">High Priority</p>
          <p className="font-mono text-3xl font-extrabold text-error mt-1">7</p>
        </div>

        <div
          onClick={() => setActiveTab("PENDING_REVIEW")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "PENDING_REVIEW"
              ? "bg-surface-container-low border-primary shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low/40"
          }`}
        >
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Pending Review</p>
          <p className="font-mono text-3xl font-extrabold text-primary mt-1">12</p>
        </div>

        <div
          onClick={() => setActiveTab("RESOLVED")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            activeTab === "RESOLVED"
              ? "bg-surface-container-low border-primary shadow-sm"
              : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low/40"
          }`}
        >
          <p className="font-label-bold text-xs uppercase text-on-surface-variant">Resolved</p>
          <p className="font-mono text-3xl font-extrabold text-primary mt-1">148</p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases Table (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
            <h2 className="font-section-title text-base font-semibold text-primary">
              Active Investigations ({filteredCases.length})
            </h2>
            <span className="font-mono text-xs text-on-surface-variant uppercase">
              Tab: {activeTab}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase">Case ID</th>
                  <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase">Contract</th>
                  <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase">Risk Score</th>
                  <th className="px-4 py-3 font-label-bold text-label-bold text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {filteredCases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-surface-container-low font-medium"
                          : "hover:bg-surface-container-low/50"
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-primary">
                        {c.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-primary line-clamp-1">{c.title}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">{c.contractId}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                          c.riskScore >= 85
                            ? "bg-error-container/40 text-error border border-error/20"
                            : "bg-orange-100 text-orange-800 border border-orange-200"
                        }`}>
                          {c.riskScore} - {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-on-surface-variant">
                        {c.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Case Panel (5 cols) */}
        {selectedCase && (
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-primary">
                  {selectedCase.id}
                </span>
                <span className="font-mono text-xs font-bold text-error bg-error-container/30 px-2 py-0.5 rounded">
                  CRS {selectedCase.riskScore}/100
                </span>
              </div>
              <h3 className="font-headline-page text-lg font-bold text-primary">
                {selectedCase.title}
              </h3>
              <div className="text-xs text-on-surface-variant mt-1">
                Lead: <strong>Priya Sharma</strong> • Dept: {selectedCase.department}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30">
              <h4 className="font-label-bold text-xs uppercase text-primary font-bold mb-2">
                Case Summary & Red Flag Findings
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {selectedCase.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-outline-variant/30">
              <h4 className="font-label-bold text-xs uppercase text-primary font-bold mb-3">
                Investigator Actions
              </h4>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => navigate(`/investigation?contract_id=${selectedCase.contractId}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">manage_search</span>
                  <span>Open Full Workspace</span>
                </button>

                <button
                  onClick={() => alert(`Escalation dossier for ${selectedCase.id} transmitted to Central Vigilance Commission.`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>Escalate to Central Vigilance</span>
                </button>

                <button
                  onClick={() => navigate("/network")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                  <span>Inspect Vendor Network</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
