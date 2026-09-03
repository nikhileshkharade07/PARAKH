import { useState, useEffect, lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import DataIngestionModal from "./components/DataIngestionModal";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import AuthModal from "./components/AuthModal";
import { api } from "./services/api";

// Route-based code splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const ContractDetailContainer = lazy(() => import("./pages/ContractDetailContainer"));
const VendorProfilePage = lazy(() => import("./pages/VendorProfilePage"));
const DepartmentProfilePage = lazy(() => import("./pages/DepartmentProfilePage"));
const NetworkPage = lazy(() => import("./pages/NetworkPage"));
const SimulatorPage = lazy(() => import("./pages/SimulatorPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));

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
        // Default senior auditor clearance
        setCurrentUser({
          username: "J. Doe",
          full_name: "J. Doe (Senior Auditor)",
          role: "Senior Auditor"
        });
      }
    }
    checkAuth();
  }, []);

  return (
    <>
      <AppShell
        onOpenIngest={() => setIngestOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        currentUser={currentUser}
      >
        <Suspense
          fallback={
            <div className="loading-spinner">
              <div className="spinner-ring" />
              <span>Loading forensic workspace...</span>
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  onOpenIngest={() => setIngestOpen(true)}
                  onOpenAI={() => setAiOpen(true)}
                />
              }
            />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/:id" element={<ContractDetailContainer />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/vendors/:id" element={<VendorProfilePage />} />
            <Route path="/departments/:id" element={<DepartmentProfilePage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
          </Routes>
        </Suspense>
      </AppShell>

      <DataIngestionModal
        isOpen={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onIngestSuccess={() => {}}
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
