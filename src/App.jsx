import React, { useState, useEffect, lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import { api } from "./services/api";

// Route-based code splitting for 8 Stitch modules
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const InvestigationPage = lazy(() => import("./pages/InvestigationPage"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const SimulatorPage = lazy(() => import("./pages/SimulatorPage"));
const IngestPage = lazy(() => import("./pages/IngestPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const InvestigatorPage = lazy(() => import("./pages/InvestigatorPage"));

// Backward compatibility components
const VendorProfilePage = lazy(() => import("./pages/VendorProfilePage"));
const DepartmentProfilePage = lazy(() => import("./pages/DepartmentProfilePage"));

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    username: "investigator",
    full_name: "Priya Sharma",
    role: "INVESTIGATOR"
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get("/auth/me");
        if (res.data) setCurrentUser(res.data);
      } catch {
        // Default investigator profile
      }
    }
    checkAuth();
  }, []);

  return (
    <AppShell currentUser={currentUser}>
      <Suspense fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, gap: 12, color: "var(--text-muted)" }}>
          <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite" }}>sync</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Loading PARAKH Intelligence Module...</span>
        </div>
      }>
        <Routes>
          {/* 8 Primary Stitch Modules */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/risk-sandbox" element={<SimulatorPage />} />
          <Route path="/ingest" element={<IngestPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/investigator" element={<InvestigatorPage />} />

          {/* Backward compatibility redirects and routes */}
          <Route path="/contracts/:id" element={<InvestigationPage />} />
          <Route path="/cases" element={<InvestigatorPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/vendors/:id" element={<VendorProfilePage />} />
          <Route path="/departments/:id" element={<DepartmentProfilePage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
