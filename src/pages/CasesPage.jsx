import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const STAGES = [
  { id: "OPEN", label: "Initial Triage", color: "var(--color-secondary)" },
  { id: "INVESTIGATING", label: "Preliminary Inquiry", color: "var(--color-warning)" },
  { id: "IN_REVIEW", label: "Formal Audit Review", color: "var(--color-secondary-container)" },
  { id: "ESCALATED", label: "Vigilance Escalation", color: "var(--color-error)" },
  { id: "CLOSED", label: "Closed / Cleared", color: "var(--color-success)" }
];

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' or 'ledger'
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Selected case for inspector drawer
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);

  // New note state
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Case File Modal
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseContractNum, setNewCaseContractNum] = useState("");
  const [newCasePriority, setNewCasePriority] = useState("HIGH");
  const [newCaseNotes, setNewCaseNotes] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);

  const loadCases = async () => {
    try {
      const res = await api.get("/cases");
      setCases(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const loadCaseDetail = async (id) => {
    setCaseLoading(true);
    setSelectedCaseId(id);
    try {
      const res = await api.get(`/cases/${id}`);
      setSelectedCase(res.data);
    } catch (err) {
      console.error("Error loading case detail:", err);
    } finally {
      setCaseLoading(false);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await api.patch(`/cases/${caseId}`, { status: newStatus });
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase({ ...selectedCase, status: newStatus });
      }
      loadCases();
    } catch (err) {
      console.error("Failed to update status:", err);
      // Optimistic local update
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
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

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    setCreatingCase(true);
    try {
      await api.post("/cases", {
        title: newCaseTitle,
        contract_number: newCaseContractNum || "CTR-2024-MANUAL",
        priority: newCasePriority,
        notes: newCaseNotes
      });
      setShowNewCaseModal(false);
      setNewCaseTitle("");
      setNewCaseContractNum("");
      setNewCaseNotes("");
      loadCases();
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setCreatingCase(false);
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        !search ||
        (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
        (c.case_number && c.case_number.toLowerCase().includes(search.toLowerCase())) ||
        (c.contract_number && c.contract_number.toLowerCase().includes(search.toLowerCase()));

      const matchesPriority =
        priorityFilter === "ALL" || (c.priority && c.priority.toUpperCase() === priorityFilter);

      return matchesSearch && matchesPriority;
    });
  }, [cases, search, priorityFilter]);

  const exportAuditLedger = () => {
    const csvContent =
      "Case Number,Title,Contract Reference,Priority,Status,Assigned Auditor,Created\n" +
      filteredCases
        .map(
          (c) =>
            `"${c.case_number}","${(c.title || "").replace(/"/g, '""')}","${c.contract_number}","${c.priority}","${c.status}","${c.assigned_to_name || "Unassigned"}","${c.created_at || ""}"`
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parakh-investigations-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <span>Loading investigations hub...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Breadcrumb & Page Command Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-on-surface-variant)" }}>
            <span>Forensic Workspace</span>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <span style={{ color: "var(--color-primary)", fontWeight: 800 }}>Investigations Hub</span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "0.6875rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "0.25rem",
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface)"
              }}
            >
              SEC-VIG-2024
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
              Investigations Hub
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor: "var(--color-error-container)",
                color: "var(--color-error)",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.04em"
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-error)" }} />
              {cases.length || 87} ACTIVE DOCKETS
            </span>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", maxWidth: "48rem" }}>
            Active forensic inquiries, multi-department collusion cases, and statutory vigilance escalations under CVC oversight.
          </p>
        </div>

        {/* Action Cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--color-surface-low)",
              padding: "0.2rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-outline-variant)"
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: viewMode === "kanban" ? "var(--color-surface-lowest)" : "transparent",
                color: viewMode === "kanban" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                boxShadow: viewMode === "kanban" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                view_kanban
              </span>
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ledger")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: viewMode === "ledger" ? "var(--color-surface-lowest)" : "transparent",
                color: viewMode === "ledger" ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                boxShadow: viewMode === "ledger" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                table_rows
              </span>
              <span>Ledger</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={exportAuditLedger}
            style={{ fontSize: "0.75rem" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              download
            </span>
            <span>Export Ledger</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowNewCaseModal(true)}
            style={{ fontSize: "0.75rem" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              add_circle
            </span>
            <span>+ New Case File</span>
          </button>
        </div>
      </div>

      {/* Executive Case Telemetry Strip (4 Metric Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "var(--color-surface-low)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-primary)" }}>
                folder_special
              </span>
            </div>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-error)", backgroundColor: "var(--color-error-container)", padding: "0.15rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>
              +4 this wk
            </span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-surface)" }}>
              {cases.length || 87}
            </span>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "0.15rem" }}>
              Total Active Inquiries
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
              32 escalated to State Vigilance
            </div>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: "var(--color-surface-low)", marginTop: "0.75rem", overflow: "hidden" }}>
            <div style={{ width: "36.8%", height: "100%", backgroundColor: "var(--color-error)" }} />
          </div>
        </div>

        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "var(--color-surface-low)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-secondary)" }}>
                payments
              </span>
            </div>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-low)", padding: "0.15rem 0.4rem", borderRadius: "9999px" }}>
              HIGH RISK RATIO
            </span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-surface)" }}>
                ₹184.6
              </span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                Cr
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "0.15rem" }}>
              Disputed Procurement Value
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
              Under active statutory audit lock
            </div>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: "var(--color-surface-low)", marginTop: "0.75rem", overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", backgroundColor: "var(--color-secondary)" }} />
          </div>
        </div>

        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "var(--color-surface-low)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-warning)" }}>
                flag
              </span>
            </div>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-warning)", backgroundColor: "var(--color-warning-container)", padding: "0.15rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>
              142 Flags
            </span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-surface)" }}>
              RF-1 / RF-2
            </span>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-on-surface)", marginTop: "0.15rem" }}>
              Primary Anomaly Triggers
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
              Single-bidder & vendor concentration
            </div>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: "var(--color-surface-low)", marginTop: "0.75rem", overflow: "hidden" }}>
            <div style={{ width: "74%", height: "100%", backgroundColor: "var(--color-warning)" }} />
          </div>
        </div>

        <div className="stitch-card-inverted" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-primary-fixed)" }}>
                timer
              </span>
            </div>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-primary-fixed)", backgroundColor: "rgba(255,255,255,0.1)", padding: "0.15rem 0.4rem", borderRadius: "9999px" }}>
              TARGET &lt; 7d
            </span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--color-on-primary)" }}>
                4.8
              </span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-on-primary)" }}>
                Days
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-on-primary)", marginTop: "0.15rem" }}>
              Average Inquiry Velocity
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-on-primary-container)", marginTop: "0.25rem" }}>
              Triage anomaly to vigilance recommendation
            </div>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", marginTop: "0.75rem", overflow: "hidden" }}>
            <div style={{ width: "80%", height: "100%", backgroundColor: "var(--color-secondary-fixed)" }} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="stitch-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--color-on-surface-variant)" }}>
            search
          </span>
          <input
            type="text"
            className="stitch-input"
            style={{ paddingLeft: "2.25rem" }}
            placeholder="Filter by case docket, tender ref, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ position: "relative", width: "180px" }}>
          <select
            className="stitch-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Priority: All Tiers</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
          <span className="material-symbols-outlined" style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--color-on-surface-variant)", pointerEvents: "none" }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Main Viewport: Kanban Board vs Table Ledger */}
      {viewMode === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", alignItems: "flex-start" }}>
          {STAGES.map((stage) => {
            const stageCases = filteredCases.filter(
              (c) => (c.status || "OPEN").toUpperCase() === stage.id
            );
            return (
              <div
                key={stage.id}
                style={{
                  backgroundColor: "var(--color-surface-low)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  minHeight: "450px"
                }}
              >
                {/* Column Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-outline-variant)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: stage.color }} />
                    <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--color-on-surface)" }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "var(--color-surface-container)", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                    {stageCases.length}
                  </span>
                </div>

                {/* Cards List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {stageCases.map((c) => {
                    const isCritical = (c.priority || "").toUpperCase() === "CRITICAL";
                    return (
                      <div
                        key={c.id}
                        className="stitch-card"
                        onClick={() => loadCaseDetail(c.id)}
                        style={{
                          padding: "0.875rem",
                          cursor: "pointer",
                          borderLeft: isCritical ? "3px solid var(--color-error)" : "3px solid var(--color-outline-variant)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                            {c.case_number || `CASE-${c.id}`}
                          </span>
                          <span
                            className={`risk-pill ${isCritical ? "critical" : "medium"}`}
                            style={{ fontSize: "0.625rem" }}
                          >
                            {c.priority || "HIGH"}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--color-on-surface)", lineHeight: 1.3 }}>
                          {c.title}
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)" }}>
                          Tender: <span style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>{c.contract_number}</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-outline-variant)", paddingTop: "0.5rem", fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                              person
                            </span>
                            {c.assigned_to_name || "Investigator"}
                          </span>
                          <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}>
                            Inspect →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Ledger View */
        <div className="stitch-table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Case File</th>
                  <th>Docket Title</th>
                  <th>Linked Tender</th>
                  <th>Procuring Authority</th>
                  <th>Priority</th>
                  <th>Status Stage</th>
                  <th>Assigned Officer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--color-secondary)" }}>
                        {c.case_number || `CASE-${c.id}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>{c.title}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.75rem" }}>
                        {c.contract_number}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-on-surface-variant)" }}>
                      {c.department_name || "Divisional Office"}
                    </td>
                    <td>
                      <span className={`risk-pill ${(c.priority || "").toUpperCase() === "CRITICAL" ? "critical" : "medium"}`}>
                        {c.priority || "HIGH"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontFamily: "JetBrains Mono",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "0.25rem",
                          backgroundColor: "var(--color-surface-low)",
                          color: "var(--color-on-surface)"
                        }}
                      >
                        {c.status || "OPEN"}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-on-surface-variant)" }}>
                      {c.assigned_to_name || "Senior Auditor"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => loadCaseDetail(c.id)}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case File Inspector Drawer */}
      {selectedCaseId && (
        <div className="stitch-modal-overlay" onClick={() => setSelectedCaseId(null)}>
          <div
            className="stitch-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", padding: "1.5rem" }}
          >
            {caseLoading || !selectedCase ? (
              <div className="loading-spinner">
                <div className="spinner-ring" />
                <span>Loading case file...</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-secondary)" }}>
                        {selectedCase.case_number}
                      </span>
                      <span className={`risk-pill ${selectedCase.priority === "CRITICAL" ? "critical" : "medium"}`}>
                        {selectedCase.priority}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--color-on-surface)" }}>
                      {selectedCase.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCaseId(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Stage selector buttons */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--color-outline-variant)", borderBottom: "1px solid var(--color-outline-variant)", padding: "0.75rem 0" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)", alignSelf: "center" }}>
                    Stage Transition:
                  </span>
                  {STAGES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(selectedCase.id, st.id)}
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        border: "1px solid var(--color-outline-variant)",
                        cursor: "pointer",
                        backgroundColor: selectedCase.status === st.id ? "var(--color-primary)" : "var(--color-surface-low)",
                        color: selectedCase.status === st.id ? "var(--color-on-primary)" : "var(--color-on-surface)"
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Case Metadata */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8125rem", backgroundColor: "var(--color-surface-low)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                  <div>
                    <span style={{ color: "var(--color-on-surface-variant)" }}>Linked Contract: </span>
                    <strong style={{ fontFamily: "JetBrains Mono" }}>{selectedCase.contract_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-on-surface-variant)" }}>Authority: </span>
                    <strong>{selectedCase.department_name || "State Authority"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-on-surface-variant)" }}>Target Vendor: </span>
                    <strong>{selectedCase.vendor_name || "Supplier Entity"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-on-surface-variant)" }}>Assigned Auditor: </span>
                    <strong>{selectedCase.assigned_to_name || "Senior Auditor"}</strong>
                  </div>
                </div>

                {/* Notes and Evidence Thread */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "0.5rem" }}>
                    Investigator Notes & Audit Log
                  </h3>
                  <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {Array.isArray(selectedCase.notes) && selectedCase.notes.length > 0 ? (
                      selectedCase.notes.map((n, i) => (
                        <div key={i} style={{ padding: "0.5rem", borderRadius: "0.375rem", backgroundColor: "var(--color-surface-low)", fontSize: "0.75rem" }}>
                          <p style={{ color: "var(--color-on-surface)" }}>{n.content}</p>
                          <span style={{ fontSize: "0.625rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem", display: "block" }}>
                            {n.created_at || "Audit Entry"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)" }}>
                        No supplemental notes yet. Add initial triage findings below.
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleAddNote} style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      className="stitch-input"
                      placeholder="Add case observation, evidence reference, or statutory note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingNote}
                      style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                    >
                      {submittingNote ? "Adding..." : "Add Note"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Case File Modal */}
      {showNewCaseModal && (
        <div className="stitch-modal-overlay" onClick={() => setShowNewCaseModal(false)}>
          <div className="stitch-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>
                  create_new_folder
                </span>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                  Open New Forensic Investigation Docket
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCaseModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Investigation Docket Title *
                </label>
                <input
                  type="text"
                  required
                  className="stitch-input"
                  placeholder="e.g. Single Bidder Cartel Inquiry in Mandi Circle"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Linked Tender Reference
                </label>
                <input
                  type="text"
                  className="stitch-input"
                  placeholder="e.g. 2017_FDC_18741_6"
                  value={newCaseContractNum}
                  onChange={(e) => setNewCaseContractNum(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Priority Level
                </label>
                <select
                  className="stitch-select"
                  value={newCasePriority}
                  onChange={(e) => setNewCasePriority(e.target.value)}
                >
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                  Initial Case Notes & Rigging Evidence
                </label>
                <textarea
                  className="stitch-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                  placeholder="Document initial triggers (e.g. sole bidder, high price drift)..."
                  value={newCaseNotes}
                  onChange={(e) => setNewCaseNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewCaseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creatingCase}
                >
                  {creatingCase ? "Creating Docket..." : "Open Case File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
