import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";

export default function ContractDetailContainer() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NLP state
  const [nlpSpec, setNlpSpec] = useState("");
  const [nlpVendorDesc, setNlpVendorDesc] = useState("");
  const [nlpResult, setNlpResult] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  // Blockchain state
  const [bcRecord, setBcRecord] = useState(null);
  const [bcLoading, setBcLoading] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        const res = await api.get(`/contracts/${id}`);
        setContract(res.data);
        setNlpSpec(res.data.specification || "");
        setNlpVendorDesc(res.data.vendor_product_description || "");
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
    } catch (err) {
      console.error("Blockchain anchoring failed:", err);
    } finally {
      setBcLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading contract audit file...</div>;
  if (!contract) return <div className="card">Contract not found.</div>;

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  const formatDate = (str) => new Date(str).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const [reanalyzing, setReanalyzing] = useState(false);

  const reanalyzeContract = async () => {
    setReanalyzing(true);
    try {
      const res = await api.post(`/risk/analyze?contract_id=${contract.id}`);
      // Refresh contract detail
      const updated = await api.get(`/contracts/${id}`);
      setContract(updated.data);
    } catch (err) {
      console.error("Re-analysis failed:", err);
    } finally {
      setReanalyzing(false);
    }
  };

  const exportAuditReport = () => {
    const reportData = JSON.stringify(contract, null, 2);
    const blob = new Blob([reportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${contract.contract_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">CONTRACT RISK INVESTIGATION</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>{contract.title}</h1>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Contract Ref: <span className="font-mono" style={{ color: "#fff", fontWeight: 600 }}>{contract.contract_number}</span> | Issued on {formatDate(contract.contract_date)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={reanalyzeContract} disabled={reanalyzing}>
            {reanalyzing ? "Auditing..." : "⚡ Re-run Risk Engine"}
          </button>
          <button className="btn btn-outline" onClick={exportAuditReport}>
            📥 Export Report
          </button>
          <span className={`risk-badge ${contract.risk_level}`} style={{ fontSize: 16, padding: "8px 16px" }}>
            CRS Score {contract.crs} / 100
          </span>
        </div>
      </div>

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
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--text-secondary)" }}>Rule Engine Score (80%): </span>
                <strong style={{ color: "#fff" }}>{contract.risk?.rule_score || 0} / 100</strong>
              </div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--text-secondary)" }}>Isolation Forest Anomaly (20%): </span>
                <strong style={{ color: "#fff" }}>{contract.risk?.anomaly_score?.toFixed(1) || 0} / 100</strong>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Calculated using 8 deterministic red flag heuristics weighted against machine learning statistical anomaly detection.
              </p>
            </div>
          </div>
        </div>

        {/* Contract & Entity Metadata */}
        <div className="card">
          <div className="card-title">Contract Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>PROCURING DEPARTMENT</div>
              <Link to={`/departments/${contract.department_id}`} style={{ fontWeight: 700, fontSize: 15 }}>{contract.department_name}</Link>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>AWARDED VENDOR</div>
              <Link to={`/vendors/${contract.vendor_id}`} style={{ fontWeight: 700, fontSize: 15 }}>{contract.vendor_name}</Link>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>ESTIMATE VALUE</div>
              <div className="font-mono" style={{ fontWeight: 600 }}>{formatINR(contract.estimate_value)}</div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>AWARD VALUE</div>
              <div className="font-mono" style={{ fontWeight: 600, color: contract.award_value > contract.estimate_value ? "var(--risk-high)" : "#fff" }}>
                {formatINR(contract.award_value)}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>TENDER DURATION</div>
              <div>{formatDate(contract.tender_start)} to {formatDate(contract.tender_end)}</div>
            </div>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>PARTICIPATING BIDDERS</div>
              <div style={{ fontWeight: 600 }}>{contract.bidder_count} bidder(s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags Evidence */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <span>Screened Red Flags Evidence</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {contract.risk?.flags.length || 0} anomaly indicator(s) triggered
          </span>
        </div>

        <div className="red-flags-grid">
          {contract.risk?.flags.length === 0 ? (
            <div style={{ color: "var(--risk-low)", fontSize: 14, padding: 16 }}>
              ✓ No red flag indicators were triggered for this contract.
            </div>
          ) : (
            contract.risk?.flags.map((flag) => (
              <div key={flag.flag_id} className="flag-card detected">
                <div className="flag-header">
                  <span className="font-mono" style={{ fontWeight: 700, color: "var(--risk-high)" }}>{flag.flag_id}</span>
                  <span className={`risk-badge ${flag.severity}`}>{flag.severity} (+{flag.score} pts)</span>
                </div>
                <div className="flag-explanation">{flag.explanation}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Participating Bidders & Price Competition */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">
            <span>Participating Bidders Competition</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{contract.bidder_count} Bidder(s)</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bidder Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contract.bids?.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ color: "var(--text-muted)" }}>No bid records found.</td>
                  </tr>
                ) : (
                  contract.bids?.map((b, idx) => (
                    <tr key={b.id || idx}>
                      <td style={{ fontWeight: b.vendor_name === contract.vendor_name ? 700 : 400 }}>
                        {b.vendor_name}
                      </td>
                      <td>
                        {b.vendor_name === contract.vendor_name ? (
                          <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--risk-low)", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                            🏆 Awarded
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Participated</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contract Extension History */}
        <div className="card">
          <div className="card-title">
            <span>Contract Extensions History (RF-8)</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{contract.extensions?.length || 0} Extension(s)</span>
          </div>
          {(!contract.extensions || contract.extensions.length === 0) ? (
            <div style={{ color: "var(--risk-low)", fontSize: 13, padding: "12px 0" }}>
              ✓ No contract extensions were granted. Completed on original schedule.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {contract.extensions.map((ext, idx) => (
                <div key={ext.id || idx} style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong style={{ color: "var(--risk-med)", fontSize: 13 }}>Extension #{idx + 1}: +{ext.extension_days} Days</strong>
                    <span className="risk-badge medium" style={{ fontSize: 11, padding: "2px 6px" }}>Prolonged</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ext.reason || "Extension granted under standard clause."}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NLP Specification Similarity Analysis */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <span>NLP Specification Similarity Auditor (RF-7)</span>
          <button className="btn btn-primary" onClick={runNlpAnalysis} disabled={nlpLoading} style={{ padding: "6px 14px", fontSize: 13 }}>
            {nlpLoading ? "Analyzing..." : "Re-run NLP Similarity Test"}
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Analyzes textual overlap between the government tender specification and the winning vendor's marketing catalog description using TF-IDF vectorization and cosine similarity.
        </p>

        <div className="grid-2">
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>TENDER SPECIFICATION</label>
            <textarea
              className="input-field"
              rows={4}
              style={{ width: "100%", marginTop: 6, fontSize: 13 }}
              value={nlpSpec}
              onChange={(e) => setNlpSpec(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>VENDOR PRODUCT DESCRIPTION</label>
            <textarea
              className="input-field"
              rows={4}
              style={{ width: "100%", marginTop: 6, fontSize: 13 }}
              value={nlpVendorDesc}
              onChange={(e) => setNlpVendorDesc(e.target.value)}
            />
          </div>
        </div>

        {nlpResult && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: nlpResult.flagged ? "var(--risk-high-bg)" : "var(--risk-low-bg)", border: `1px solid ${nlpResult.flagged ? "var(--risk-high-border)" : "var(--risk-low-border)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <strong>Similarity Score: {(nlpResult.similarity_score * 100).toFixed(1)}%</strong>
              <span className={`risk-badge ${nlpResult.flagged ? "high" : "low"}`}>
                {nlpResult.flagged ? "Specification Tailoring Detected" : "Normal Similarity"}
              </span>
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>{nlpResult.explanation}</p>
          </div>
        )}
      </div>

      {/* Blockchain Anchoring */}
      <div className="card">
        <div className="card-title">
          <span>Immutable Blockchain Audit Anchoring</span>
          <button className="btn btn-outline" onClick={anchorToBlockchain} disabled={bcLoading}>
            {bcLoading ? "Anchoring..." : "Anchor Audit Evidence Hash"}
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Generates a canonical cryptographic SHA-256 hash of the risk assessment score and flags, anchoring the proof to Ethereum Sepolia testnet to prevent tampering.
        </p>

        {bcRecord && (
          <div style={{ background: "#090d16", border: "1px solid var(--accent-cyan)", borderRadius: 8, padding: 16, fontSize: 13 }}>
            <div style={{ color: "var(--accent-cyan)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              ✓ Audit Assessment Anchored to Blockchain
            </div>
            <div style={{ display: "grid", gap: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
              <div><span style={{ color: "var(--text-muted)" }}>Record Hash:</span> {bcRecord.record_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Transaction Hash:</span> {bcRecord.tx_hash}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Network:</span> {bcRecord.network} (Block #{bcRecord.block_number})</div>
              <div><span style={{ color: "var(--text-muted)" }}>Contract Address:</span> {bcRecord.contract_address}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
