import { Link, NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailContainer from "./pages/ContractDetailContainer";
import VendorProfilePage from "./pages/VendorProfilePage";
import DepartmentProfilePage from "./pages/DepartmentProfilePage";
import NetworkPage from "./pages/NetworkPage";
import SimulatorPage from "./pages/SimulatorPage";

function Shell({ children }) {
  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand-container">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="brand-logo">P</div>
            <div>
              <div className="brand-title">PARAKH</div>
              <div className="brand-subtitle">Procurement Risk Auditor</div>
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
          <NavLink to="/network" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Network Graph
          </NavLink>
          <NavLink to="/simulator" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Risk Sandbox
          </NavLink>
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/:id" element={<ContractDetailContainer />} />
        <Route path="/vendors/:id" element={<VendorProfilePage />} />
        <Route path="/departments/:id" element={<DepartmentProfilePage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
      </Routes>
    </Shell>
  );
}
