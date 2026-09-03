import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello, Investigator. I am the PARAKH Forensic Assistant. I analyze real public procurement records, heuristic red flags (RF-1 to RF-8), and supplier collusion graph topologies to assist your vigilance review. How can I assist your investigation today?",
      citations: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const q = queryText || input;
    if (!q.trim()) return;

    const userMsg = { sender: "user", text: q, citations: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/assistant/query", { query: q });
      const assistantMsg = {
        sender: "assistant",
        text: res.data.answer,
        citations: res.data.citations || []
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI Query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "⚠️ Failed to query the database. Please verify backend connection.",
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    "Why is tender 2017_FDC_18741_6 high risk?",
    "Which vendors have 100% win rates in single-bidder tenders?",
    "Show departments with suspicious vendor concentration (>60%)",
    "Identify tenders awarded right below the ₹50 Lakhs threshold"
  ];

  return (
    <div className="stitch-modal-overlay" onClick={onClose}>
      <div
        className="stitch-drawer open"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "420px", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-outline-variant)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--color-surface-lowest)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "0.5rem",
                backgroundColor: "var(--color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                auto_awesome
              </span>
            </div>
            <div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-on-surface)" }}>
                Investigator AI Assistant
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--color-on-surface-variant)" }}>
                Grounded strictly in verified database evidence
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-on-surface-variant)",
              padding: "0.25rem"
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Quick Prompts */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--color-surface-low)",
            borderBottom: "1px solid var(--color-outline-variant)"
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-on-surface-variant)",
              marginBottom: "0.5rem"
            }}
          >
            Recommended Forensic Queries:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--color-surface-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  color: "var(--color-on-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
            backgroundColor: "var(--color-background)"
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  backgroundColor:
                    m.sender === "user"
                      ? "var(--color-primary)"
                      : "var(--color-surface-lowest)",
                  color:
                    m.sender === "user"
                      ? "var(--color-on-primary)"
                      : "var(--color-on-surface)",
                  border:
                    m.sender === "user"
                      ? "none"
                      : "1px solid var(--color-outline-variant)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                }}
              >
                {m.text}
              </div>

              {/* Citations */}
              {Array.isArray(m.citations) && m.citations.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-on-surface-variant)" }}>
                    Citations:
                  </span>
                  {m.citations.map((c, cIdx) => (
                    <Link
                      key={cIdx}
                      to={c.link || (c.contract_id ? `/contracts/${c.contract_id}` : "#")}
                      style={{
                        fontSize: "0.625rem",
                        fontFamily: "JetBrains Mono",
                        fontWeight: 600,
                        padding: "0.1rem 0.35rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "var(--color-surface-container)",
                        color: "var(--color-secondary)"
                      }}
                    >
                      {c.title || c.reference_id || c.contract_number || `CTR-${cIdx + 1}`}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--color-surface-lowest)",
                border: "1px solid var(--color-outline-variant)",
                fontSize: "0.75rem",
                color: "var(--color-on-surface-variant)"
              }}
            >
              <div className="spinner-ring" style={{ width: "1rem", height: "1rem" }} />
              <span>Querying forensic evidence database...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--color-surface-lowest)",
            borderTop: "1px solid var(--color-outline-variant)"
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              className="stitch-input"
              placeholder="Ask about tenders, vendor collusion, contracts, or CRS..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary"
              aria-label="Send query"
              disabled={loading || !input.trim()}
              style={{ padding: "0.5rem 0.75rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                send
              </span>
              <span style={{ display: "none" }}>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
