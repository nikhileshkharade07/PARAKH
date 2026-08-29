import React, { useEffect, useState } from "react";
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
} from "recharts";

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

export default function Dashboard() {
  const {
    stats,
    riskDistribution,
    contracts,
  } = useDashboardData();

  const pieColors = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
  ];

  return (
    <div className="dashboard">

      {/* PAGE INTRO */}
      <div className="page-intro">

        <div>
          <div className="breadcrumb">
            OVERVIEW / DASHBOARD
          </div>

          <h1>
            Procurement Risk Dashboard
          </h1>

          <p>
            Monitor contracts, vendors and procurement
            risk from one intelligent workspace.
          </p>
        </div>

        <div className="date-badge">
          <span>◷</span>
          Last updated today
        </div>

      </div>

      {/* KPI CARDS */}
      <div className="stats-grid">

        <div className="stat-card blue">
          <div className="stat-top">
            <div className="stat-icon">
              ▤
            </div>

            <span className="trend positive">
              +12.5%
            </span>
          </div>

          <div className="stat-label">
            TOTAL CONTRACTS
          </div>

          <div className="stat-value">
            {stats.totalContracts?.toLocaleString()}
          </div>

          <div className="stat-footer">
            Compared with last month
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-top">
            <div className="stat-icon">
              !
            </div>

            <span className="trend negative">
              Attention
            </span>
          </div>

          <div className="stat-label">
            HIGH RISK CONTRACTS
          </div>

          <div className="stat-value">
            {stats.highRiskContracts}
          </div>

          <div className="stat-footer">
            Requires investigation
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <div className="stat-icon">
              ◈
            </div>

            <span className="trend">
              CRS
            </span>
          </div>

          <div className="stat-label">
            AVERAGE RISK SCORE
          </div>

          <div className="stat-value">
            {stats.avgCRS}
          </div>

          <div className="stat-footer">
            Contract Risk Score
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <div className="stat-icon">
              ◉
            </div>

            <span className="trend positive">
              Active
            </span>
          </div>

          <div className="stat-label">
            TOTAL VENDORS
          </div>

          <div className="stat-value">
            {stats.totalVendors?.toLocaleString()}
          </div>

          <div className="stat-footer">
            Vendors monitored
          </div>
        </div>

      </div>

      {/* ANALYTICS */}
      <div className="analytics-grid">

        {/* RISK DONUT */}
        <div className="dashboard-card">

          <div className="card-heading">
            <div>
              <h2>Risk Distribution</h2>
              <p>Contract risk breakdown</p>
            </div>

            <button className="more-button">
              •••
            </button>
          </div>

          <div className="donut-wrapper">

            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={105}
                  paddingAngle={4}
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

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="risk-legend">

              <div>
                <span className="legend-dot low"></span>
                <span>Low</span>
                <strong>850</strong>
              </div>

              <div>
                <span className="legend-dot medium"></span>
                <span>Medium</span>
                <strong>1,258</strong>
              </div>

              <div>
                <span className="legend-dot high"></span>
                <span>High</span>
                <strong>342</strong>
              </div>

            </div>

          </div>

        </div>

        {/* BAR CHART */}
        <div className="dashboard-card">

          <div className="card-heading">
            <div>
              <h2>Risk Overview</h2>
              <p>Number of contracts by risk level</p>
            </div>

            <span className="period-badge">
              This Month
            </span>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={riskDistribution}
              margin={{
                top: 20,
                right: 10,
                left: -20,
                bottom: 10,
              }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
                barSize={55}
              />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* HIGH RISK TABLE */}
      <div className="dashboard-card contracts-card">

        <div className="card-heading">

          <div>
            <div className="title-with-icon">
              <div className="danger-icon">
                !
              </div>

              <div>
                <h2>High-Risk Contracts</h2>
                <p>
                  Contracts requiring immediate attention
                </p>
              </div>
            </div>
          </div>

          <button className="view-button">
            View all →
          </button>

        </div>

        <div className="table-container">

          <table className="risk-table">

            <thead>
              <tr>
                <th>CONTRACT</th>
                <th>VENDOR</th>
                <th>DEPARTMENT</th>
                <th>VALUE</th>
                <th>CRS SCORE</th>
                <th>RISK</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {contracts.map((contract) => (

                <tr key={contract.id}>

                  <td>
                    <span className="contract-id">
                      {contract.id}
                    </span>
                  </td>

                  <td>
                    <div className="vendor-cell">

                      <div className="vendor-avatar">
                        {contract.vendor
                          .charAt(0)}
                      </div>

                      <strong>
                        {contract.vendor}
                      </strong>

                    </div>
                  </td>

                  <td>
                    <span className="department">
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
                    <div className="score-wrapper">

                      <div className="score-number">
                        {contract.crs}
                      </div>

                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{
                            width: `${contract.crs}%`,
                          }}
                        ></div>
                      </div>

                    </div>
                  </td>

                  <td>
                    <span
                      className={`risk-badge ${
                        contract.crs >= 70
                          ? "high"
                          : "medium"
                      }`}
                    >
                      {contract.crs >= 70
                        ? "High Risk"
                        : "Medium"}
                    </span>
                  </td>

                  <td>
                    <button className="arrow-button">
                      →
                    </button>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-grid">

        <div className="quick-card blue-action">
          <div className="quick-icon">⌕</div>

          <div>
            <h3>Investigate Contract</h3>
            <p>
              Analyze risk factors and evidence.
            </p>
          </div>

          <span>→</span>
        </div>

        <div className="quick-card purple-action">
          <div className="quick-icon">◎</div>

          <div>
            <h3>Analyze Vendors</h3>
            <p>
              Review vendor risk and connections.
            </p>
          </div>

          <span>→</span>
        </div>

        <div className="quick-card green-action">
          <div className="quick-icon">◌</div>

          <div>
            <h3>Explore Network</h3>
            <p>
              Discover hidden relationships.
            </p>
          </div>

          <span>→</span>
        </div>

      </div>

    </div>
  );
}