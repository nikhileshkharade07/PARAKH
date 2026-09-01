import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello, Investigator. I am the PARAKH Forensic Assistant. I analyze real procurement records, CRS heuristic red flags, and supplier graph topologies to assist your investigation. How can I help you today?",
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
          text: "⚠️ Failed to query the database. Please verify the backend connection.",
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    "Why is tender GEM-DEMO-000007 high risk?",
    "Which vendors have unusually high win rates?",
    "Show departments with suspicious vendor concentration",
    "Which tenders had one bidder and compressed submission windows?"
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.95)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #38bdf8, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Investigator AI Assistant</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Grounded strictly in verified database evidence</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: "4px 8px" }}>✕</button>
        </div>

        {/* Quick prompt chips */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 700 }}>SUGGESTED FORENSIC QUERIES:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                style={{
                  fontSize: 11,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 14,
                  padding: "4px 10px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Message timeline */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                background: m.sender === "user" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "rgba(30, 41, 59, 0.8)",
                border: "1px solid " + (m.sender === "user" ? "transparent" : "var(--border-color)"),
                borderRadius: 10,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 6 }}>
                    VERIFIED CITATIONS ({m.citations.length}):
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {m.citations.map((c, cIdx) => (
                      <Link
                        key={cIdx}
                        to={c.link || "#"}
                        onClick={onClose}
                        style={{
                          fontSize: 12,
                          background: "rgba(0, 0, 0, 0.25)",
                          padding: "6px 10px",
                          borderRadius: 6,
                          color: "#38bdf8",
                          display: "block",
                          border: "1px solid rgba(56, 189, 248, 0.2)"
                        }}
                      >
                        <strong>{c.title}</strong> — {c.summary} →
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", background: "rgba(30, 41, 59, 0.8)", padding: "10px 16px", borderRadius: 10, fontSize: 13, color: "var(--accent-cyan)" }}>
              Analyzing forensic database records...
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.95)" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: "flex", gap: 10 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tenders, vendor collusion, red flags..."
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 13
              }}
            />
            <button type="submit" className="btn-primary" disabled={!input.trim() || loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
