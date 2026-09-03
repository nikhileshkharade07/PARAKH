import { useState, useMemo } from "react";
import { api } from "../services/api";

export default function SimulatorPage() {
  // Stitch sliders state
  const [vendorRisk, setVendorRisk] = useState(65);
  const [priceVariance, setPriceVariance] = useState(19);
  const [bidAnomaly, setBidAnomaly] = useState(88);
  const [networkExposure, setNetworkExposure] = useState(4.2);

  // Policy Thresholds
  const [approvalThreshold, setApprovalThreshold] = useState(5000000);
  const [windowThreshold, setWindowThreshold] = useState(7);
  const [awardValue, setAwardValue] = useState(4850000);

  // Reset to default
  const handleReset = () => {
    setVendorRisk(65);
    setPriceVariance(12);
    setBidAnomaly(88);
    setNetworkExposure(4.2);
  };

  // Dynamic CRS Calculation following PARAKH Hybrid Formula
  const simulation = useMemo(() => {
    // Weightings: 30% Vendor Risk + 25% Price Drift + 25% Bid Pattern + 20% Network Exposure
    const vendorPts = Math.round((vendorRisk / 100) * 30);
    const pricePts = Math.round((Math.max(0, priceVariance + 10) / 60) * 25);
    const bidPts = Math.round((bidAnomaly / 100) * 25);
    const netPts = Math.round((networkExposure / 10) * 20);

    const totalCRS = Math.min(100, Math.max(10, vendorPts + pricePts + bidPts + netPts));
    const riskLevel = totalCRS >= 70 ? "CRITICAL RISK" : totalCRS >= 40 ? "MEDIUM RISK" : "LOW RISK";

    return {
      totalCRS,
      riskLevel,
      vendorPts,
      pricePts,
      bidPts,
      netPts,
      flagsTriggered: [
        vendorRisk >= 60 ? "RF-2 (Vendor Lock-in)" : null,
        priceVariance >= 15 ? "RF-5 (Price Escalation Drift)" : null,
        bidAnomaly >= 70 ? "RF-1 (Single Bidder Cartel)" : null,
        networkExposure >= 3.5 ? "RF-6 (Repeat Winner Pattern)" : null
      ].filter(Boolean)
    };
  }, [vendorRisk, priceVariance, bidAnomaly, networkExposure]);

  const riskClass = simulation.totalCRS >= 70 ? "critical" : simulation.totalCRS >= 40 ? "medium" : "low";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: "var(--color-secondary-fixed)",
              color: "var(--color-on-secondary-fixed)"
            }}
          >
            Simulation Lab
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)" }}>
            • Live Algorithmic Sensitivity Workbench
          </span>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
          Risk Sandbox Simulator
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", maxWidth: "48rem", marginTop: "0.25rem" }}>
          Model hypothetical corruption vectors, stress-test indicator thresholds, and analyze attribution deltas across multi-tier procurement signals in real time.
        </p>
      </div>

      {/* Main 2-Column Workbench Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
        {/* LEFT COLUMN: Input Sliders & Model Parameters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Slider Control Card */}
          <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--color-on-surface)" }}>
                  tune
                </span>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                  Heuristic & Statistical Parameter Sliders
                </h2>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  refresh
                </span>
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Vendor Risk Profile */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Vendor Risk Profile & History
                </label>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.8125rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", backgroundColor: "var(--color-surface-low)", color: "var(--color-on-surface)" }}>
                  {vendorRisk}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={vendorRisk}
                onChange={(e) => setVendorRisk(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                <span>Clean Record (0%)</span>
                <span>High Collusion Exposure (100%)</span>
              </div>
            </div>

            {/* Slider 2: Price Variance vs Average */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Price Variance vs Sanctioned Estimate
                </label>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.8125rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", backgroundColor: "var(--color-surface-low)", color: priceVariance >= 15 ? "var(--color-error)" : "var(--color-on-surface)" }}>
                  {priceVariance >= 0 ? `+${priceVariance}%` : `${priceVariance}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                value={priceVariance}
                onChange={(e) => setPriceVariance(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                <span>Under Bid (-30%)</span>
                <span>Over Bid (+50%)</span>
              </div>
            </div>

            {/* Slider 3: Bid Pattern Anomaly */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Bid Pattern & Cartel Anomaly
                </label>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.8125rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", backgroundColor: "var(--color-error-container)", color: "var(--color-error)" }}>
                  {bidAnomaly}/100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bidAnomaly}
                onChange={(e) => setBidAnomaly(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-error)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                <span>Competitive Tenders (0)</span>
                <span>Single Bidder Monopoly (100)</span>
              </div>
            </div>

            {/* Slider 4: Network Exposure */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Network Exposure (Tier 2/3 Centrality)
                </label>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.8125rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", backgroundColor: "var(--color-surface-low)", color: "var(--color-on-surface)" }}>
                  {networkExposure}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={networkExposure}
                onChange={(e) => setNetworkExposure(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                <span>Isolated Entity (0.0)</span>
                <span>High Cross-Department Cartel (10.0)</span>
              </div>
            </div>
          </div>

          {/* Model Parameters Card */}
          <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-on-surface-variant)" }}>
                Model Parameters & Governance
              </span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6875rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", backgroundColor: "var(--color-surface-low)", color: "var(--color-on-surface)" }}>
                LIVE PIPELINE
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", backgroundColor: "var(--color-surface-low)", padding: "0.75rem", borderRadius: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Base Model:</span>
                <strong>Procurement_Audit_v4.2 (Hybrid Ensemble)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Formula:</span>
                <span style={{ fontFamily: "JetBrains Mono" }}>0.80 × RuleScore + 0.20 × AnomalyScore</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Confidence Interval:</span>
                <span style={{ fontFamily: "JetBrains Mono" }}>95% (Two-tailed Z-score ±1.96)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Audit Horizon:</span>
                <span>OCDS Public Ledger (2017–2024)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Simulated CRS & Attribution Deltas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Simulated Score Card */}
          <div
            className="stitch-card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "2rem 1.5rem",
              borderTop: simulation.totalCRS >= 70 ? "4px solid var(--color-error)" : "4px solid var(--color-warning)"
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-on-surface-variant)" }}>
              Simulated Corruption Risk Score
            </span>

            <div style={{ margin: "1rem 0 0.5rem 0", display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span style={{ fontSize: "3.5rem", fontWeight: 900, fontFamily: "JetBrains Mono", lineHeight: 1, color: simulation.totalCRS >= 70 ? "var(--color-error)" : "var(--color-warning)" }}>
                {simulation.totalCRS}
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-on-surface-variant)" }}>
                / 100
              </span>
            </div>

            <span className={`risk-pill ${riskClass}`} style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem" }}>
              {simulation.riskLevel}
            </span>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-on-surface-variant)", marginTop: "0.75rem", maxWidth: "22rem" }}>
              {simulation.totalCRS >= 70
                ? "High statutory review priority. Meets or exceeds vigilance charge sheet recommendation criteria."
                : "Moderate risk level. Procedural indicators warrant sample audit review."}
            </p>
          </div>

          {/* Attribution Delta Breakdown Card */}
          <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
              Risk Score Attribution Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Attribution 1 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>Vendor Risk Profile</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-primary)" }}>
                    +{simulation.vendorPts} pts
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "var(--color-surface-low)", overflow: "hidden" }}>
                  <div style={{ width: `${(simulation.vendorPts / 30) * 100}%`, height: "100%", backgroundColor: "var(--color-primary)" }} />
                </div>
              </div>

              {/* Attribution 2 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>Price Escalation vs Benchmark</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-error)" }}>
                    +{simulation.pricePts} pts
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "var(--color-surface-low)", overflow: "hidden" }}>
                  <div style={{ width: `${(simulation.pricePts / 25) * 100}%`, height: "100%", backgroundColor: "var(--color-error)" }} />
                </div>
              </div>

              {/* Attribution 3 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>Bid Pattern & Collusion</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-error)" }}>
                    +{simulation.bidPts} pts
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "var(--color-surface-low)", overflow: "hidden" }}>
                  <div style={{ width: `${(simulation.bidPts / 25) * 100}%`, height: "100%", backgroundColor: "var(--color-error)" }} />
                </div>
              </div>

              {/* Attribution 4 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>Network Exposure Centrality</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-secondary)" }}>
                    +{simulation.netPts} pts
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "var(--color-surface-low)", overflow: "hidden" }}>
                  <div style={{ width: `${(simulation.netPts / 20) * 100}%`, height: "100%", backgroundColor: "var(--color-secondary)" }} />
                </div>
              </div>
            </div>

            {/* Triggered Flags list */}
            <div style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: "0.75rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                Triggered Heuristic Semaphores:
              </span>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                {simulation.flagsTriggered.length > 0 ? (
                  simulation.flagsTriggered.map((flag, i) => (
                    <span key={i} className="risk-pill critical" style={{ fontSize: "0.6875rem" }}>
                      {flag}
                    </span>
                  ))
                ) : (
                  <span className="risk-pill low" style={{ fontSize: "0.6875rem" }}>
                    No critical thresholds violated
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
