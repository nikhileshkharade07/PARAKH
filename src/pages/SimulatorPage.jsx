import { useState } from "react";
import { api } from "../services/api";

export default function SimulatorPage() {
  // Configurable thresholds
  const [approvalThreshold, setApprovalThreshold] = useState(5000000);
  const [durationThreshold, setDurationThreshold] = useState(7);
  const [priceDevThreshold, setPriceDevThreshold] = useState(0.30);
  const [nlpThreshold, setNlpThreshold] = useState(0.85);
  const [vendorLockinThreshold, setVendorLockinThreshold] = useState(0.60);

  // Contract Inputs
  const [estimateValue, setEstimateValue] = useState(4000000);
  const [awardValue, setAwardValue] = useState(4850000);
  const [tenderDays, setTenderDays] = useState(4);
  const [bidderCount, setBidderCount] = useState(1);
  const [vendorPastWins, setVendorPastWins] = useState(4);
  const [totalDeptContracts, setTotalDeptContracts] = useState(5);
  const [extensionCount, setExtensionCount] = useState(2);
  const [specificationText, setSpecificationText] = useState("Enterprise core network switches and routers with redundant power supply");
  const [vendorCatalogText, setVendorCatalogText] = useState("Enterprise core network switches and routers with redundant power supply catalog");

  // Simulation result
  const [nlpResult, setNlpResult] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  const calculateFlags = () => {
    const deviation = estimateValue > 0 ? (awardValue - estimateValue) / estimateValue : 0;
    const vendorWinRatio = totalDeptContracts > 0 ? vendorPastWins / totalDeptContracts : 0;
    const isNearThreshold = awardValue <= approvalThreshold && awardValue >= approvalThreshold * 0.90;

    const flags = [
      {
        id: "RF-1",
        name: "Single Bidder Tender",
        score: 20,
        severity: "high",
        detected: bidderCount === 1,
        explanation: bidderCount === 1 ? "Only 1 bidder participated in the procurement." : "Multiple bidders participated."
      },
      {
        id: "RF-2",
        name: "Vendor Lock-in Dominance",
        score: 20,
        severity: "high",
        detected: vendorWinRatio > vendorLockinThreshold,
        explanation: `Vendor win ratio is ${(vendorWinRatio * 100).toFixed(0)}% (threshold: ${(vendorLockinThreshold * 100).toFixed(0)}%).`
      },
      {
        id: "RF-3",
        name: "Approval Threshold Proximity",
        score: 15,
        severity: "high",
        detected: isNearThreshold,
        explanation: isNearThreshold
          ? `Award value ₹${awardValue.toLocaleString()} is within 10% below the ₹${approvalThreshold.toLocaleString()} approval threshold.`
          : "Contract value is not suspiciously near approval limit."
      },
      {
        id: "RF-4",
        name: "Compressed Tender Window",
        score: 10,
        severity: "medium",
        detected: tenderDays < durationThreshold,
        explanation: `Tender window open for ${tenderDays} days (minimum required: ${durationThreshold} days).`
      },
      {
        id: "RF-5",
        name: "Estimate Deviation",
        score: 10,
        severity: "medium",
        detected: deviation > priceDevThreshold,
        explanation: `Award exceeds estimate by ${(deviation * 100).toFixed(0)}% (threshold: ${(priceDevThreshold * 100).toFixed(0)}%).`
      },
      {
        id: "RF-6",
        name: "Repeat Winner Pattern",
        score: 20,
        severity: "high",
        detected: vendorPastWins >= 3,
        explanation: `Vendor has won ${vendorPastWins} contracts from this department.`
      },
      {
        id: "RF-7",
        name: "Specification Tailoring (NLP)",
        score: 15,
        severity: "medium",
        detected: nlpResult ? nlpResult.flagged : false,
        explanation: nlpResult
          ? `TF-IDF Cosine Similarity is ${(nlpResult.similarity_score * 100).toFixed(1)}% (threshold: ${(nlpThreshold * 100).toFixed(0)}%).`
          : "Click 'Test NLP Specification' below to compute similarity."
      },
      {
        id: "RF-8",
        name: "Unusual Extensions",
        score: 5,
        severity: "low",
        detected: extensionCount >= 2,
        explanation: `${extensionCount} extensions granted to the winning supplier.`
      }
    ];

    const ruleScore = Math.min(100, flags.filter(f => f.detected).reduce((sum, f) => sum + f.score, 0));
    // Simulated statistical anomaly based on combined outliers
    const anomalyFactor = Math.min(100, (flags.filter(f => f.detected).length * 14) + (deviation > 0.3 ? 25 : 0) + (tenderDays < 5 ? 20 : 0));
    const crs = Math.min(100, Math.round(0.80 * ruleScore + 0.20 * anomalyFactor));
    const riskLevel = crs >= 70 ? "high" : crs >= 40 ? "medium" : "low";

    return { flags, ruleScore, anomalyFactor, crs, riskLevel };
  };

  const handleRunNlp = async () => {
    setNlpLoading(true);
    try {
      const res = await api.post("/nlp/analyze", {
        specification: specificationText,
        vendor_description: vendorCatalogText,
        threshold: nlpThreshold
      });
      setNlpResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setNlpLoading(false);
    }
  };

  const { flags, ruleScore, anomalyFactor, crs, riskLevel } = calculateFlags();
  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">FORENSIC SIMULATION LAB</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Risk Engine Sensitivity Sandbox</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Simulate procurement risk scenarios and test how heuristic threshold sensitivity affects the Corruption Risk Score (CRS).
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Threshold Configuration */}
        <div className="card">
          <div className="card-title">⚙️ Policy & Threshold Settings</div>
          <div style={{ display: "grid", gap: 14, fontSize: 13 }}>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 4 }}>
                <span>Statutory Approval Limit</span>
                <strong className="font-mono">{formatINR(approvalThreshold)}</strong>
              </label>
              <input
                type="range"
                min="1000000"
                max="20000000"
                step="500000"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 4 }}>
                <span>Min. Tender Window (Days)</span>
                <strong>{durationThreshold} Days</strong>
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={durationThreshold}
                onChange={(e) => setDurationThreshold(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 4 }}>
                <span>Max Estimate Deviation</span>
                <strong>{(priceDevThreshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={priceDevThreshold}
                onChange={(e) => setPriceDevThreshold(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 4 }}>
                <span>Vendor Concentration Limit (Lock-in)</span>
                <strong>{(vendorLockinThreshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.30"
                max="0.90"
                step="0.05"
                value={vendorLockinThreshold}
                onChange={(e) => setVendorLockinThreshold(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: 4 }}>
                <span>NLP Specification Similarity Threshold</span>
                <strong>{(nlpThreshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={nlpThreshold}
                onChange={(e) => setNlpThreshold(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Contract Scenario Input */}
        <div className="card">
          <div className="card-title">📝 Simulated Contract Parameters</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Sanctioned Estimate (₹)</label>
              <input
                type="number"
                className="input-field"
                value={estimateValue}
                onChange={(e) => setEstimateValue(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Awarded Value (₹)</label>
              <input
                type="number"
                className="input-field"
                value={awardValue}
                onChange={(e) => setAwardValue(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Tender Open Days</label>
              <input
                type="number"
                className="input-field"
                value={tenderDays}
                onChange={(e) => setTenderDays(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Bidder Count</label>
              <input
                type="number"
                className="input-field"
                value={bidderCount}
                onChange={(e) => setBidderCount(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Vendor Past Wins in Dept</label>
              <input
                type="number"
                className="input-field"
                value={vendorPastWins}
                onChange={(e) => setVendorPastWins(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Total Department Tenders</label>
              <input
                type="number"
                className="input-field"
                value={totalDeptContracts}
                onChange={(e) => setTotalDeptContracts(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 12 }}>Contract Extension Count</label>
              <input
                type="number"
                className="input-field"
                value={extensionCount}
                onChange={(e) => setExtensionCount(Number(e.target.value))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Calculated CRS Gauge */}
      <div className="card" style={{ marginBottom: 24, borderColor: crs >= 70 ? "var(--risk-high-border)" : "var(--border-color)" }}>
        <div className="card-title">
          <span>Live Calculated Corruption Risk Score (CRS)</span>
          <span className={`risk-badge ${riskLevel}`} style={{ fontSize: 14 }}>{riskLevel} Risk</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "14px 0", flexWrap: "wrap" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: `conic-gradient(${crs >= 70 ? "#ef4444" : crs >= 40 ? "#f59e0b" : "#10b981"} ${crs * 3.6}deg, #1e293b 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{crs}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>CRS</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Rule Engine Score (80%):</span>{" "}
                <strong>{ruleScore} / 100</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Anomaly Score (20%):</span>{" "}
                <strong>{anomalyFactor.toFixed(1)} / 100</strong>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              Formula: <code>CRS = round(0.80 × {ruleScore} + 0.20 × {anomalyFactor.toFixed(1)}) = {crs}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Red Flags Evaluated */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <span>Evaluated Heuristics ({flags.filter(f => f.detected).length} Detected)</span>
        </div>
        <div className="red-flags-grid">
          {flags.map((f) => (
            <div key={f.id} className={`flag-card ${f.detected ? "detected" : ""}`}>
              <div className="flag-header">
                <span className="font-mono" style={{ fontWeight: 700, color: f.detected ? "var(--risk-high)" : "var(--text-muted)" }}>{f.id}</span>
                <span className={`risk-badge ${f.detected ? f.severity : "low"}`}>
                  {f.detected ? `+${f.score} pts` : "Cleared"}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{f.name}</div>
              <div className="flag-explanation">{f.explanation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NLP Specification Similarity Tool */}
      <div className="card">
        <div className="card-title">
          <span>TF-IDF NLP Specification Comparison (RF-7)</span>
          <button className="btn btn-primary" onClick={handleRunNlp} disabled={nlpLoading} style={{ padding: "6px 14px", fontSize: 13 }}>
            {nlpLoading ? "Analyzing..." : "Test NLP Specification"}
          </button>
        </div>
        <div className="grid-2">
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>TENDER SPECIFICATION</label>
            <textarea
              className="input-field"
              rows={3}
              style={{ width: "100%", marginTop: 4, fontSize: 13 }}
              value={specificationText}
              onChange={(e) => setSpecificationText(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>VENDOR PRODUCT CATALOG</label>
            <textarea
              className="input-field"
              rows={3}
              style={{ width: "100%", marginTop: 4, fontSize: 13 }}
              value={vendorCatalogText}
              onChange={(e) => setVendorCatalogText(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
