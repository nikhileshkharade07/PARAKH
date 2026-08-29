import { useState, useEffect } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailContainer from "./pages/ContractDetailContainer";
import VendorProfilePage from "./pages/VendorProfilePage";
import DepartmentProfilePage from "./pages/DepartmentProfilePage";
import NetworkPage from "./pages/NetworkPage";
import SimulatorPage from "./pages/SimulatorPage";
import CasesPage from "./pages/CasesPage";
import DataIngestionModal from "./components/DataIngestionModal";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import AuthModal from "./components/AuthModal";
import { api } from "./services/api";

function Shell({ children, onOpenIngest, onOpenAI, onOpenAuth, currentUser }) {
  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand-container">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="brand-logo">P</div>
            <div>
              <div className="brand-title">PARAKH</div>
              <div className="brand-subtitle">AI Public Procurement Risk Auditor</div>
            </div>
          </Link>
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} end>
            Dashboard
          </NavLink>
          <NavLink to="/contracts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Contracts Registry
          </NavLink>
          <NavLink to="/cases" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Investigations
          </NavLink>
          <NavLink to="/network" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Network Graph
          </NavLink>
          <NavLink to="/simulator" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Risk Sandbox
          </NavLink>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenIngest}
            style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}
          >
            <span>📤</span> Ingest Data
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAI}
            style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}
          >
            <span>🤖</span> AI Assistant
          </button>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              borderRadius: 20,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
              color: "#fff"
            }}
          >
            <span>🛡️</span>
            <span style={{ fontWeight: 700 }}>{currentUser?.username || "Investigator"}</span>
            <span style={{ fontSize: 10, background: "rgba(56, 189, 248, 0.2)", color: "var(--accent-cyan)", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
              {currentUser?.role || "INVESTIGATOR"}
            </span>
          </button>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  const [ingestOpen, setIngestOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data);
      } catch (err) {
        // Default demo investigator
        setCurrentUser({
          username: "investigator",
          full_name: "Priya Sharma (Forensic Investigator)",
          role: "INVESTIGATOR"
        });
      }
    }
    checkAuth();
  }, []);

  return (
    <>
      <Shell
        onOpenIngest={() => setIngestOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        currentUser={currentUser}
      >
        <Routes>
          <Route path="/" element={<DashboardPage onOpenIngest={() => setIngestOpen(true)} onOpenAI={() => setAiOpen(true)} />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:id" element={<ContractDetailContainer />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/vendors/:id" element={<VendorProfilePage />} />
          <Route path="/departments/:id" element={<DepartmentProfilePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
        </Routes>
      </Shell>

      <DataIngestionModal
        isOpen={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onIngestSuccess={() => {
          // Trigger reload if on dashboard
        }}
      />

      <AIAssistantDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        currentUser={currentUser}
        onAuthChange={(user) => setCurrentUser(user)}
      />
    </>
  );
}
