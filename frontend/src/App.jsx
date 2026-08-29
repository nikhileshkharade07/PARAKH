import { Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Network from "./pages/Network";

function Shell({ children }) {
  const location = useLocation();

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <div className="logo-mark">P</div>

          <div>
            <div className="logo-title">PARAKH</div>
            <div className="logo-subtitle">Risk Intelligence</div>
          </div>
        </div>

        <div className="menu-title">MAIN MENU</div>

        <nav className="sidebar-nav">

          <Link
            to="/"
            className={`sidebar-link ${
              location.pathname === "/" ? "active" : ""
            }`}
          >
            <span>▦</span>
            Dashboard
          </Link>

          <Link
            to="/contracts"
            className={`sidebar-link ${
              location.pathname.startsWith("/contracts")
                ? "active"
                : ""
            }`}
          >
            <span>▤</span>
            Contracts
          </Link>

          <Link
            to="/network"
            className={`sidebar-link ${
              location.pathname.startsWith("/network")
                ? "active"
                : ""
            }`}
          >
            <span>◎</span>
            Network
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>All services operational</small>
            </div>
          </div>

          <div className="user-card">
            <div className="user-avatar">A</div>

            <div>
              <strong>Admin</strong>
              <small>Risk Analyst</small>
            </div>
          </div>

        </div>

      </aside>

      {/* MAIN AREA */}
      <div className="main-area">

        <header className="top-header">

          <div className="mobile-brand">
            PARAKH
          </div>

          <div className="header-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search contracts, vendors..."
            />
          </div>

          <div className="header-actions">

            <button className="icon-button">
              ◔
            </button>

            <button className="icon-button notification">
              ♢
              <span></span>
            </button>

            <div className="header-user">
              <div className="user-avatar">A</div>

              <div>
                <strong>Admin</strong>
                <small>Risk Analyst</small>
              </div>
            </div>

          </div>

        </header>

        <main className="content-area">
          {children}
        </main>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/contracts"
          element={<Contracts />}
        />

        <Route
          path="/contracts/:id"
          element={
            <section className="page-card">
              <div className="eyebrow">
                INVESTIGATION
              </div>

              <h1>Contract Investigation</h1>

              <p>
                CRS, risk flags, evidence, NLP and
                optional blockchain record.
              </p>
            </section>
          }
        />

        <Route
          path="/vendors/:id"
          element={
            <section className="page-card">
              <div className="eyebrow">
                VENDOR PROFILE
              </div>

              <h1>Vendor Profile</h1>

              <p>
                Contracts, total value, departments,
                average CRS and network connections.
              </p>
            </section>
          }
        />

        <Route
          path="/departments/:id"
          element={
            <section className="page-card">
              <div className="eyebrow">
                DEPARTMENT PROFILE
              </div>

              <h1>Department Profile</h1>

              <p>
                Vendor concentration, risk trend
                and network.
              </p>
            </section>
          }
        />

        <Route
          path="/network"
          element={<Network />}
        />

      </Routes>
    </Shell>
  );
}