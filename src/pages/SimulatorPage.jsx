import React, { useState } from "react";

export default function SimulatorPage() {
  const [vendorRisk, setVendorRisk] = useState(65);
  const [priceVariance, setPriceVariance] = useState(18);
  const [specSimilarity, setSpecSimilarity] = useState(72);
  const [biddingDays, setBiddingDays] = useState(7);
  const [bidderCount, setBidderCount] = useState(2);
  const [isShellCompany, setIsShellCompany] = useState(true);
  const [hasCrossDirectorship, setHasCrossDirectorship] = useState(true);

  // Dynamic CRS Calculation
  const calculateCRS = () => {
    let score = (vendorRisk * 0.25) + (Math.max(0, priceVariance) * 1.2) + (specSimilarity * 0.3);
    if (biddingDays < 10) score += (10 - biddingDays) * 2.5;
    if (bidderCount <= 2) score += 15;
    if (isShellCompany) score += 18;
    if (hasCrossDirectorship) score += 15;
    return Math.min(100, Math.round(score));
  };

  const crs = calculateCRS();

  const handleReset = () => {
    setVendorRisk(50);
    setPriceVariance(5);
    setSpecSimilarity(30);
    setBiddingDays(21);
    setBidderCount(5);
    setIsShellCompany(false);
    setHasCrossDirectorship(false);
  };

  return (
    <>
      {/* Page Header */}
      <header className="border-b border-outline-variant/20 pb-6 mb-8">
        <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight mb-2">
          Risk Sandbox
        </h1>
        <p className="font-body-base text-body-base text-on-surface-variant max-w-2xl">
          Model risk scenarios and understand how individual signals affect the overall risk score.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Simulator Inputs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
              <h2 className="font-section-title text-section-title text-primary flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[20px]">tune</span>
                Risk Score Simulator
              </h2>
              <button
                onClick={handleReset}
                className="text-on-surface-variant hover:text-primary text-body-sm font-label-bold flex items-center gap-1 transition-colors text-xs font-semibold uppercase"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span> Reset
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Slider 1: Vendor Risk */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-bold text-label-bold text-on-surface uppercase text-[11px]">
                    Vendor Risk Profile
                  </label>
                  <span className="font-code-data text-code-data text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[12px] tabular-nums">
                    {vendorRisk}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vendorRisk}
                  onChange={(e) => setVendorRisk(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>Low (Historical)</span>
                  <span>High (New/Flagged)</span>
                </div>
              </div>

              {/* Slider 2: Price Variance */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-bold text-label-bold text-on-surface uppercase text-[11px]">
                    Price Variance vs Estimate
                  </label>
                  <span className="font-code-data text-code-data text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[12px] tabular-nums">
                    {priceVariance > 0 ? `+${priceVariance}%` : `${priceVariance}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="60"
                  value={priceVariance}
                  onChange={(e) => setPriceVariance(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>-20% Under Budget</span>
                  <span>+60% Over Estimate</span>
                </div>
              </div>

              {/* Slider 3: Spec Similarity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-bold text-label-bold text-on-surface uppercase text-[11px]">
                    Specification Similarity
                  </label>
                  <span className="font-code-data text-code-data text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[12px] tabular-nums">
                    {specSimilarity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={specSimilarity}
                  onChange={(e) => setSpecSimilarity(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>Standard RFP Specs</span>
                  <span>Tailored to Vendor Catalog</span>
                </div>
              </div>

              {/* Slider 4: Bidding Window */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-bold text-label-bold text-on-surface uppercase text-[11px]">
                    Tender Bidding Duration
                  </label>
                  <span className="font-code-data text-code-data text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[12px] tabular-nums">
                    {biddingDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="45"
                  value={biddingDays}
                  onChange={(e) => setBiddingDays(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>3 Days (Compressed)</span>
                  <span>45 Days (CVC Standard)</span>
                </div>
              </div>

              {/* Slider 5: Qualified Bidders */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-bold text-label-bold text-on-surface uppercase text-[11px]">
                    Qualified Bidders Count
                  </label>
                  <span className="font-code-data text-code-data text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[12px] tabular-nums">
                    {bidderCount} Bidders
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={bidderCount}
                  onChange={(e) => setBidderCount(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>1 (Sole Source)</span>
                  <span>10+ (Competitive)</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-body-sm font-medium text-on-surface">Shell Company Nexus Indicator</span>
                  <input
                    type="checkbox"
                    checked={isShellCompany}
                    onChange={(e) => setIsShellCompany(e.target.checked)}
                    className="w-4 h-4 accent-black rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-body-sm font-medium text-on-surface">Cross-Directorship Syndicate</span>
                  <input
                    type="checkbox"
                    checked={hasCrossDirectorship}
                    onChange={(e) => setHasCrossDirectorship(e.target.checked)}
                    className="w-4 h-4 accent-black rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Projected CRS Output (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-card rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-label-bold text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container py-0.5 px-2.5 rounded">
                  Simulation Outcome
                </span>
                <h3 className="font-headline-page text-2xl font-bold text-primary mt-2">
                  Projected Composite Risk Score
                </h3>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                  crs >= 75
                    ? "bg-error-container/30 text-error border border-error/30"
                    : crs >= 50
                    ? "bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30"
                    : "bg-[#047857]/10 text-[#047857] border border-[#047857]/30"
                }`}
              >
                {crs >= 75 ? "CRITICAL RISK" : crs >= 50 ? "ELEVATED RISK" : "CONFORMANT"}
              </div>
            </div>

            {/* Big Score Gauge */}
            <div className="flex items-baseline gap-3 my-6">
              <span className="font-display-lg text-6xl font-extrabold text-primary tracking-tight">
                {crs}
              </span>
              <span className="text-2xl text-on-surface-variant font-medium">/ 100 CRS</span>
            </div>

            {/* Score Bar */}
            <div className="w-full bg-surface-container-high h-3.5 rounded-full overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${crs}%`,
                  backgroundColor: crs >= 75 ? "#ba1a1a" : crs >= 50 ? "#b45309" : "#047857"
                }}
              ></div>
            </div>

            {/* Contribution Breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/20">
              <div>
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">Pricing Weight</div>
                <div className="text-lg font-bold text-primary font-display mt-0.5">
                  {Math.round(Math.max(0, priceVariance) * 1.2)} pts
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">Vendor Profile</div>
                <div className="text-lg font-bold text-primary font-display mt-0.5">
                  {Math.round(vendorRisk * 0.25)} pts
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">Syndicate Risk</div>
                <div className="text-lg font-bold text-primary font-display mt-0.5">
                  {(isShellCompany ? 18 : 0) + (hasCrossDirectorship ? 15 : 0)} pts
                </div>
              </div>
            </div>
          </div>

          {/* Remediation Recommendations */}
          <div className="glass-card rounded-xl p-6 shadow-sm">
            <h4 className="font-section-title text-base font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Automated Policy Recommendations
            </h4>
            <ul className="space-y-2.5 text-body-sm text-on-surface-variant text-sm">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>
                  Extend tender publication window from <strong>{biddingDays} days</strong> to at least <strong>21 days</strong> to conform with CVC transparency guidelines.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>
                  Require minimum of <strong>3 independent verified bidders</strong> before technical evaluation unlocking.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>
                  Perform automated MCA-21 cross-verification for beneficial ownership and shared directors.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
