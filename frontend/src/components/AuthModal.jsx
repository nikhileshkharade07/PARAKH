import { useState } from "react";
import { api } from "../services/api";

export default function AuthModal({ isOpen, onClose, currentUser, onAuthChange }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (userToLogin, pwdToLogin) => {
    const u = userToLogin || username;
    const p = pwdToLogin || password;
    if (!u || !p) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", { username: u, password: p });
      localStorage.setItem("parakh_token", res.data.access_token);
      if (onAuthChange) {
        onAuthChange(res.data.user);
      }
      onClose();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("parakh_token");
    if (onAuthChange) {
      onAuthChange(null);
    }
    onClose();
  };

  const DEMO_ROLES = [
    { name: "Forensic Investigator", role: "INVESTIGATOR", username: "investigator", color: "#38bdf8", desc: "Full case management, evidence collection & AI audit tools" },
    { name: "Lead Auditor", role: "AUDITOR", username: "auditor", color: "#10b981", desc: "Dataset ingestion, heuristic screening & report generation" },
    { name: "Chief Audit Officer", role: "ADMIN", username: "admin", color: "#a855f7", desc: "System configuration, user management & full access" },
    { name: "Department Officer", role: "DEPARTMENT_OFFICER", username: "officer", color: "#f59e0b", desc: "Department-specific tender responses & audit view" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>RBAC Role & Authentication</h2>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Current User: <strong>{currentUser?.full_name || "Investigator (Default Demo)"}</strong> [{currentUser?.role || "INVESTIGATOR"}]
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: "4px 8px" }}>✕</button>
        </div>

        {/* Quick 1-Click Role Switcher */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>
            SWITCH DEMO ROLE (1-CLICK):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {DEMO_ROLES.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLogin(r.username, r.username)}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  padding: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{r.name}</span>
                  <span style={{ fontSize: 10, background: `${r.color}22`, color: r.color, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                    {r.role}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.3 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Login Form */}
        <div style={{ padding: 16, background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>
            OR SIGN IN WITH CREDENTIALS:
          </div>
          {error && (
            <div style={{ padding: 10, background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--risk-high-border)", borderRadius: 6, color: "#fca5a5", fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g. auditor)"
                style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 13 }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 13 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" className="btn-secondary" onClick={handleLogout} style={{ fontSize: 12 }}>
                Clear Session
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: 100 }}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
