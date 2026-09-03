import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function AppShell({
  children,
  onOpenIngest,
  onOpenAI,
  onOpenAuth,
  currentUser
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("parakh_theme") === "dark";
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("parakh_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("parakh_theme", "light");
    }
  }, [darkMode]);

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("global-omnisearch-input");
        if (input) input.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/contracts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const notifications = [
    {
      id: 1,
      title: "Statutory Tender Flagged",
      desc: "Tender 2017_FDC_18741_6 triggered RF-1 (Single Bidder) with CRS 81.",
      time: "10m ago",
      type: "critical"
    },
    {
      id: 2,
      title: "Vendor Lock-in Alert",
      desc: "HARI CHAND CONTR. exceeded 60% procurement share in Mandi circle.",
      time: "1h ago",
      type: "warning"
    },
    {
      id: 3,
      title: "OCDS Ingestion Verified",
      desc: "12,458 procurement records synchronized with zero data leakage.",
      time: "3h ago",
      type: "info"
    }
  ];

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="stitch-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Rail Sidebar */}
      <aside className={`stitch-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Brand Header */}
          <div style={{ padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-on-primary)",
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  fontFamily: "Plus Jakarta Sans"
                }}
              >
                P
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
                  PARAKH
                </span>
                <span
                  style={{
                    fontSize: "0.625rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-on-surface-variant)",
                    fontWeight: 700
                  }}
                >
                  INTELLIGENCE PLATFORM
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-only"
              style={{
                background: "none",
                border: "none",
                color: "var(--color-on-surface-variant)",
                cursor: "pointer",
                padding: "0.25rem",
                display: "none"
              }}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Quick Action: Start Audit */}
          <div style={{ padding: "0 1rem" }}>
            <button
              type="button"
              onClick={() => navigate("/contracts")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                transition: "opacity 0.15s ease"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add
              </span>
              <span>Start Audit</span>
            </button>
          </div>

          {/* Forensic Workspace Section */}
          <div style={{ padding: "0.25rem 1rem 0" }}>
            <span
              style={{
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-on-surface-variant)",
                fontWeight: 700
              }}
            >
              Forensic Workspace
            </span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.5rem" }}>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                backgroundColor: isActive ? "var(--color-surface-container)" : "transparent",
                transition: "all 0.15s ease"
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                grid_view
              </span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/contracts"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                backgroundColor: isActive ? "var(--color-surface-container)" : "transparent",
                transition: "all 0.15s ease"
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                description
              </span>
              <span>Contract Registry</span>
            </NavLink>

            <NavLink
              to="/cases"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                backgroundColor: isActive ? "var(--color-surface-container)" : "transparent",
                transition: "all 0.15s ease"
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                fingerprint
              </span>
              <span>Investigations Hub</span>
            </NavLink>

            <NavLink
              to="/network"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                backgroundColor: isActive ? "var(--color-surface-container)" : "transparent",
                transition: "all 0.15s ease"
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                hub
              </span>
              <span>Network Graph</span>
            </NavLink>

            <NavLink
              to="/simulator"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                backgroundColor: isActive ? "var(--color-surface-container)" : "transparent",
                transition: "all 0.15s ease"
              })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                tune
              </span>
              <span>Risk Sandbox</span>
            </NavLink>
          </nav>

          {/* Workflows Section */}
          <div style={{ padding: "0.25rem 1rem 0" }}>
            <span
              style={{
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-on-surface-variant)",
                fontWeight: 700
              }}
            >
              Workflows
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.5rem" }}>
            <button
              type="button"
              onClick={onOpenIngest}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-on-surface-variant)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s ease"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                upload_file
              </span>
              <span>Ingest Dataset</span>
            </button>

            <button
              type="button"
              onClick={onOpenAI}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-on-surface)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-secondary)" }}>
                  auto_awesome
                </span>
                <span>AI Assistant</span>
              </div>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--color-secondary-fixed)",
                  color: "var(--color-on-secondary-fixed)"
                }}
              >
                COPILOT
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-on-surface-variant)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s ease"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                badge
              </span>
              <span>Auditor Roles</span>
            </button>
          </div>
        </div>

        {/* Bottom Utility Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.5rem", borderTop: "1px solid var(--color-outline-variant)", paddingTop: "0.75rem" }}>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.75rem",
              fontSize: "0.8125rem",
              color: "var(--color-on-surface-variant)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              settings
            </span>
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.75rem",
              fontSize: "0.8125rem",
              color: "var(--color-on-surface-variant)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              help
            </span>
            <span>Help Center</span>
          </button>
        </div>
      </aside>

      {/* Topbar Header */}
      <header className="stitch-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, maxWidth: "36rem" }}>
          {/* Hamburger toggle button for mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-on-surface)",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center"
            }}
            className="mobile-hamburger"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Global Omnisearch Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "100%" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "var(--color-on-surface-variant)",
                pointerEvents: "none"
              }}
            >
              search
            </span>
            <input
              id="global-omnisearch-input"
              type="text"
              className="stitch-input"
              style={{
                paddingLeft: "2.5rem",
                paddingRight: "3rem",
                height: "2.25rem",
                backgroundColor: "var(--color-surface-low)"
              }}
              placeholder="Search contracts, vendors, departments, or entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span
              style={{
                position: "absolute",
                right: "0.625rem",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0.15rem 0.4rem",
                borderRadius: "0.375rem",
                backgroundColor: "var(--color-surface-lowest)",
                fontSize: "0.6875rem",
                fontFamily: "JetBrains Mono",
                color: "var(--color-on-surface-variant)",
                border: "1px solid var(--color-outline-variant)",
                pointerEvents: "none"
              }}
            >
              ⌘K
            </span>
          </form>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Notifications Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: "relative",
                padding: "0.5rem",
                borderRadius: "0.75rem",
                backgroundColor: showNotifications ? "var(--color-surface-low)" : "transparent",
                border: "none",
                color: "var(--color-on-surface-variant)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                notifications
              </span>
              <span
                style={{
                  position: "absolute",
                  top: "0.375rem",
                  right: "0.375rem",
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-error)"
                }}
              />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "120%",
                  width: "20rem",
                  backgroundColor: "var(--color-surface-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: 60,
                  padding: "0.75rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-outline-variant)" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--color-on-surface)" }}>
                    Statutory Vigilance Alerts
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-secondary)", cursor: "pointer", fontWeight: 600 }}>
                    Mark read
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--color-surface-low)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--color-on-surface)" }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: "0.625rem", color: "var(--color-on-surface-variant)" }}>
                          {n.time}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                        {n.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "transparent",
              border: "none",
              color: "var(--color-on-surface-variant)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            aria-label="Toggle theme"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* User Profile / Clearance Badge */}
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.25rem 0.5rem 0.25rem 0.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--color-surface-low)",
              border: "1px solid var(--color-outline-variant)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                {currentUser?.username || "J. Doe"}
              </span>
              <span style={{ fontSize: "0.625rem", color: "var(--color-on-surface-variant)" }}>
                {currentUser?.role || "Senior Auditor"}
              </span>
            </div>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                person
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="stitch-main">
        <div className="stitch-content">{children}</div>
      </main>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div className="stitch-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="stitch-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>
                  help
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                  PARAKH Help Center & Methodology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8125rem", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
              <p>
                <strong>PARAKH</strong> (Public Accountability & Risk Assessment Knowledge Hub) is an explainable AI risk-auditing platform designed for state vigilance bodies, public accounts committees, and CAG auditors.
              </p>
              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "var(--color-surface-low)" }}>
                <strong style={{ color: "var(--color-on-surface)" }}>Corruption Risk Score (CRS 0–100):</strong>
                <p style={{ marginTop: "0.25rem", fontFamily: "JetBrains Mono", fontSize: "0.75rem" }}>
                  CRS = min(100, round(0.80 × RuleScore + 0.20 × AnomalyScore))
                </p>
                <p style={{ marginTop: "0.25rem" }}>
                  Integrates 8 deterministic red-flag heuristics with unsupervised Isolation Forest multidimensional anomaly detection.
                </p>
              </div>
              <p>
                <strong>Responsible AI & Judicial Disclaimer:</strong> PARAKH identifies procurement risk indicators for priority human audit review. It does not independently establish corruption, fraud, or legal culpability.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button type="button" className="btn-primary" onClick={() => setShowHelpModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
