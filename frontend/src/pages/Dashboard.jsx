import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

/* =========================================================
   DATA
========================================================= */

const useDashboardData = () => {
  const [stats, setStats] = useState({});
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    setStats({
      totalContracts: 2450,
      highRiskContracts: 342,
      avgCRS: 45.6,
      totalVendors: 890,
    });

    setRiskDistribution([
      { name: "Low Risk", value: 850 },
      { name: "Medium Risk", value: 1258 },
      { name: "High Risk", value: 342 },
    ]);

    setContracts([
      {
        id: "C001",
        vendor: "TechCorp Solutions",
        department: "IT Department",
        value: 750000,
        crs: 85,
      },
      {
        id: "C002",
        vendor: "BuildRight Inc",
        department: "Public Works",
        value: 1200000,
        crs: 78,
      },
      {
        id: "C003",
        vendor: "OfficeSupplies Ltd",
        department: "Admin Department",
        value: 45000,
        crs: 62,
      },
      {
        id: "C004",
        vendor: "Urban Infrastructure",
        department: "Public Works",
        value: 950000,
        crs: 73,
      },
    ]);
  }, []);

  return {
    stats,
    riskDistribution,
    contracts,
  };
};

/* =========================================================
   ANIMATED NUMBER
========================================================= */

function AnimatedNumber({ value, decimals = 0 }) {
  const [number, setNumber] = useState(0);

  useEffect(() => {
    if (value === undefined) return;

    const startValue = 0;
    const start = performance.now();
    const duration = 1100;

    const update = (time) => {
      const progress = Math.min((time - start) / duration, 1);

      const eased =
        1 - Math.pow(1 - progress, 4);

      setNumber(
        startValue + (value - startValue) * eased
      );

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return decimals
    ? number.toFixed(decimals)
    : Math.round(number).toLocaleString();
}

/* =========================================================
   MINI SPARKLINE
========================================================= */

function Sparkline({ points = "0,28 15,22 30,25 45,12 60,17 75,8 90,10 105,3" }) {
  return (
    <svg
      className="hero-sparkline"
      viewBox="0 0 105 32"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <polyline
        points={`0,31 ${points} 105,31`}
        fill="currentColor"
        opacity=".08"
      />
    </svg>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {
  const {
    stats,
    riskDistribution,
    contracts,
  } = useDashboardData();

  const [period, setPeriod] = useState("30D");
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState("overview");

  const pieColors = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
  ];

  const riskAlerts = useMemo(() => {
    return contracts
      .filter((contract) => contract.crs >= 70)
      .sort((a, b) => b.crs - a.crs);
  }, [contracts]);

  const chartData = {
    "7D": [
      { name: "Mon", low: 48, medium: 65, high: 22 },
      { name: "Tue", low: 55, medium: 71, high: 25 },
      { name: "Wed", low: 62, medium: 68, high: 19 },
      { name: "Thu", low: 58, medium: 76, high: 27 },
      { name: "Fri", low: 72, medium: 81, high: 31 },
      { name: "Sat", low: 65, medium: 74, high: 26 },
      { name: "Sun", low: 78, medium: 85, high: 29 },
    ],

    "30D": [
      { name: "W1", low: 190, medium: 275, high: 82 },
      { name: "W2", low: 240, medium: 330, high: 91 },
      { name: "W3", low: 205, medium: 302, high: 78 },
      { name: "W4", low: 215, medium: 351, high: 91 },
    ],

    "90D": [
      { name: "Jan", low: 720, medium: 950, high: 220 },
      { name: "Feb", low: 810, medium: 1100, high: 270 },
      { name: "Mar", low: 890, medium: 1250, high: 315 },
      { name: "Apr", low: 1050, medium: 1480, high: 410 },
    ],
  };

  const totalRisk =
    riskDistribution.reduce(
      (sum, item) => sum + item.value,
      0
    );

  const highRiskPercentage =
    totalRisk > 0
      ? ((stats.highRiskContracts / totalRisk) * 100).toFixed(1)
      : 0;

  return (
    <div className="dashboard dashboard-pro">

      {/* =====================================================
          VISUAL BACKGROUND
      ===================================================== */}

      <div className="dashboard-background">
        <div className="dashboard-orb orb-purple" />
        <div className="dashboard-orb orb-blue" />
        <div className="dashboard-grid-bg" />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="dashboard-hero">

        <div className="hero-content">

          <div className="hero-eyebrow">
            <span className="live-dot" />
            PROCUREMENT INTELLIGENCE PLATFORM
          </div>

          <h1>
            Procurement
            <span> Risk Command Center</span>
          </h1>

          <p>
            Monitor contract exposure, vendor risk and
            procurement signals from one intelligent workspace.
          </p>

          <div className="hero-actions">

            <Link
              to="/contracts"
              className="hero-primary"
            >
              <span>◈</span>
              Investigate Risks
              <b>→</b>
            </Link>

            <button className="hero-secondary">
              <span>↓</span>
              Export Report
            </button>

          </div>

        </div>

        {/* HERO RISK PANEL */}

        <div className="hero-risk-panel">

          <div className="hero-panel-top">
            <div>
              <span>PORTFOLIO HEALTH</span>
              <strong>Good</strong>
            </div>

            <div className="hero-status">
              <span />
              LIVE
            </div>
          </div>

          <div className="hero-score">

            <div className="score-ring">

              <div>
                <strong>72</strong>
                <small>/100</small>
              </div>

            </div>

            <div className="score-details">

              <span>Risk posture</span>

              <strong>
                Stable
              </strong>

              <p>
                8.4% improvement
                <br />
                compared with last period
              </p>

            </div>

          </div>

          <div className="hero-chart">

            <div className="chart-label">
              <span>Risk trend</span>
              <b>+8.4%</b>
            </div>

            <Sparkline />

          </div>

        </div>

      </section>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="dashboard-toolbar">

        <div className="toolbar-left">

          <div className="dashboard-breadcrumb">
            OVERVIEW
            <span>/</span>
            DASHBOARD
          </div>

        </div>

        <div className="toolbar-right">

          <button
            className={`refresh-toggle ${
              autoRefresh ? "enabled" : ""
            }`}
            onClick={() =>
              setAutoRefresh(!autoRefresh)
            }
          >
            <span className="refresh-indicator" />
            Auto refresh
          </button>

          <button className="toolbar-button">
            ⚙ Settings
          </button>

        </div>

      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <section className="pro-stats-grid">

        <div className="pro-stat-card blue">

          <div className="pro-stat-top">
            <div className="pro-stat-icon">
              ▤
            </div>

            <span className="pro-stat-trend">
              ↑ 12.5%
            </span>
          </div>

          <div className="pro-stat-body">

            <span>Total Contracts</span>

            <strong>
              <AnimatedNumber
                value={stats.totalContracts}
              />
            </strong>

            <small>
              Active procurement agreements
            </small>

          </div>

          <div className="stat-visual">
            <Sparkline
              points="0,27 15,22 30,24 45,16 60,19 75,9 90,13 105,4"
            />
          </div>

        </div>

        <div className="pro-stat-card red">

          <div className="pro-stat-top">
            <div className="pro-stat-icon">
              !
            </div>

            <span className="pro-stat-trend danger">
              Attention
            </span>
          </div>

          <div className="pro-stat-body">

            <span>High Risk Contracts</span>

            <strong>
              <AnimatedNumber
                value={stats.highRiskContracts}
              />
            </strong>

            <small>
              {highRiskPercentage}% of total contracts
            </small>

          </div>

          <div className="stat-progress">
            <span
              style={{
                width: `${highRiskPercentage}%`,
              }}
            />
          </div>

        </div>

        <div className="pro-stat-card purple">

          <div className="pro-stat-top">
            <div className="pro-stat-icon">
              ◈
            </div>

            <span className="pro-stat-trend">
              CRS
            </span>
          </div>

          <div className="pro-stat-body">

            <span>Average Risk Score</span>

            <strong>
              <AnimatedNumber
                value={stats.avgCRS}
                decimals={1}
              />
            </strong>

            <small>
              Contract Risk Score
            </small>

          </div>

          <div className="risk-meter">

            <span />
            <i />
            <b />

          </div>

        </div>

        <div className="pro-stat-card green">

          <div className="pro-stat-top">
            <div className="pro-stat-icon">
              ◎
            </div>

            <span className="pro-stat-trend">
              Active
            </span>
          </div>

          <div className="pro-stat-body">

            <span>Monitored Vendors</span>

            <strong>
              <AnimatedNumber
                value={stats.totalVendors}
              />
            </strong>

            <small>
              Vendors under continuous monitoring
            </small>

          </div>

          <div className="vendor-dots">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN ANALYTICS
      ===================================================== */}

      <section className="analytics-pro-grid">

        {/* RISK DISTRIBUTION */}

        <div className="pro-panel risk-distribution-panel">

          <div className="pro-panel-heading">

            <div>

              <div className="section-kicker">
                RISK INTELLIGENCE
              </div>

              <h2>
                Risk Distribution
              </h2>

              <p>
                Portfolio exposure across risk categories
              </p>

            </div>

            <button className="panel-menu">
              •••
            </button>

          </div>

          <div className="donut-section">

            <ResponsiveContainer
              width="100%"
              height={270}
            >

              <PieChart>

                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={76}
                  outerRadius={112}
                  paddingAngle={5}
                  animationBegin={150}
                  animationDuration={1200}
                  stroke="none"
                >

                  {riskDistribution.map(
                    (entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={pieColors[index]}
                      />
                    )
                  )}

                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    boxShadow:
                      "0 15px 40px rgba(15,23,42,.12)",
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

            <div className="donut-center">

              <span>Total Exposure</span>

              <strong>
                <AnimatedNumber
                  value={totalRisk}
                />
              </strong>

              <small>
                Contracts
              </small>

            </div>

          </div>

          <div className="risk-stat-list">

            <div>
              <span>
                <i className="risk-low" />
                Low Risk
              </span>
              <strong>850</strong>
              <small>34.7%</small>
            </div>

            <div>
              <span>
                <i className="risk-medium" />
                Medium Risk
              </span>
              <strong>1,258</strong>
              <small>51.3%</small>
            </div>

            <div>
              <span>
                <i className="risk-high" />
                High Risk
              </span>
              <strong>342</strong>
              <small>14.0%</small>
            </div>

          </div>

        </div>

        {/* RISK TREND */}

        <div className="pro-panel">

          <div className="pro-panel-heading trend-heading">

            <div>

              <div className="section-kicker">
                PERFORMANCE
              </div>

              <h2>
                Risk Overview
              </h2>

              <p>
                Contract volume by risk classification
              </p>

            </div>

            <div className="period-switch">

              {["7D", "30D", "90D"].map(
                (item) => (
                  <button
                    key={item}
                    className={
                      period === item
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPeriod(item)
                    }
                  >
                    {item}
                  </button>
                )
              )}

            </div>

          </div>

          <div className="chart-summary">

            <div>
              <span>Total monitored</span>
              <strong>
                2,450
              </strong>
            </div>

            <div className="chart-summary-change">
              <span>vs previous period</span>
              <strong>
                ↑ 8.4%
              </strong>
            </div>

          </div>

          <ResponsiveContainer
            width="100%"
            height={290}
          >

            <BarChart
              data={chartData[period]}
              margin={{
                top: 15,
                right: 5,
                left: -25,
                bottom: 5,
              }}
              barGap={7}
            >

              <CartesianGrid
                vertical={false}
                stroke="#eef2f7"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#98a2b3",
                  fontSize: 11,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#98a2b3",
                  fontSize: 10,
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(99,102,241,.045)",
                }}
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  boxShadow:
                    "0 15px 40px rgba(15,23,42,.12)",
                }}
              />

              <Bar
                dataKey="low"
                name="Low Risk"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              />

              <Bar
                dataKey="medium"
                name="Medium Risk"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                animationDuration={950}
              />

              <Bar
                dataKey="high"
                name="High Risk"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                animationDuration={1100}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =====================================================
          INSIGHT STRIP
      ===================================================== */}

      <section className="insight-strip">

        <div className="insight-icon">
          ✦
        </div>

        <div className="insight-content">

          <span>AI RISK INSIGHT</span>

          <strong>
            Medium-risk contracts represent the largest
            exposure in your current portfolio.
          </strong>

          <p>
            Consider reviewing contracts approaching
            the high-risk threshold before the next
            assessment cycle.
          </p>

        </div>

        <Link
          to="/contracts"
          className="insight-button"
        >
          Review exposure →
        </Link>

      </section>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      <section className="pro-panel alerts-panel">

        <div className="pro-panel-heading">

          <div className="alert-heading">

            <div className="alert-symbol">
              !
            </div>

            <div>

              <div className="section-kicker danger-kicker">
                ACTION REQUIRED
              </div>

              <h2>
                Risk Alerts
              </h2>

              <p>
                High-priority contracts requiring review
              </p>

            </div>

          </div>

          <div className="alert-heading-actions">

            <span className="alert-count">
              {riskAlerts.length} Active
            </span>

            <button
              className="collapse-button"
              onClick={() =>
                setAlertsOpen(!alertsOpen)
              }
            >
              {alertsOpen ? "⌃" : "⌄"}
            </button>

          </div>

        </div>

        {alertsOpen && (
          <div className="alert-list">

            {riskAlerts.map((contract, index) => {

              const critical =
                contract.crs >= 80;

              return (
                <Link
                  key={contract.id}
                  to={`/contracts/${contract.id}`}
                  className="alert-item"
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >

                  <div
                    className={`alert-level ${
                      critical
                        ? "critical"
                        : "warning"
                    }`}
                  >
                    !
                  </div>

                  <div className="alert-main">

                    <strong>
                      {contract.vendor}
                    </strong>

                    <span>
                      {contract.id}
                      {" • "}
                      {contract.department}
                    </span>

                  </div>

                  <div className="alert-score">

                    <strong>
                      CRS {contract.crs}
                    </strong>

                    <div>
                      <span
                        style={{
                          width: `${contract.crs}%`,
                        }}
                      />
                    </div>

                  </div>

                  <div className="alert-arrow">
                    →
                  </div>

                </Link>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          CONTRACT TABLE
      ===================================================== */}

      <section className="pro-panel contracts-panel">

        <div className="pro-panel-heading">

          <div>

            <div className="section-kicker">
              MONITORING
            </div>

            <h2>
              High-Risk Contracts
            </h2>

            <p>
              Contracts requiring immediate attention
            </p>

          </div>

          <Link
            to="/contracts"
            className="view-all-button"
          >
            View all contracts →
          </Link>

        </div>

        <div className="professional-table-wrap">

          <table className="professional-table">

            <thead>
              <tr>
                <th>CONTRACT</th>
                <th>VENDOR</th>
                <th>DEPARTMENT</th>
                <th>VALUE</th>
                <th>RISK SCORE</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>

            <tbody>

              {contracts.map(
                (contract, index) => (

                  <tr
                    key={contract.id}
                    style={{
                      animationDelay:
                        `${index * 70}ms`,
                    }}
                  >

                    <td>
                      <span className="contract-code">
                        {contract.id}
                      </span>
                    </td>

                    <td>

                      <div className="professional-vendor">

                        <div className="vendor-logo">
                          {contract.vendor
                            .charAt(0)}
                        </div>

                        <div>
                          <strong>
                            {contract.vendor}
                          </strong>

                          <small>
                            Verified vendor
                          </small>
                        </div>

                      </div>

                    </td>

                    <td>
                      <span className="department-text">
                        {contract.department}
                      </span>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {contract.value.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>

                      <div className="table-risk-score">

                        <strong>
                          {contract.crs}
                        </strong>

                        <div>
                          <span
                            style={{
                              width:
                                `${contract.crs}%`,
                            }}
                          />
                        </div>

                      </div>

                    </td>

                    <td>

                      <span
                        className={`status-pill ${
                          contract.crs >= 80
                            ? "critical"
                            : "warning"
                        }`}
                      >
                        <i />
                        {contract.crs >= 80
                          ? "Critical"
                          : "High Risk"}
                      </span>

                    </td>

                    <td>

                      <Link
                        to={`/contracts/${contract.id}`}
                        className="table-arrow"
                      >
                        →
                      </Link>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="quick-actions-section">

        <div className="quick-section-heading">

          <div>
            <span>WORKSPACE</span>
            <h2>
              Quick Actions
            </h2>
          </div>

          <p>
            Move from insight to action
          </p>

        </div>

        <div className="professional-quick-grid">

          <Link
            to="/contracts"
            className="professional-action blue-action"
          >

            <div className="action-icon">
              ⌕
            </div>

            <div>
              <span>RISK MANAGEMENT</span>
              <h3>
                Investigate Contract
              </h3>
              <p>
                Analyze evidence, scores and risk factors.
              </p>
            </div>

            <b>→</b>

          </Link>

          <Link
            to="/network"
            className="professional-action purple-action"
          >

            <div className="action-icon">
              ◎
            </div>

            <div>
              <span>VENDOR INTELLIGENCE</span>
              <h3>
                Analyze Vendors
              </h3>
              <p>
                Explore vendor performance and relationships.
              </p>
            </div>

            <b>→</b>

          </Link>

          <Link
            to="/network"
            className="professional-action cyan-action"
          >

            <div className="action-icon">
              ◌
            </div>

            <div>
              <span>NETWORK ANALYSIS</span>
              <h3>
                Explore Network
              </h3>
              <p>
                Discover hidden connections and patterns.
              </p>
            </div>

            <b>→</b>

          </Link>

        </div>

      </section>

      {/* =====================================================
          PROFESSIONAL DASHBOARD CSS
      ===================================================== */}

      <style>{`

        /* ================================================
           BASE
        ================================================= */

        .dashboard-pro {
          position: relative;
          min-height: 100vh;
          isolation: isolate;
          padding-bottom: 55px;
        }

        .dashboard-pro * {
          box-sizing: border-box;
        }

        /* ================================================
           BACKGROUND
        ================================================= */

        .dashboard-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -1;
        }

        .dashboard-grid-bg {
          position: absolute;
          inset: 0;
          opacity: .28;

          background-image:
            linear-gradient(
              rgba(99,102,241,.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(99,102,241,.045) 1px,
              transparent 1px
            );

          background-size: 42px 42px;

          mask-image:
            linear-gradient(
              to bottom,
              black,
              transparent 75%
            );
        }

        .dashboard-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: .16;
          animation: orbFloat 9s ease-in-out infinite;
        }

        .orb-purple {
          width: 420px;
          height: 420px;
          background: #6366f1;
          right: -180px;
          top: 40px;
        }

        .orb-blue {
          width: 360px;
          height: 360px;
          background: #06b6d4;
          left: -180px;
          top: 550px;
          animation-delay: -4s;
        }

        /* ================================================
           HERO
        ================================================= */

        .dashboard-hero {
          min-height: 335px;
          border-radius: 28px;
          padding: 40px 42px;
          display: grid;
          grid-template-columns: 1.35fr .65fr;
          gap: 30px;
          align-items: center;
          position: relative;
          overflow: hidden;

          color: white;

          background:
            radial-gradient(
              circle at 75% 30%,
              rgba(129,140,248,.32),
              transparent 30%
            ),
            radial-gradient(
              circle at 10% 100%,
              rgba(6,182,212,.2),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #111936,
              #1e1b4b 55%,
              #312e81
            );

          box-shadow:
            0 25px 70px rgba(31,41,92,.22);

          animation: heroEnter .7s ease both;
        }

        .dashboard-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              120deg,
              transparent 25%,
              rgba(255,255,255,.04),
              transparent 70%
            );
          transform: translateX(-100%);
          animation: heroShine 7s ease-in-out infinite;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: .15em;

          color: #a5b4fc;

          margin-bottom: 15px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 14px #34d399;
          animation: livePulse 1.8s infinite;
        }

        .dashboard-hero h1 {
          margin: 0;
          max-width: 750px;

          font-size: clamp(34px, 4vw, 54px);
          line-height: 1.04;
          letter-spacing: -.045em;
          font-weight: 850;
        }

        .dashboard-hero h1 span {
          display: block;

          background:
            linear-gradient(
              90deg,
              #a5b4fc,
              #67e8f9
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .dashboard-hero p {
          max-width: 620px;
          margin: 18px 0 24px;

          color: #c7d2fe;
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hero-primary,
        .hero-secondary {
          height: 44px;
          padding: 0 16px;

          border-radius: 11px;

          display: inline-flex;
          align-items: center;
          gap: 10px;

          font-size: 12px;
          font-weight: 800;

          transition:
            transform .25s ease,
            box-shadow .25s ease,
            background .25s ease;
        }

        .hero-primary {
          color: #111936;
          background: white;
          box-shadow:
            0 8px 25px rgba(0,0,0,.16);
        }

        .hero-primary b {
          margin-left: 5px;
          transition: transform .2s ease;
        }

        .hero-primary:hover {
          transform: translateY(-3px);
          box-shadow:
            0 14px 32px rgba(0,0,0,.22);
        }

        .hero-primary:hover b {
          transform: translateX(4px);
        }

        .hero-secondary {
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.08);
          color: white;
          backdrop-filter: blur(12px);
        }

        .hero-secondary:hover {
          background: rgba(255,255,255,.14);
          transform: translateY(-3px);
        }

        /* ================================================
           HERO RISK PANEL
        ================================================= */

        .hero-risk-panel {
          position: relative;
          z-index: 2;

          padding: 22px;

          border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.12),
              rgba(255,255,255,.045)
            );

          backdrop-filter: blur(18px);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08);

          animation: panelEnter .8s .15s ease both;
        }

        .hero-panel-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .hero-panel-top span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .hero-panel-top strong {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        .hero-status {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 5px 8px;
          border-radius: 20px;

          color: #86efac;
          background: rgba(34,197,94,.1);

          font-size: 8px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .hero-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        .hero-score {
          display: flex;
          align-items: center;
          gap: 18px;
          margin: 25px 0 22px;
        }

        .score-ring {
          width: 108px;
          height: 108px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            radial-gradient(
              circle at center,
              #171e42 57%,
              transparent 58%
            ),
            conic-gradient(
              #67e8f9 0 72%,
              rgba(255,255,255,.08) 72% 100%
            );

          box-shadow:
            0 0 35px rgba(103,232,249,.14);
        }

        .score-ring strong {
          font-size: 30px;
        }

        .score-ring small {
          color: #94a3b8;
          font-size: 10px;
        }

        .score-details span {
          display: block;
          color: #94a3b8;
          font-size: 10px;
        }

        .score-details strong {
          display: block;
          margin-top: 4px;
          font-size: 18px;
        }

        .score-details p {
          margin: 6px 0 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.5;
        }

        .hero-chart {
          border-top: 1px solid rgba(255,255,255,.08);
          padding-top: 13px;
        }

        .chart-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 9px;
          color: #94a3b8;
        }

        .chart-label b {
          color: #86efac;
        }

        .hero-sparkline {
          width: 100%;
          height: 34px;
          color: #67e8f9;
          overflow: visible;
        }

        /* ================================================
           TOOLBAR
        ================================================= */

        .dashboard-toolbar {
          min-height: 54px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;

          margin: 17px 0;
          padding: 0 3px;
        }

        .dashboard-breadcrumb {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .13em;
          color: #6366f1;
        }

        .dashboard-breadcrumb span {
          color: #cbd5e1;
          margin: 0 8px;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-toggle,
        .toolbar-button {
          border: 1px solid #e5e7eb;
          background: white;
          color: #667085;

          border-radius: 9px;
          padding: 8px 11px;

          font-size: 10px;
          font-weight: 700;

          transition: .2s ease;
        }

        .refresh-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .refresh-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .refresh-toggle.enabled .refresh-indicator {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,.7);
        }

        .refresh-toggle:hover,
        .toolbar-button:hover {
          border-color: #c7d2fe;
          color: #4f46e5;
          transform: translateY(-1px);
        }

        /* ================================================
           KPI GRID
        ================================================= */

        .pro-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .pro-stat-card {
          position: relative;
          overflow: hidden;

          min-height: 195px;
          padding: 21px;

          border-radius: 18px;

          color: white;

          box-shadow:
            0 14px 35px rgba(30,41,80,.12);

          transition:
            transform .28s ease,
            box-shadow .28s ease;
        }

        .pro-stat-card::before {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          right: -80px;
          top: -80px;
          border-radius: 50%;
          background: rgba(255,255,255,.12);
          transition: transform .5s ease;
        }

        .pro-stat-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 22px 48px rgba(30,41,80,.18);
        }

        .pro-stat-card:hover::before {
          transform: scale(1.45);
        }

        .pro-stat-card.blue {
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4338ca
            );
        }

        .pro-stat-card.red {
          background:
            linear-gradient(
              135deg,
              #ef4444,
              #be123c
            );
        }

        .pro-stat-card.purple {
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #6d28d9
            );
        }

        .pro-stat-card.green {
          background:
            linear-gradient(
              135deg,
              #059669,
              #047857
            );
        }

        .pro-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pro-stat-icon {
          width: 43px;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.1);

          font-size: 18px;
          font-weight: 900;

          backdrop-filter: blur(10px);
        }

        .pro-stat-trend {
          padding: 6px 8px;
          border-radius: 20px;

          background: rgba(255,255,255,.12);

          font-size: 9px;
          font-weight: 800;
        }

        .pro-stat-trend.danger {
          color: #ffe4e6;
        }

        .pro-stat-body {
          position: relative;
          z-index: 2;
          margin-top: 20px;
        }

        .pro-stat-body > span {
          display: block;

          color: rgba(255,255,255,.68);

          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .pro-stat-body strong {
          display: block;
          margin-top: 4px;

          font-size: 32px;
          line-height: 1;
          letter-spacing: -.035em;
        }

        .pro-stat-body small {
          display: block;
          margin-top: 8px;

          color: rgba(255,255,255,.62);
          font-size: 9px;
        }

        .stat-visual {
          position: absolute;
          right: 15px;
          bottom: 13px;
          width: 100px;
          opacity: .7;
        }

        .stat-visual .hero-sparkline {
          color: rgba(255,255,255,.75);
        }

        .stat-progress {
          position: absolute;
          left: 21px;
          right: 21px;
          bottom: 18px;
          height: 4px;
          background: rgba(255,255,255,.14);
          border-radius: 20px;
          overflow: hidden;
        }

        .stat-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: rgba(255,255,255,.85);
          animation: progressGrow 1.3s ease both;
        }

        .risk-meter {
          position: absolute;
          left: 21px;
          right: 21px;
          bottom: 19px;

          display: flex;
          gap: 3px;
        }

        .risk-meter span,
        .risk-meter i,
        .risk-meter b {
          height: 4px;
          border-radius: 10px;
        }

        .risk-meter span {
          flex: 5;
          background: #4ade80;
        }

        .risk-meter i {
          flex: 3;
          background: #facc15;
        }

        .risk-meter b {
          flex: 2;
          background: rgba(255,255,255,.15);
        }

        .vendor-dots {
          position: absolute;
          left: 21px;
          bottom: 18px;
          display: flex;
          gap: 4px;
        }

        .vendor-dots i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,.7);
        }

        /* ================================================
           PANELS
        ================================================= */

        .analytics-pro-grid {
          display: grid;
          grid-template-columns:
            minmax(0, .9fr)
            minmax(0, 1.1fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .pro-panel {
          position: relative;

          background: rgba(255,255,255,.9);
          border: 1px solid #e7eaf1;
          border-radius: 19px;

          padding: 23px;

          box-shadow:
            0 8px 30px rgba(15,23,42,.055);

          backdrop-filter: blur(10px);

          transition:
            box-shadow .25s ease,
            transform .25s ease;
        }

        .pro-panel:hover {
          box-shadow:
            0 15px 42px rgba(15,23,42,.09);
        }

        .pro-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .section-kicker {
          color: #6366f1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .15em;
          margin-bottom: 5px;
        }

        .pro-panel-heading h2 {
          margin: 0;
          color: #172033;
          font-size: 17px;
          letter-spacing: -.02em;
        }

        .pro-panel-heading p {
          margin: 5px 0 0;
          color: #98a2b3;
          font-size: 10px;
        }

        .panel-menu {
          width: 32px;
          height: 30px;

          border: 1px solid #e8ebf1;
          border-radius: 8px;

          background: #f8fafc;
          color: #667085;
        }

        /* ================================================
           DONUT
        ================================================= */

        .donut-section {
          position: relative;
        }

        .donut-center {
          position: absolute;
          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -53%);

          text-align: center;
          pointer-events: none;
        }

        .donut-center span {
          display: block;
          color: #98a2b3;
          font-size: 9px;
        }

        .donut-center strong {
          display: block;
          margin-top: 2px;

          color: #172033;
          font-size: 25px;
        }

        .donut-center small {
          color: #98a2b3;
          font-size: 9px;
        }

        .risk-stat-list {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);

          border-top: 1px solid #eef1f5;
          padding-top: 15px;
          gap: 10px;
        }

        .risk-stat-list > div {
          padding: 10px;
          border-radius: 11px;
          background: #f8fafc;
          transition: .2s ease;
        }

        .risk-stat-list > div:hover {
          transform: translateY(-2px);
          background: #f1f5f9;
        }

        .risk-stat-list span {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #667085;
          font-size: 9px;
        }

        .risk-stat-list i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .risk-low {
          background: #22c55e;
        }

        .risk-medium {
          background: #f59e0b;
        }

        .risk-high {
          background: #ef4444;
        }

        .risk-stat-list strong {
          display: block;
          margin-top: 5px;
          color: #172033;
          font-size: 14px;
        }

        .risk-stat-list small {
          color: #98a2b3;
          font-size: 8px;
        }

        /* ================================================
           CHART
        ================================================= */

        .trend-heading {
          align-items: center;
        }

        .period-switch {
          display: flex;
          gap: 3px;
          padding: 3px;

          border-radius: 9px;
          background: #f1f5f9;
        }

        .period-switch button {
          border: 0;
          background: transparent;

          padding: 6px 9px;
          border-radius: 7px;

          color: #98a2b3;
          font-size: 9px;
          font-weight: 800;

          cursor: pointer;
          transition: .2s ease;
        }

        .period-switch button:hover {
          color: #4f46e5;
        }

        .period-switch button.active {
          color: white;
          background: #4f46e5;
          box-shadow:
            0 4px 10px rgba(79,70,229,.25);
        }

        .chart-summary {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin: 22px 0 2px;
        }

        .chart-summary span {
          display: block;
          color: #98a2b3;
          font-size: 9px;
        }

        .chart-summary strong {
          display: block;
          margin-top: 3px;
          color: #172033;
          font-size: 21px;
        }

        .chart-summary-change {
          text-align: right;
        }

        .chart-summary-change strong {
          color: #16a34a;
          font-size: 11px;
        }

        /* ================================================
           INSIGHT
        ================================================= */

        .insight-strip {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          gap: 17px;

          margin: 18px 0;

          padding: 17px 19px;

          border-radius: 17px;

          border: 1px solid #ddd6fe;

          background:
            linear-gradient(
              105deg,
              #f5f3ff,
              #eef2ff
            );

          box-shadow:
            0 8px 25px rgba(79,70,229,.055);
        }

        .insight-strip::after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          right: -80px;
          top: -100px;
          border-radius: 50%;
          background: #c4b5fd;
          opacity: .12;
        }

        .insight-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          color: #6d28d9;
          background: #ede9fe;

          font-size: 19px;
        }

        .insight-content {
          min-width: 0;
        }

        .insight-content > span {
          display: block;
          color: #7c3aed;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .insight-content strong {
          display: block;
          margin-top: 3px;
          color: #312e81;
          font-size: 12px;
        }

        .insight-content p {
          margin: 3px 0 0;
          color: #6b7280;
          font-size: 9px;
        }

        .insight-button {
          margin-left: auto;
          flex-shrink: 0;

          padding: 9px 12px;

          border-radius: 9px;

          color: white;
          background: #6366f1;

          font-size: 9px;
          font-weight: 800;

          transition: .2s ease;
        }

        .insight-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 18px rgba(99,102,241,.25);
        }

        /* ================================================
           ALERTS
        ================================================= */

        .alerts-panel {
          border-color: #fecaca;
          margin-bottom: 18px;
        }

        .alert-heading {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .alert-symbol {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          color: #dc2626;
          background: #fee2e2;

          font-weight: 900;

          animation: alertPulse 2s infinite;
        }

        .danger-kicker {
          color: #dc2626;
        }

        .alert-heading-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .alert-count {
          padding: 6px 10px;

          border-radius: 20px;

          color: #dc2626;
          background: #fef2f2;

          font-size: 9px;
          font-weight: 800;
        }

        .collapse-button {
          width: 30px;
          height: 30px;

          border: 1px solid #e5e7eb;
          border-radius: 8px;

          background: white;
          color: #64748b;

          cursor: pointer;
        }

        .alert-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 17px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 13px;

          padding: 12px;

          border-radius: 12px;

          border: 1px solid #edf0f4;
          background: #fafbfc;

          color: inherit;
          text-decoration: none;

          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
        }

        .alert-item:hover {
          transform: translateX(5px);

          border-color: #c7d2fe;

          box-shadow:
            0 8px 22px rgba(15,23,42,.07);
        }

        .alert-level {
          width: 34px;
          height: 34px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          font-weight: 900;
        }

        .alert-level.critical {
          color: #dc2626;
          background: #fee2e2;
        }

        .alert-level.warning {
          color: #d97706;
          background: #fef3c7;
        }

        .alert-main {
          min-width: 0;
          flex: 1;
        }

        .alert-main strong {
          display: block;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #172033;
          font-size: 11px;
        }

        .alert-main span {
          display: block;
          margin-top: 3px;
          color: #98a2b3;
          font-size: 9px;
        }

        .alert-score {
          min-width: 100px;
          text-align: right;
        }

        .alert-score strong {
          color: #dc2626;
          font-size: 10px;
        }

        .alert-score > div {
          width: 90px;
          height: 4px;

          margin-top: 5px;
          margin-left: auto;

          overflow: hidden;

          border-radius: 20px;
          background: #fee2e2;
        }

        .alert-score > div span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #ef4444;
        }

        .alert-arrow {
          width: 29px;
          height: 29px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: white;
          border: 1px solid #e5e7eb;

          color: #6366f1;
          font-size: 13px;

          transition: .2s ease;
        }

        .alert-item:hover .alert-arrow {
          transform: translateX(3px);
          background: #eef2ff;
        }

        /* ================================================
           TABLE
        ================================================= */

        .contracts-panel {
          margin-bottom: 20px;
          padding-bottom: 8px;
        }

        .view-all-button {
          padding: 8px 11px;

          border-radius: 9px;

          background: #eef2ff;
          color: #4f46e5;

          font-size: 9px;
          font-weight: 800;

          transition: .2s ease;
        }

        .view-all-button:hover {
          background: #e0e7ff;
          transform: translateY(-1px);
        }

        .professional-table-wrap {
          overflow-x: auto;
          margin-top: 18px;
        }

        .professional-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .professional-table th {
          padding: 11px 12px;
          text-align: left;

          color: #98a2b3;
          background: #f8fafc;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .professional-table td {
          padding: 13px 12px;

          border-bottom: 1px solid #eef1f5;

          color: #475467;
          font-size: 10px;
        }

        .professional-table tbody tr {
          transition: .2s ease;
        }

        .professional-table tbody tr:hover {
          background: #fafbff;
          transform: scale(1.002);
        }

        .contract-code {
          padding: 5px 7px;

          border-radius: 6px;

          color: #4f46e5;
          background: #eef2ff;

          font-size: 9px;
          font-weight: 900;
        }

        .professional-vendor {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .vendor-logo {
          width: 31px;
          height: 31px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          color: #4f46e5;
          background:
            linear-gradient(
              135deg,
              #dbeafe,
              #ede9fe
            );

          font-size: 11px;
          font-weight: 900;
        }

        .professional-vendor strong {
          display: block;
          color: #172033;
          font-size: 10px;
        }

        .professional-vendor small {
          display: block;
          margin-top: 2px;
          color: #98a2b3;
          font-size: 8px;
        }

        .department-text {
          color: #667085;
        }

        .table-risk-score {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .table-risk-score strong {
          color: #dc2626;
          font-size: 10px;
        }

        .table-risk-score > div {
          width: 55px;
          height: 5px;
          overflow: hidden;
          border-radius: 20px;
          background: #fee2e2;
        }

        .table-risk-score > div span {
          display: block;
          height: 100%;
          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #f97316,
              #ef4444
            );
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 5px 8px;

          border-radius: 20px;

          font-size: 8px;
          font-weight: 800;
        }

        .status-pill i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .status-pill.critical {
          color: #dc2626;
          background: #fee2e2;
        }

        .status-pill.critical i {
          background: #ef4444;
        }

        .status-pill.warning {
          color: #b45309;
          background: #fef3c7;
        }

        .status-pill.warning i {
          background: #f59e0b;
        }

        .table-arrow {
          width: 28px;
          height: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid #e5e7eb;
          border-radius: 8px;

          color: #6366f1;
          background: white;

          transition: .2s ease;
        }

        .table-arrow:hover {
          transform: translateX(3px);
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        /* ================================================
           QUICK ACTIONS
        ================================================= */

        .quick-actions-section {
          margin-top: 10px;
        }

        .quick-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin-bottom: 12px;
        }

        .quick-section-heading > div > span {
          color: #6366f1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .quick-section-heading h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 18px;
        }

        .quick-section-heading p {
          margin: 0;
          color: #98a2b3;
          font-size: 9px;
        }

        .professional-quick-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .professional-action {
          min-height: 135px;

          position: relative;
          overflow: hidden;

          display: flex;
          align-items: flex-start;
          gap: 13px;

          padding: 19px;

          border-radius: 17px;

          color: white;
          text-decoration: none;

          box-shadow:
            0 10px 25px rgba(30,41,80,.12);

          transition:
            transform .25s ease,
            box-shadow .25s ease;
        }

        .professional-action::after {
          content: "";
          position: absolute;

          width: 130px;
          height: 130px;

          right: -60px;
          bottom: -70px;

          border-radius: 50%;

          background: rgba(255,255,255,.12);

          transition: transform .4s ease;
        }

        .professional-action:hover {
          transform: translateY(-5px);
          box-shadow:
            0 18px 35px rgba(30,41,80,.17);
        }

        .professional-action:hover::after {
          transform: scale(1.5);
        }

        .blue-action {
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );
        }

        .purple-action {
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #9333ea
            );
        }

        .cyan-action {
          background:
            linear-gradient(
              135deg,
              #0891b2,
              #0f766e
            );
        }

        .action-icon {
          width: 41px;
          height: 41px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.1);

          font-size: 18px;
        }

        .professional-action > div:nth-child(2) {
          position: relative;
          z-index: 2;
        }

        .professional-action span {
          display: block;

          color: rgba(255,255,255,.62);

          font-size: 7px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .professional-action h3 {
          margin: 4px 0;

          font-size: 13px;
        }

        .professional-action p {
          margin: 0;

          color: rgba(255,255,255,.7);

          font-size: 9px;
          line-height: 1.5;
        }

        .professional-action > b {
          position: absolute;
          right: 18px;
          bottom: 15px;

          z-index: 3;

          font-size: 18px;
          opacity: .55;

          transition: .2s ease;
        }

        .professional-action:hover > b {
          transform: translateX(5px);
          opacity: 1;
        }

        /* ================================================
           ANIMATIONS
        ================================================= */

        @keyframes heroEnter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes panelEnter {
          from {
            opacity: 0;
            transform: translateX(20px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes orbFloat {
          0%,100% {
            transform: translate(0,0);
          }

          50% {
            transform: translate(25px,-20px);
          }
        }

        @keyframes heroShine {
          0%,65% {
            transform: translateX(-100%);
          }

          85%,100% {
            transform: translateX(100%);
          }
        }

        @keyframes livePulse {
          0%,100% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.5);
            opacity: .55;
          }
        }

        @keyframes alertPulse {
          0%,100% {
            box-shadow: 0 0 0 0 rgba(239,68,68,.12);
          }

          50% {
            box-shadow: 0 0 0 7px rgba(239,68,68,0);
          }
        }

        @keyframes progressGrow {
          from {
            width: 0;
          }
        }

        /* ================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1150px) {

          .dashboard-hero {
            grid-template-columns: 1fr;
          }

          .hero-risk-panel {
            max-width: 560px;
          }

          .pro-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 900px) {

          .analytics-pro-grid {
            grid-template-columns: 1fr;
          }

          .professional-quick-grid {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 650px) {

          .dashboard-hero {
            min-height: auto;
            padding: 27px 21px;
            border-radius: 21px;
          }

          .dashboard-hero h1 {
            font-size: 33px;
          }

          .dashboard-hero p {
            font-size: 12px;
          }

          .hero-risk-panel {
            padding: 17px;
          }

          .hero-score {
            margin: 18px 0;
          }

          .score-ring {
            width: 90px;
            height: 90px;
          }

          .score-ring strong {
            font-size: 25px;
          }

          .dashboard-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .toolbar-right {
            width: 100%;
          }

          .refresh-toggle,
          .toolbar-button {
            flex: 1;
          }

          .pro-stats-grid {
            grid-template-columns: 1fr;
          }

          .pro-stat-card {
            min-height: 175px;
          }

          .pro-panel {
            padding: 17px;
            border-radius: 15px;
          }

          .pro-panel-heading {
            flex-direction: column;
          }

          .trend-heading {
            align-items: flex-start;
          }

          .period-switch {
            width: 100%;
          }

          .period-switch button {
            flex: 1;
          }

          .risk-stat-list {
            grid-template-columns: 1fr;
          }

          .insight-strip {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .insight-button {
            width: 100%;
            margin-left: 0;
            text-align: center;
          }

          .alert-item {
            align-items: flex-start;
          }

          .alert-score {
            min-width: 65px;
          }

          .alert-score > div {
            width: 60px;
          }

          .alert-arrow {
            display: none;
          }

          .quick-section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          .dashboard-pro *,
          .dashboard-pro *::before,
          .dashboard-pro *::after {
            animation: none !important;
            transition: none !important;
          }

        }

      `}</style>

    </div>
  );
}