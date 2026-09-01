import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function ContractDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Similar tenders state
  const [similarTenders, setSimilarTenders] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // NLP state
  const [nlpSpec, setNlpSpec] = useState("");
  const [nlpVendorDesc, setNlpVendorDesc] = useState("");
  const [nlpResult, setNlpResult] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  // Blockchain state
  const [bcRecord, setBcRecord] = useState(null);
  const [bcLoading, setBcLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Case creation state
  const [creatingCase, setCreatingCase] = useState(false);
  const [caseSuccess, setCaseSuccess] = useState(null);

  // Re-run state
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        const res = await api.get(`/contracts/${id}`);
        setContract(res.data);
        setNlpSpec(res.data.specification || "");
        setNlpVendorDesc(res.data.vendor_product_description || "");

        // Fetch similar / recycled tenders
        try {
          const simRes = await api.get(`/contracts/${id}/similar-tenders`);
          setSimilarTenders(simRes.data || []);
        } catch (sErr) {
          console.warn("Could not load similar tenders:", sErr);
        }
      } catch (err) {
        console.error("Error loading contract details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContract();
  }, [id]);

  const runNlpAnalysis = async () => {
    setNlpLoading(true);
    try {
      const res = await api.post("/nlp/analyze", {
        specification: nlpSpec,
        vendor_description: nlpVendorDesc,
        threshold: 0.85
      });
      setNlpResult(res.data);
    } catch (err) {
      console.error("NLP analysis failed:", err);
    } finally {
      setNlpLoading(false);
    }
  };

  const anchorToBlockchain = async () => {
    setBcLoading(true);
    try {
      const detectedFlags = contract.risk?.flags.map(f => f.flag_id) || [];
      const res = await api.post("/blockchain/record", {
        contract_id: contract.contract_number,
        crs: contract.crs || 0,
        flags: detectedFlags,
        timestamp: new Date().toISOString()
      });
      setBcRecord(res.data);
      setVerifyResult(null);
    } catch (err) {
      console.error("Blockchain anchoring failed:", err);
    } finally {
      setBcLoading(false);
    }
  };

  const verifyBlockchainIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await api.post("/blockchain/verify", {
        contract_id: contract.contract_number
      });
      setVerifyResult(res.data);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  const openInvestigationCase = async () => {
    setCreatingCase(true);
    setCaseSuccess(null);
    try {
      const res = await api.post("/cases", {
        contract_id: contract.id,
        title: `Forensic Audit of ${contract.contract_number} (${contract.vendor_name || 'Vendor'})`,
        priority: contract.crs >= 80 ? "CRITICAL" : contract.crs >= 60 ? "HIGH" : "MEDIUM",
        notes_summary: `Case initiated from Dossier view. CRS Score ${contract.crs}/100 with ${contract.risk?.flags?.length || 0} active red flags.`
      });
      setCaseSuccess(res.data);
    } catch (err) {
      console.error("Case creation failed:", err);
    } finally {
      setCreatingCase(false);
    }
  };

  const reanalyzeContract = async () => {
    setReanalyzing(true);
    try {
      await api.post(`/risk/analyze?contract_id=${contract.id}`);
      const updated = await api.get(`/contracts/${id}`);
      setContract(updated.data);
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setReanalyzing(false);
    }
  };

  const exportAuditReportJSON = () => {
    const reportData = JSON.stringify(contract, null, 2);
    const blob = new Blob([reportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${contract.contract_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAuditReportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Contract Number", contract.contract_number],
      ["Title", contract.title],
      ["Department", contract.department_name],
      ["Winning Vendor", contract.vendor_name],
      ["Sanctioned Estimate (INR)", contract.estimate_value],
      ["Final Award Value (INR)", contract.award_value],
      ["Corruption Risk Score (CRS)", contract.crs],
      ["Rule Engine Score", contract.risk?.rule_score || 0],
      ["Isolation Forest Anomaly Score", contract.risk?.anomaly_score || 0],
      ["Total Participating Bidders", contract.bidder_count],
      ["Tender Window (Days)", ((new Date(contract.tender_end) - new Date(contract.tender_start)) / 86400000).toFixed(1)],
      ["Triggered Flags", (contract.risk?.flags || []).map(f => f.flag_id).join("; ")]
    ];
    const csvContent = rows.map(r => r.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-dossier-${contract.contract_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner">Loading forensic contract dossier...</div>;
  if (!contract) return <div className="card">Contract dossier not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);
  const formatDate = (str) => {
    if (!str) return "N/A";
    const d = new Date(str);
    return isNaN(d.getTime()) ? String(str) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="dossier-print-container">
      {/* Dossier Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">FORENSIC AUDIT DOSSIER</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>{contract.title}</h1>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Tender Ref: <span className="font-mono" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{contract.contract_number}</span> | Issued on {formatDate(contract.contract_date)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} className="no-print">
          <button className="btn btn-outline" onClick={reanalyzeContract} disabled={reanalyzing} style={{ fontSize: 12 }}>
            {reanalyzing ? "Auditing..." : "⚡ Re-run Risk Engine"}
          </button>
          <button className="btn btn-outline" onClick={openInvestigationCase} disabled={creatingCase} style={{ fontSize: 12, borderColor: "#38bdf8", color: "#38bdf8" }}>
            {creatingCase ? "Opening Case..." : "📁 Open Case"}
          </button>
          <button className="btn btn-outline" onClick={exportAuditReportJSON} style={{ fontSize: 12 }}>
            JSON
          </button>
          <button className="btn btn-outline" onClick={exportAuditReportCSV} style={{ fontSize: 12 }}>
            CSV
          </button>
          <button className="btn btn-outline" onClick={() => window.print()} style={{ fontSize: 12 }}>
            🖨️ Print Brief
          </button>
          <span className={`risk-badge ${contract.risk_level}`} style={{ fontSize: 15, padding: "6px 14px" }}>
            CRS {contract.crs} / 100
          </span>
        </div>
      </div>

      {caseSuccess && (
        <div style={{ padding: 14, background: "rgba(56, 189, 248, 0.15)", border: "1px solid var(--accent-cyan)", borderRadius: 8, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ color: "var(--accent-cyan)" }}>✓ Investigation Case {caseSuccess.case_number} Active!</strong>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Case logged in registry and assigned to {caseSuccess.assigned_to_name}.</div>
          </div>
          <Link to="/cases" className="btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }}>
            View in Cases Hub →
          </Link>
        </div>
      )}

      {/* Grid: Risk & Overview */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Risk Assessment Summary */}
        <div className="card" style={{ borderColor: contract.crs >= 70 ? "var(--risk-high-border)" : "var(--border-color)" }}>
          <div className="card-title">
            <span>Corruption Risk Score (CRS)</span>
            <span className={`risk-badge ${contract.risk_level}`}>{contract.risk_level} Risk</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "16px 0" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: `conic-gradient(${contract.crs >= 70 ? "#ef4444" : contract.crs >= 40 ? "#f59e0b" : "#10b981"} ${contract.crs * 3.6}deg, #1e293b 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 26, fontWeight: 900 }}>{contract.crs}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>CRS</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>Explainable Rule Score (80% weight): </span>
                <strong style={{ color: "#fff" }}>{contract.risk?.rule_score || 0} / 100</strong>
              </div>
              <div style={{ marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>Isolation Forest Outlier (20% weight): </span>
                <strong style={{ color: "#fff" }}>{contract.risk?.anomaly_score?.toFixed(1) || 0} / 100</strong>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                Deterministic formula: min(100, round(0.80 × RuleScore + 0.20 × AnomalyScore))
              </p>
            </div>
          </div>
        </div>

        {/* Contract Metadata */}
        <div className="card">
          <div className="card-title">Procurement Particulars</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>PROCURING DEPARTMENT</div>
              <Link to={`/departments/${contract.department_id}`} style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-cyan)" }}>
                {contract.department_name}
              </Link>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>AWARDED SUPPLIER</div>
              <Link to={`/vendors/${contract.vendor_id}`} style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-cyan)" }}>
                {contract.vendor_name}
              </Link>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>SANCTIONED ESTIMATE</div>
              <div className="font-mono" style={{ fontWeight: 600 }}>{formatINR(contract.estimate_value)}</div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>AWARDED VALUE</div>
              <div className="font-mono" style={{ fontWeight: 700, color: contract.award_value > contract.estimate_value ? "var(--risk-high)" : "#fff" }}>
                {formatINR(contract.award_value)}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>TENDER WINDOW</div>
              <div>
                {contract.tender_start && contract.tender_end
                  ? `${formatDate(contract.tender_start)} to ${formatDate(contract.tender_end)}`
                  : contract.contract_date
                  ? `Published on ${formatDate(contract.contract_date)}`
                  : "Standard statutory window"}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>TOTAL BIDDERS</div>
              <div style={{ fontWeight: 700, color: contract.bidder_count === 1 ? "var(--risk-high)" : "var(--text-primary)" }}>
                {contract.bidder_count} Bidder{contract.bidder_count === 1 ? " (Single Bidder Alert)" : ""}
              </div>
            </div>
            {contract.provenance_ocid && (
              <div style={{ gridColumn: "1 / -1", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, marginRight: 6 }}>DATA PROVENANCE:</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{contract.provenance_source || "Himachal Pradesh Government OCDS Dataset"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, marginRight: 6 }}>OCID:</span>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--accent-cyan)", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                    {contract.provenance_ocid}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Peer-Group Benchmark Anomaly Detection Card */}
      {contract.peer_comparison && (
        <div className="card" style={{ marginBottom: 24, borderColor: contract.peer_comparison.is_value_outlier || contract.peer_comparison.is_duration_outlier ? "var(--risk-med-border)" : "var(--border-color)" }}>
          <div className="card-title">
            <span>Peer-Group Statistical Benchmark Comparison</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Compared against {contract.peer_comparison.department_total_contracts} peer contracts in {contract.department_name}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Peer Median Award Value</div>
              <div className="font-mono" style={{ fontSize: 15, fontWeight: 700 }}>{formatINR(contract.peer_comparison.peer_median_award_value)}</div>
              <div style={{ fontSize: 11, color: contract.peer_comparison.value_deviation_percent > 30 ? "var(--risk-high)" : "var(--text-secondary)" }}>
                {contract.peer_comparison.value_deviation_percent > 0 ? "+" : ""}{contract.peer_comparison.value_deviation_percent}% deviation
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Peer Median Tender Window</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{contract.peer_comparison.peer_median_tender_days} Days</div>
              <div style={{ fontSize: 11, color: contract.peer_comparison.is_duration_outlier ? "var(--risk-high)" : "var(--text-secondary)" }}>
                {contract.peer_comparison.duration_deviation_percent > 0 ? "+" : ""}{contract.peer_comparison.duration_deviation_percent}% vs median
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Peer Average Bidders</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{contract.peer_comparison.peer_average_bidders} Bidders</div>
              <div style={{ fontSize: 11, color: contract.bidder_count === 1 ? "var(--risk-high)" : "var(--text-secondary)" }}>
                This tender: {contract.bidder_count} bidder
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: 6 }}>
            💡 <strong>Forensic Peer Insight:</strong> {contract.peer_comparison.explanation}
          </div>
        </div>
      )}

      {/* Red Flags Forensic Breakdown */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <span>Forensic Red Flags Evidence & Investigator Actions</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {contract.risk?.flags.length || 0} heuristic indicator(s) triggered
          </span>
        </div>

        <div className="red-flags-grid">
          {(!contract.risk?.flags || contract.risk.flags.length === 0) ? (
            <div style={{ color: "var(--risk-low)", fontSize: 13, padding: 16 }}>
              ✓ No red flag indicators were triggered for this procurement record.
            </div>
          ) : (
            contract.risk.flags.map((flag) => (
              <div key={flag.flag_id} className="flag-card detected" style={{ padding: 14 }}>
                <div className="flag-header" style={{ marginBottom: 6 }}>
                  <span className="font-mono" style={{ fontWeight: 800, color: "var(--risk-high)", fontSize: 13 }}>{flag.flag_id}</span>
                  <span className={`risk-badge ${flag.severity}`} style={{ fontSize: 11 }}>
                    {flag.severity.toUpperCase()} (+{flag.score} pts)
                  </span>
                </div>
                <div className="flag-explanation" style={{ fontSize: 13, marginBottom: 8 }}>{flag.explanation}</div>
                <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "6px 10px", borderRadius: 4, fontSize: 11, color: "var(--accent-cyan)" }}>
                  💡 <strong>Recommended Auditor Action:</strong> Review administrative logs, tender notices, and bidder qualifications.
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bidders & Extensions */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">
            <span>Participating Bidders Log</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{contract.bidder_count} Bidder(s)</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bidder Name</th>
                  <th>Award Status</th>
                </tr>
              </thead>
              <tbody>
                {contract.bids?.map((b, idx) => (
                  <tr key={b.id || idx}>
                    <td style={{ fontWeight: b.vendor_name === contract.vendor_name ? 700 : 400 }}>
                      {b.vendor_name}
                    </td>
                    <td>
                      {b.vendor_name === contract.vendor_name ? (
                        <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--risk-low)", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                          🏆 Awarded
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Participating Bidder</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Contract Extensions (RF-8)</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{contract.extensions?.length || 0} Extension(s)</span>
          </div>
          {(!contract.extensions || contract.extensions.length === 0) ? (
            <div style={{ color: "var(--risk-low)", fontSize: 13, padding: "12px 0" }}>
              ✓ No contract extensions were granted. Completed on original schedule.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {contract.extensions.map((ext, idx) => (
                <div key={ext.id || idx} style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 6, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <strong style={{ color: "var(--risk-med)", fontSize: 12 }}>Extension #{idx + 1}: +{ext.extension_days} Days</strong>
                    <span className="risk-badge medium" style={{ fontSize: 10, padding: "2px 6px" }}>Extended</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ext.reason || "Extension granted under standard clause."}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NLP Specification Similarity Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <span>NLP Specification Tailoring Auditor (RF-7)</span>
          <button className="btn btn-primary" onClick={runNlpAnalysis} disabled={nlpLoading} style={{ padding: "6px 14px", fontSize: 12 }}>
            {nlpLoading ? "Analyzing..." : "Re-run NLP Similarity Test"}
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
          Calculates TF-IDF vectorization and cosine similarity between the official government tender specification and the winning supplier's product catalog.
        </p>

        <div className="grid-2">
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>TENDER SPECIFICATION</label>
            <textarea
              className="input-field"
              rows={3}
              style={{ width: "100%", marginTop: 6, fontSize: 12 }}
              value={nlpSpec}
              onChange={(e) => setNlpSpec(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>WINNING VENDOR PRODUCT CATALOG</label>
            <textarea
              className="input-field"
              rows={3}
              style={{ width: "100%", marginTop: 6, fontSize: 12 }}
              value={nlpVendorDesc}
              onChange={(e) => setNlpVendorDesc(e.target.value)}
            />
          </div>
        </div>

        {nlpResult && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 6, background: nlpResult.flagged ? "var(--risk-high-bg)" : "var(--risk-low-bg)", border: `1px solid ${nlpResult.flagged ? "var(--risk-high-border)" : "var(--risk-low-border)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <strong>Similarity Score: {(nlpResult.similarity_score * 100).toFixed(1)}%</strong>
              <span className={`risk-badge ${nlpResult.flagged ? "high" : "low"}`}>
                {nlpResult.flagged ? "Specification Tailoring Detected" : "Normal Similarity"}
              </span>
            </div>
            <p style={{ fontSize: 12, margin: 0 }}>{nlpResult.explanation}</p>
          </div>
        )}
      </div>

      {/* Near-Duplicate / Recycled Specifications Detection */}
      {similarTenders && similarTenders.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">
            <span>Near-Duplicate & Recycled Specification Detector</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{similarTenders.length} similar tender(s) found</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Detects potential copy-pasted or recycled specifications across other government departments using cross-corpus TF-IDF analysis.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {similarTenders.map((st) => (
              <div key={st.contract_id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Link to={`/contracts/${st.contract_id}`} style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: 13 }} className="font-mono">
                    {st.contract_number} — {st.title}
                  </Link>
                  <span style={{ fontSize: 11, background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                    {(st.similarity_score * 100).toFixed(0)}% Text Overlap
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Department: <strong>{st.department_name}</strong> | Awarded to: <strong>{st.vendor_name}</strong> ({formatINR(st.award_value)})
                </div>
                {st.matched_terms && st.matched_terms.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", alignSelf: "center" }}>Overlapping terms:</span>
                    {st.matched_terms.map((term, tIdx) => (
                      <span key={tIdx} style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4, color: "#fff" }}>
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain Anchoring & Real Integrity Verification */}
      <div className="card">
        <div className="card-title">
          <span>Immutable Blockchain Cryptographic Proofs</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" onClick={anchorToBlockchain} disabled={bcLoading} style={{ fontSize: 12 }}>
              {bcLoading ? "Anchoring..." : "⚓ Anchor Proof"}
            </button>
            <button className="btn btn-primary" onClick={verifyBlockchainIntegrity} disabled={verifying} style={{ fontSize: 12, background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#10b981" }}>
              {verifying ? "Verifying..." : "🛡️ Verify Integrity"}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Recalculates the exact SHA-256 canonical hash of the contract dossier and verifies it against the anchored ledger transaction on Ethereum Sepolia testnet.
        </p>

        {verifyResult && (
          <div style={{
            background: verifyResult.verified ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${verifyResult.verified ? "var(--risk-low)" : "var(--risk-high)"}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 14
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15, color: verifyResult.verified ? "var(--risk-low)" : "var(--risk-high)" }}>
                <span>{verifyResult.verified ? "🛡️" : "⚠️"}</span> {verifyResult.status}
              </div>
              <span style={{ fontSize: 11, background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: 12, color: "#fff" }}>
                Mode: {verifyResult.mode}
              </span>
            </div>
            <p style={{ fontSize: 12, margin: "0 0 10px 0", color: "#fff" }}>{verifyResult.message}</p>
            <div style={{ display: "grid", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
              <div><span style={{ color: "var(--text-muted)" }}>Current Canonical Hash: </span>{verifyResult.current_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Anchored Ledger Hash:  </span>{verifyResult.anchored_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Sepolia Transaction:   </span>{verifyResult.tx_hash}</div>
            </div>
          </div>
        )}

        {bcRecord && !verifyResult && (
          <div style={{ background: "#090d16", border: "1px solid var(--accent-cyan)", borderRadius: 8, padding: 14, fontSize: 12 }}>
            <div style={{ color: "var(--accent-cyan)", fontWeight: 700, marginBottom: 6 }}>
              ✓ Audit Assessment Cryptographically Anchored to Ledger
            </div>
            <div style={{ display: "grid", gap: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
              <div><span style={{ color: "var(--text-muted)" }}>Canonical Hash:</span> {bcRecord.canonical_hash || bcRecord.record_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Tx Hash:</span> {bcRecord.tx_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Network:</span> {bcRecord.network} (Block #{bcRecord.block_number})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
