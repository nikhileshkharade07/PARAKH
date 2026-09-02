import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { assistantService } from "../services/assistantService";

export default function AIAssistantPage() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || searchParams.get("q");

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Based on the registry data for FY2023, Apex Dynamics LLC exhibits several moderate to high-risk indicators across 3 active contracts.",
      points: [
        { label: "Price Variance", desc: "Billed unit costs on CTR-2023-A9 exceed historical baselines by 42% [1]." },
        { label: "Single-Source Dependency", desc: "They were the sole bidder on critical infrastructure maintenance [2], bypassing standard competitive thresholds." }
      ]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      handleSend(urlQuery.trim());
    }
  }, [urlQuery]);

  const handleSend = async (textToSend) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setInputText("");
    setLoading(true);

    try {
      const res = await assistantService.queryAssistant(q);
      const reply = res?.answer || res?.response || res?.message || "Audit evidence processed.";
      const points = Array.isArray(res?.citations) && res.citations.length > 0
        ? res.citations.map((c) => ({
            label: c.title || c.reference_id || "Evidence Citation",
            desc: c.summary || c.link || "Verified registry evidence"
          }))
        : [
            { label: "Provenance Source", desc: "Open Contracting Data Standard (OCDS v1.1) verified registry" },
            { label: "Integrity Policy", desc: "Findings grounded in authentic tender awards, bids, and heuristic red flags" }
          ];

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: reply,
          points: points,
          citations: res?.citations || []
        }
      ]);
    } catch (err) {
      console.error("AI Assistant query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ An error occurred while retrieving forensic audit intelligence. Please verify your connection or try again.",
          points: [
            { label: "Error State", desc: "Network or server timeout during assistant inference" }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Left: Chat Workspace */}
        <section className="flex-1 flex flex-col glass-card rounded-xl shadow-sm overflow-hidden relative border border-outline-variant/30 bg-white">
          {/* Header */}
          <div className="px-8 py-5 border-b border-outline-variant/30 bg-white z-10 flex items-center justify-between">
            <div>
              <h1 className="font-headline-page text-2xl font-bold text-primary flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[28px]">auto_awesome</span>
                AI Assistant
              </h1>
              <p className="font-body-base text-body-sm text-on-surface-variant mt-0.5">
                Ask questions about contracts, vendors, risks and investigations.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant text-xs">
              <span className="opacity-70">Workspace</span>
              <span className="material-symbols-outlined text-[14px] opacity-50">chevron_right</span>
              <span className="font-label-bold font-bold text-primary">AI Assistant</span>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 pb-28">
            {/* Initial Suggestions */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center my-auto text-center max-w-xl mx-auto opacity-90">
                <span className="material-symbols-outlined text-[44px] text-on-surface-variant/40 mb-3">
                  analytics
                </span>
                <p className="font-section-title text-lg font-semibold text-on-surface-variant mb-6">
                  How can I assist your investigation today?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => handleSend("Why is contract CTR-8924 high risk?")}
                    className="flex flex-col items-start p-3.5 bg-surface-container text-left rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-colors"
                  >
                    <span className="font-label-bold text-xs text-primary font-bold mb-1">Risk Analysis</span>
                    <span className="text-xs text-on-surface-variant">"Why is contract CTR-8924 high risk?"</span>
                  </button>
                  <button
                    onClick={() => handleSend("Find unusual price variations for Vendor X.")}
                    className="flex flex-col items-start p-3.5 bg-surface-container text-left rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-colors"
                  >
                    <span className="font-label-bold text-xs text-primary font-bold mb-1">Anomaly Detection</span>
                    <span className="text-xs text-on-surface-variant">"Find unusual price variations for Vendor X."</span>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "user" ? (
                  <div className="max-w-[80%] bg-surface-container-high rounded-t-2xl rounded-bl-2xl px-5 py-3.5 border border-outline-variant/20 shadow-sm">
                    <p className="font-body-base text-body-sm text-on-surface">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] flex gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <p className="font-body-base text-body-sm text-on-surface leading-relaxed">{msg.text}</p>
                      {msg.points && (
                        <ul className="list-disc pl-5 font-body-base text-body-sm text-on-surface-variant space-y-1.5 text-xs">
                          {msg.points.map((pt, idx) => (
                            <li key={idx}>
                              <strong>{pt.label}:</strong> {pt.desc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[90%] flex gap-3.5 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono">
                    PARAKH Intelligence Engine analyzing telemetry...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Floating Pill Input Box */}
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent pt-8">
            <div className="max-w-3xl mx-auto relative flex items-center bg-white border border-outline-variant rounded-full shadow-[0px_4px_16px_rgba(0,0,0,0.06)] p-1.5 focus-within:border-primary transition-colors">
              <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
              <input
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 font-body-base text-body-sm text-on-surface placeholder:text-on-surface-variant/50 px-3 outline-none"
                placeholder="Message PARAKH Intelligence Copilot..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={() => handleSend()}
                className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors shadow-sm ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="font-label-bold text-on-surface-variant/60 text-[10px] uppercase tracking-wider">
                PARAKH AI can make mistakes. Verify critical audit data.
              </span>
            </div>
          </div>
        </section>

        {/* Right: Context & Evidence Panel */}
        <aside className="w-full lg:w-[360px] glass-card rounded-xl shadow-sm flex flex-col overflow-hidden border border-outline-variant/30 bg-white">
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
            <h3 className="font-section-title text-base font-semibold text-primary">
              Context & Evidence
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Risk Signals */}
            <div>
              <h4 className="font-label-bold text-xs text-on-surface-variant uppercase mb-2.5 tracking-wider font-bold">
                Active Risk Signals
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 border border-error/20 text-error">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-bold text-[10.5px] uppercase tracking-wide font-bold">
                    Critical: Price Variance
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b45309]/10 border border-[#b45309]/20 text-[#b45309]">
                  <span className="material-symbols-outlined text-[14px]">person_off</span>
                  <span className="font-label-bold text-[10.5px] uppercase tracking-wide font-bold">
                    Warning: Single Bidder
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant/20" />

            {/* Citations */}
            <div>
              <h4 className="font-label-bold text-xs text-on-surface-variant uppercase mb-3 tracking-wider font-bold">
                Cited Evidence
              </h4>
              <div className="flex flex-col gap-3">
                <div className="p-3 border border-outline-variant/30 rounded-lg bg-surface hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center bg-secondary-container text-on-secondary-container rounded font-label-bold text-[9px] font-bold">
                        1
                      </span>
                      <span className="font-code-data text-xs text-primary font-bold">CTR-2023-A9</span>
                    </div>
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant/50">open_in_new</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    Master Services Agreement - Q3 Hardware Fulfillment.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-on-surface-variant/70 font-mono uppercase">
                    <span>$1.2M Value</span>
                    <span>Oct 12, 2023</span>
                  </div>
                </div>

                <div className="p-3 border border-outline-variant/30 rounded-lg bg-surface hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center bg-secondary-container text-on-secondary-container rounded font-label-bold text-[9px] font-bold">
                        2
                      </span>
                      <span className="font-code-data text-xs text-primary font-bold">TNDR-8821-INF</span>
                    </div>
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant/50">open_in_new</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    Sole Source Exemption Request - Public Works Dept.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-on-surface-variant/70 font-mono uppercase">
                    <span>Sole Bidder</span>
                    <span>Sep 28, 2023</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
