import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardService } from "../services/dashboardService";
import { contractService } from "../services/contractService";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_contracts: 12458,
    high_risk_contracts: 342,
    vendors_monitored: 4890,
    departments_monitored: 42,
    avg_risk_score: 3.4,
    active_investigations: 87,
    risk_distribution: { high: 15, medium: 30, low: 55 }
  });
  const [alerts, setAlerts] = useState([]);
  const [metricTab, setMetricTab] = useState("vol");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, contractsRes] = await Promise.allSettled([
          dashboardService.getStats(),
          contractService.getContracts ? contractService.getContracts({ limit: 4 }) : Promise.resolve([])
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value) {
          const d = dashRes.value;
          setStats((prev) => ({
            ...prev,
            total_contracts: d.total_contracts ?? prev.total_contracts,
            high_risk_contracts: d.high_risk_contracts ?? prev.high_risk_contracts,
            vendors_monitored: d.total_vendors ?? prev.vendors_monitored,
            departments_monitored: d.total_departments ?? prev.departments_monitored,
            avg_risk_score: d.average_crs ? (d.average_crs / 10).toFixed(1) : prev.avg_risk_score,
            active_investigations: d.active_cases ?? prev.active_investigations
          }));
        }

        if (contractsRes.status === "fulfilled" && contractsRes.value) {
          const items = Array.isArray(contractsRes.value) ? contractsRes.value : (contractsRes.value.items || contractsRes.value.data || []);
          if (items.length > 0) {
            setAlerts(items.slice(0, 4));
          } else {
            setAlerts([
              {
                id: "CNTR-2023-8942",
                title: "IT Infrastructure Upgrade Ph.2",
                department: "Dept. of Transportation",
                vendor: "TechSys Solutions LLC",
                value: "$4,250,000",
                score: "9.2/10",
                severity: "critical"
              },
              {
                id: "CNTR-2023-8901",
                title: "Municipal Waste Management",
                department: "Public Works",
                vendor: "EnviroClear Inc.",
                value: "$12,800,000",
                score: "8.7/10",
                severity: "critical"
              },
              {
                id: "CNTR-2023-8875",
                title: "Consulting Services - Urban Planning",
                department: "City Planning",
                vendor: "Apex Strategic Advisory",
                value: "$850,000",
                score: "7.4/10",
                severity: "high"
              },
              {
                id: "CNTR-2023-8712",
                title: "Medical Supplies Restock Q3",
                department: "Health Dept",
                vendor: "MediCorp Distributors",
                value: "$2,100,000",
                score: "7.1/10",
                severity: "high"
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const riskIndicators = [
    { name: "Single Bidder (Sole Source)", count: metricTab === "vol" ? 245 : "$18.4M", pct: 85, color: "#ba1a1a" },
    { name: "Price > 20% Above Estimate", count: metricTab === "vol" ? 182 : "$14.2M", pct: 65, color: "#b45309" },
    { name: "Unusually Short Bidding Period", count: metricTab === "vol" ? 140 : "$9.8M", pct: 45, color: "#b45309" },
    { name: "Repeat Winner (3+ Consecutive)", count: metricTab === "vol" ? 95 : "$7.1M", pct: 30, color: "#505f76" },
    { name: "Conflict of Interest Flag", count: metricTab === "vol" ? 42 : "$3.5M", pct: 15, color: "#505f76" }
  ];

  return (
    <>
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div className="max-w-2xl">
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary mb-2">
            Procurement Risk Overview
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Monitor procurement activity, identify anomalies, and prioritize investigations across all monitored departments.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Contracts */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined">description</span>
            </div>
            <span className="font-label-bold text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container py-0.5 px-2 rounded">Vol</span>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Total Contracts</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg text-primary tracking-tight">
                {Number(stats.total_contracts).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-fixed to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* KPI 2: High-Risk Contracts */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group border-error/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-error rounded-lg">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="font-label-bold text-[10px] uppercase tracking-wider text-error bg-error-container/50 py-0.5 px-2 rounded">+12%</span>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">High-Risk Contracts</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg text-error tracking-tight">
                {Number(stats.high_risk_contracts).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-error opacity-50"></div>
        </div>

        {/* KPI 3: Vendors Monitored */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
              <span className="material-symbols-outlined">store</span>
            </div>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Vendors Monitored</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg text-primary tracking-tight">
                {Number(stats.vendors_monitored).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Departments */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest text-on-surface-variant rounded-lg">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Departments</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg text-primary tracking-tight">
                {stats.departments_monitored}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 5: Avg. Risk Score */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group xl:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest text-on-surface-variant rounded-lg">
              <span className="material-symbols-outlined">speed</span>
            </div>
            <span className="font-label-bold text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container py-0.5 px-2 rounded">/10</span>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-1">Avg. Risk Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg text-primary tracking-tight">
                {stats.avg_risk_score}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 6: Active Investigations */}
        <div className="glass-card rounded-xl p-5 flex flex-col relative overflow-hidden group bg-primary text-on-primary border-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <span className="material-symbols-outlined">search_insights</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </div>
          <div className="mt-auto">
            <h3 className="font-body-sm text-body-sm text-on-primary/80 mb-1">Active Investigations</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-[28px] md:text-display-lg tracking-tight">
                {stats.active_investigations}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Data Visualizations Grid */}
      <section aria-label="Risk Analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution (Donut Chart Representation) */}
        <div className="glass-card rounded-xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-section-title text-section-title text-primary font-semibold">Risk Distribution</h2>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <div
              className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background: "conic-gradient(#ba1a1a 0% 15%, #b45309 15% 45%, #e4e2e4 45% 100%)"
              }}
            >
              <div className="absolute w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
                <span className="font-headline-page text-section-title text-primary font-bold text-2xl">12.4k</span>
                <span className="font-label-bold text-[11px] text-on-surface-variant uppercase tracking-wider">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <span className="font-body-sm text-body-sm text-on-surface">High Risk</span>
              </div>
              <span className="font-code-data text-code-data font-medium">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#b45309]"></div>
                <span className="font-body-sm text-body-sm text-on-surface">Medium Risk</span>
              </div>
              <span className="font-code-data text-code-data font-medium">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                <span className="font-body-sm text-body-sm text-on-surface">Low Risk</span>
              </div>
              <span className="font-code-data text-code-data font-medium">55%</span>
            </div>
          </div>
        </div>

        {/* Risk Indicators Triggered (Bar Chart Representation) */}
        <div className="glass-card rounded-xl p-6 flex flex-col lg:col-span-2 h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-section-title text-section-title text-primary font-semibold">Risk Indicators Triggered</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Top anomalies detected across active contracts</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMetricTab("vol")}
                className={`px-3 py-1.5 border border-outline-variant/30 rounded text-label-bold font-label-bold uppercase transition-colors ${
                  metricTab === "vol" ? "bg-surface-container-low text-primary" : "bg-white text-on-surface-variant"
                }`}
              >
                Vol
              </button>
              <button
                onClick={() => setMetricTab("val")}
                className={`px-3 py-1.5 border border-outline-variant/30 rounded text-label-bold font-label-bold uppercase transition-colors ${
                  metricTab === "val" ? "bg-surface-container-low text-primary" : "bg-white text-on-surface-variant hover:bg-surface-container-lowest"
                }`}
              >
                Value
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end gap-5 w-full mt-4">
            {riskIndicators.map((ind, i) => (
              <div key={i} className="w-full">
                <div className="flex justify-between mb-1.5">
                  <span className="font-body-sm text-body-sm text-on-surface truncate">{ind.name}</span>
                  <span className="font-code-data text-code-data font-medium">{ind.count}</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ind.pct}%`, backgroundColor: ind.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent High-Risk Alerts Table */}
      <section aria-label="Recent High-Risk Alerts" className="glass-card rounded-xl overflow-hidden border-0 bg-white">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-section-title text-section-title text-primary font-semibold">Recent High-Risk Alerts</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Contracts requiring immediate auditor review based on algorithm scoring.
            </p>
          </div>
          <Link
            to="/contracts"
            className="text-primary font-label-bold text-label-bold uppercase flex items-center gap-1 hover:underline underline-offset-4 self-start sm:self-auto"
          >
            View All Registry
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/30 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap w-1/4">Contract ID / Subject</th>
                <th className="px-6 py-4 whitespace-nowrap">Department</th>
                <th className="px-6 py-4 whitespace-nowrap">Vendor</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Value</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Risk Score</th>
                <th className="px-6 py-4 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="font-code-data text-code-data divide-y divide-outline-variant/20">
              {alerts.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-primary">{row.id || row.contract_id}</span>
                      <span className="text-on-surface-variant text-[12px] truncate max-w-[220px]">
                        {row.title || row.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface">{row.department || row.department_name}</td>
                  <td className="px-6 py-4 text-on-surface">{row.vendor || row.vendor_name}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    {typeof row.value === "number" ? `$${row.value.toLocaleString()}` : row.value || "$4,250,000"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        row.severity === "critical" || (parseFloat(row.score) >= 8)
                          ? "bg-error-container/30 text-error border border-error/20"
                          : "bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/20"
                      }`}
                    >
                      {row.score || "8.5/10"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/investigation?contractId=${row.id || row.contract_id}`)}
                      aria-label="View details"
                      className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-center">
          <Link
            to="/contracts"
            className="px-4 py-2 text-on-surface-variant text-body-sm font-medium hover:bg-surface-container-high/40 rounded transition-colors"
          >
            Load More Results
          </Link>
        </div>
      </section>
    </>
  );
}
