import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  
  // Active selected case for modal inspection
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);

  // New note & evidence state
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState("");
  const [newEvidenceDesc, setNewEvidenceDesc] = useState("");
  const [newEvidenceType, setNewEvidenceType] = useState("DOCUMENT");
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  const loadCases = async () => {
    try {
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      const res = await api.get("/cases", { params });
      setCases(res.data);
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, priorityFilter]);

  const loadCaseDetail = async (id) => {
    setCaseLoading(true);
    try {
      const res = await api.get(`/cases/${id}`);
      setSelectedCase(res.data);
      setSelectedCaseId(id);
    } catch (err) {
      console.error("Error loading case detail:", err);
    } finally {
      setCaseLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCase) return;
    try {
      const res = await api.patch(`/cases/${selectedCase.id}`, { status: newStatus });
      setSelectedCase(res.data);
      loadCases();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCase) return;
    setSubmittingNote(true);
    try {
      await api.post(`/cases/${selectedCase.id}/notes`, { content: newNote });
      setNewNote("");
      loadCaseDetail(selectedCase.id);
      loadCases();
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidenceTitle.trim() || !selectedCase) return;
    setSubmittingEvidence(true);
    try {
      await api.post(`/cases/${selectedCase.id}/evidence`, {
        title: newEvidenceTitle,
        evidence_type: newEvidenceType,
        description: newEvidenceDesc
      });
      setNewEvidenceTitle("");
      setNewEvidenceDesc("");
      setShowEvidenceForm(false);
      loadCaseDetail(selectedCase.id);
    } catch (err) {
      console.error("Failed to add evidence:", err);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  const formatDate = (str) => new Date(str).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filteredCases = cases.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.case_number.toLowerCase().includes(s) ||
      c.contract_number.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.vendor_name.toLowerCase().includes(s) ||
      c.department_name.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div className="eyebrow">FORENSIC CASE MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Investigation Cases Hub</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Track, assign, collect evidence, and escalate flagged high-risk procurement investigations.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={loadCases} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by case #, tender #, vendor, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>STATUS:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: "var(--bg-card)", color: "#fff", border: "1px solid var(--border-color)", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="EVIDENCE_COLLECTION">Evidence Collection</option>
                <option value="ESCALATED">Escalated</option>
                <option value="CONFIRMED_SUSPICIOUS">Confirmed Suspicious</option>
                <option value="CLEARED">Cleared</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>PRIORITY:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ background: "var(--bg-card)", color: "#fff", border: "1px solid var(--border-color)", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      {loading ? (
        <div className="loading-spinner">Loading forensic investigation cases...</div>
      ) : filteredCases.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Investigation Cases Found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Open a high-risk contract from the registry or dashboard to initiate a forensic audit case.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Tender Reference</th>
                  <th>Title & Department</th>
                  <th>Winning Vendor</th>
                  <th>Risk Score</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 800, color: "var(--accent-cyan)", fontSize: 12 }}>
                        {c.case_number}
                      </span>
                    </td>
                    <td>
                      <Link to={`/contracts/${c.contract_id}`} style={{ fontWeight: 700, color: "#fff", fontSize: 12 }} className="font-mono">
                        {c.contract_number}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.department_name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.vendor_name}</span>
                    </td>
                    <td>
                      <span className={`risk-badge ${c.crs >= 70 ? "high" : c.crs >= 40 ? "medium" : "low"}`} style={{ fontSize: 11 }}>
                        CRS {c.crs}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: c.priority === "CRITICAL" ? "rgba(239, 68, 68, 0.2)" : c.priority === "HIGH" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                        color: c.priority === "CRITICAL" ? "#ef4444" : c.priority === "HIGH" ? "#f59e0b" : "#10b981"
                      }}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.06)",
                        color: c.status === "ESCALATED" ? "#ef4444" : c.status === "UNDER_REVIEW" ? "var(--accent-cyan)" : "var(--text-primary)"
                      }}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.assigned_to_name}</span>
                    </td>
                    <td>
                      <button className="btn-secondary" onClick={() => loadCaseDetail(c.id)} style={{ padding: "4px 10px", fontSize: 11 }}>
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCaseId && selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCaseId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860, maxHeight: "90vh", overflowY: "auto" }}>
            {caseLoading ? (
              <div className="loading-spinner">Loading case file...</div>
            ) : (
              <div>
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: "var(--accent-cyan)" }}>
                        {selectedCase.case_number}
                      </span>
                      <span className={`risk-badge ${selectedCase.crs >= 70 ? "high" : selectedCase.crs >= 40 ? "medium" : "low"}`}>
                        CRS {selectedCase.crs}/100
                      </span>
                      <span style={{ fontSize: 11, background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
                        {selectedCase.priority} PRIORITY
                      </span>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedCase.title}</h2>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Target Tender: <Link to={`/contracts/${selectedCase.contract_id}`} style={{ color: "var(--accent-cyan)" }}>{selectedCase.contract_number}</Link> | Department: {selectedCase.department_name} | Vendor: {selectedCase.vendor_name}
                    </div>
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedCaseId(null)} style={{ fontSize: 18, padding: "4px 8px" }}>✕</button>
                </div>

                {/* Status Workflow Selector */}
                <div style={{ background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Current Workflow Status: </span>
                    <strong style={{ color: "var(--accent-cyan)" }}>{selectedCase.status.replace("_", " ")}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["UNDER_REVIEW", "EVIDENCE_COLLECTION", "ESCALATED", "CLOSED"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "5px 10px",
                          borderRadius: 6,
                          background: selectedCase.status === st ? "var(--accent-cyan)" : "rgba(255,255,255,0.05)",
                          color: selectedCase.status === st ? "#000" : "#fff",
                          border: "1px solid var(--border-color)",
                          cursor: "pointer"
                        }}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detected Red Flags */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                    Detected Red Flags & Heuristics ({selectedCase.risk_flags?.length || 0}):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {selectedCase.risk_flags?.map((f, idx) => (
                      <div key={idx} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid var(--risk-high-border)", borderRadius: 6, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <strong style={{ fontSize: 12, color: "#fca5a5" }}>{f.flag_id}</strong>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+{f.score} pts</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.3 }}>{f.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Attachments */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Evidence Artifacts ({selectedCase.evidence?.length || 0}):
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                      style={{ fontSize: 11, padding: "4px 8px" }}
                    >
                      + Attach Evidence
                    </button>
                  </div>

                  {showEvidenceForm && (
                    <form onSubmit={handleAddEvidence} style={{ background: "rgba(0,0,0,0.3)", padding: 14, borderRadius: 8, marginBottom: 12, border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Evidence Title (e.g. Subcontracting Invoice / Spec Diff)"
                          value={newEvidenceTitle}
                          onChange={(e) => setNewEvidenceTitle(e.target.value)}
                          style={{ flex: 2, padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 12 }}
                          required
                        />
                        <select
                          value={newEvidenceType}
                          onChange={(e) => setNewEvidenceType(e.target.value)}
                          style={{ flex: 1, padding: "6px 10px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 12 }}
                        >
                          <option value="DOCUMENT">Document</option>
                          <option value="SPECIFICATION_DIFF">Spec Tailoring</option>
                          <option value="NETWORK_CLUSTER">Network Cluster</option>
                          <option value="PRICE_ANALYSIS">Price Analysis</option>
                          <option value="EXTERNAL_REPORT">External Report</option>
                        </select>
                      </div>
                      <textarea
                        placeholder="Detailed evidence description, findings, or notes..."
                        value={newEvidenceDesc}
                        onChange={(e) => setNewEvidenceDesc(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 12, minHeight: 60, marginBottom: 10 }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button type="button" className="btn-ghost" onClick={() => setShowEvidenceForm(false)} style={{ fontSize: 11 }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submittingEvidence} style={{ fontSize: 11 }}>
                          {submittingEvidence ? "Attaching..." : "Save Evidence"}
                        </button>
                      </div>
                    </form>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedCase.evidence?.map((ev) => (
                      <div key={ev.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 6, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-cyan)" }}>{ev.title}</span>
                          <span style={{ fontSize: 10, background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            {ev.evidence_type}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ev.description}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                          Logged by {ev.created_by} on {formatDate(ev.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case Notes Timeline */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                    Investigator Notes Timeline ({selectedCase.notes?.length || 0}):
                  </div>

                  <form onSubmit={handleAddNote} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <input
                      type="text"
                      placeholder="Add an investigative note to the official log..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", fontSize: 12 }}
                    />
                    <button type="submit" className="btn-primary" disabled={!newNote.trim() || submittingNote} style={{ minWidth: 100, fontSize: 12 }}>
                      {submittingNote ? "Adding..." : "Add Note"}
                    </button>
                  </form>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedCase.notes?.map((n) => (
                      <div key={n.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{n.author_name}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatDate(n.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{n.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
