import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function InvestigationPage() {
  const [searchParams] = useSearchParams();
  const contractIdParam = searchParams.get("contract_id");
  const [contractsList, setContractsList] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [notesList, setNotesList] = useState([
    { author: "Priya Sharma (Forensic Lead)", time: "Today, 10:42 AM", text: "Product catalog NLP similarity with Apex Solutions is 94.2%. Clear specification tailoring indicator." },
    { author: "Aegis Detection Engine", time: "Yesterday, 04:15 PM", text: "Flagged tender window duration of only 4 days below statutory threshold of 14 days." }
  ]);
  const [evidenceItems, setEvidenceItems] = useState([
    { id: 1, title: "Proprietary Technical Specifications", desc: "Cloned clauses matching Apex Enterprise Server v4.2 datasheet verbatim", checked: true },
    { id: 2, title: "Bidding Window Anomaly", desc: "4-day submission period over weekend violating statutory 14-day minimum", checked: true },
    { id: 3, title: "Shared Office Address (MCA-21)", desc: "Winner Apex Solutions & Runner-up Delta Infotech share Plot 42 Okhla address", checked: true },
    { id: 4, title: "Director Interlocking DIN", desc: "Director Rajesh V. registered across 3 bidding entities in the same fiscal year", checked: false }
  ]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const defaultCases = [
    { id: 7, contract_number: "GEM-2024-C-000007", title: "Supply and Maintenance of High-Capacity Enterprise Servers", award_value: 4850000, crs: 92, vendor_name: "Apex Solutions Ltd", department_name: "IT & Electronics", spec_overlap: 94.2, tender_window: 4, price_dev: 32.8, bidder_density: "1 Qualified" },
    { id: 77, contract_number: "GEM-2024-C-000077", title: "Automated Traffic Surveillance Cameras & Sensor Pods", award_value: 12400000, crs: 86, vendor_name: "Optima Tech Systems", department_name: "Public Works Dept", spec_overlap: 88.5, tender_window: 5, price_dev: 28.4, bidder_density: "2 Bidders" },
    { id: 142, contract_number: "GEM-2024-C-000142", title: "Medical Diagnostic Equipment & Diagnostic Test Kits", award_value: 8900000, crs: 81, vendor_name: "BioCare India Pvt", department_name: "Medical & Health", spec_overlap: 82.0, tender_window: 6, price_dev: 19.5, bidder_density: "1 Qualified" }
  ];

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.get("/contracts?risk_level=high&limit=12");
        const list = res.data && res.data.length > 0 ? res.data : defaultCases;
        setContractsList(list);

        if (contractIdParam) {
          const match = list.find(c => String(c.id) === String(contractIdParam) || c.contract_number === contractIdParam);
          if (match) setSelectedContract(match);
          else {
            try {
              const singleRes = await api.get(`/contracts/${contractIdParam}`);
              setSelectedContract(singleRes.data || list[0]);
            } catch {
              setSelectedContract(list[0]);
            }
          }
        } else {
          setSelectedContract(list[0]);
        }
      } catch {
        setContractsList(defaultCases);
        setSelectedContract(defaultCases[0]);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [contractIdParam]);

  const handleAddNote = () => {
    if (!investigationNotes.trim()) return;
    setNotesList([
      ...notesList,
      { author: "Priya Sharma (Investigator)", time: "Just now", text: investigationNotes.trim() }
    ]);
    setInvestigationNotes("");
  };

  const toggleEvidence = (id) => {
    setEvidenceItems(evidenceItems.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleEscalate = () => {
    setEscalated(true);
    setTimeout(() => {
      alert(`Case ${selectedContract?.contract_number || "GEM-2024-C-000007"} escalated to Central Vigilance Commission (CVC) registry.`);
    }, 100);
  };

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight">
            Investigation Workspace
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant mt-1">
            Deep-dive forensic audit on high-risk procurement files, collusion clusters, and compliance flags.
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
            onClick={handleEscalate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-bold text-label-bold uppercase transition-all shadow-sm cursor-pointer ${
              escalated
                ? "bg-error text-white"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>{escalated ? "Escalated to CVC" : "Escalate to CVC"}</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flagged Cases Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col gap-3">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20 px-1">
            <span className="font-mono text-xs font-bold uppercase text-on-surface-variant">
              Flagged Files ({contractsList.length})
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-error-container/40 text-error border border-error/20">
              URGENT
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
            {contractsList.map((c) => {
              const isSelected = selectedContract?.id === c.id || selectedContract?.contract_number === c.contract_number;
              const crs = c.crs || 88;

              return (
                <div
                  key={c.id || c.contract_number}
                  onClick={() => setSelectedContract(c)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface-container-low border-primary shadow-sm"
                      : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low/40"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-primary">
                      {c.contract_number || `GEM-${c.id}`}
                    </span>
                    <span className="font-mono text-xs font-bold text-error bg-error-container/30 px-2 py-0.5 rounded">
                      CRS {crs}/100
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-primary line-clamp-1">
                    {c.title}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1 flex justify-between items-center">
                    <span>{c.department_name || "Public Works"}</span>
                    <span className="font-medium text-primary">{c.vendor_name || "Apex Solutions"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Workspace (8 cols) */}
        {selectedContract && (
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Primary Case Header Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-error-container/40 text-error border border-error/20">
                    CRITICAL ANOMALY
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {selectedContract.contract_number || `CNT-${selectedContract.id}`}
                  </span>
                </div>
                <h2 className="font-headline-page text-xl font-bold text-primary mb-2">
                  {selectedContract.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                  <div><strong>Department:</strong> {selectedContract.department_name || "IT & Electronics"}</div>
                  <div><strong>Awardee:</strong> {selectedContract.vendor_name || "Apex Solutions Ltd"}</div>
                  <div><strong>Award Value:</strong> {formatINR(selectedContract.award_value)}</div>
                </div>
              </div>

              <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
                <div className="font-mono text-[11px] font-bold text-error uppercase">
                  Composite Risk
                </div>
                <div className="text-3xl font-extrabold text-error font-mono mt-0.5">
                  {selectedContract.crs || 92}
                  <span className="text-sm font-normal">/100</span>
                </div>
              </div>
            </div>

            {/* 4 Forensic Factors Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                <span className="font-label-bold text-[11px] font-bold uppercase text-on-surface-variant">
                  Spec Overlap
                </span>
                <div className="text-2xl font-bold text-error font-mono mt-1">
                  {selectedContract.spec_overlap || 94.2}%
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Vendor proprietary match
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                <span className="font-label-bold text-[11px] font-bold uppercase text-on-surface-variant">
                  Tender Window
                </span>
                <div className="text-2xl font-bold text-error font-mono mt-1">
                  {selectedContract.tender_window || 4} Days
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Statutory min: 14 days
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                <span className="font-label-bold text-[11px] font-bold uppercase text-on-surface-variant">
                  Price Deviation
                </span>
                <div className="text-2xl font-bold text-orange-600 font-mono mt-1">
                  +{selectedContract.price_dev || 32.8}%
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Above engineer estimate
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                <span className="font-label-bold text-[11px] font-bold uppercase text-on-surface-variant">
                  Bidder Pool
                </span>
                <div className="text-2xl font-bold text-orange-600 font-mono mt-1">
                  {selectedContract.bidder_density || "1 Qualified"}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  2 rejected on technicality
                </div>
              </div>
            </div>

            {/* Evidence Checklist Locker */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
              <h3 className="font-section-title text-base font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Forensic Evidence Locker
              </h3>
              <div className="flex flex-col gap-3">
                {evidenceItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleEvidence(item.id)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {}}
                      className="mt-1 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <div className={`text-sm font-semibold ${item.checked ? "text-primary" : "text-on-surface-variant line-through"}`}>
                        {item.title}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation Notes Log */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
              <h3 className="font-section-title text-base font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Auditor Findings & Timeline Notes
              </h3>

              <div className="flex flex-col gap-3 mb-4 max-h-56 overflow-y-auto">
                {notesList.map((n, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-primary font-semibold">{n.author}</strong>
                      <span className="text-on-surface-variant/70 font-mono">{n.time}</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type forensic note or observation..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
