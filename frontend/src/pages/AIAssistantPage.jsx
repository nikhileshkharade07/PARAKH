import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { assistantService } from "../services/assistantService";

export default function AIAssistantPage() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || searchParams.get("q");
  const contractIdParam = searchParams.get("contract_id") || searchParams.get("contractId");

  const [activeContractId, setActiveContractId] = useState(contractIdParam || null);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Investigator. I am the PARAKH Forensic Investigation Copilot. You can ask me natural questions about monitored tenders, suppliers, CRS scores, or collusion patterns."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (contractIdParam) {
      setActiveContractId(contractIdParam);
    }
  }, [contractIdParam]);

  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      handleSend(urlQuery.trim());
    }
  }, [urlQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg = { sender: "user", text: q.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await assistantService.queryAssistant(q.trim(), activeContractId);
      const reply = res?.answer || res?.response || res?.message || "Audit evidence processed.";
      const citations = Array.isArray(res?.citations) ? res.citations : [];

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: reply,
          citations: citations
        }
      ]);
    } catch (err) {
      console.error("AI Assistant query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I couldn't reach the AI service right now. Please verify your connection or try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "ai",
        text: "Conversation cleared. How can I assist your procurement audit investigation?"
      }
    ]);
  };

  // Helper to render formatted markdown text cleanly
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split paragraphs
    const paragraphs = text.split("\n\n");

    return (
      <div className="flex flex-col gap-2.5 leading-relaxed text-sm">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Header line
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={pIdx} className="font-headline-page text-base font-bold text-primary mt-1">
                {trimmed.replace(/^###\s*/, "")}
              </h3>
            );
          }

          // Bullet list
          if (trimmed.includes("\n- ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const items = trimmed.split(/\n[-*]\s+/).filter(Boolean);
            return (
              <ul key={pIdx} className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                {items.map((it, itIdx) => (
                  <li key={itIdx}>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(it) }} />
                  </li>
                ))}
              </ul>
            );
          }

          // Numbered list
          if (/^\d+\.\s+/.test(trimmed)) {
            const items = trimmed.split(/\n\d+\.\s+/).filter(Boolean);
            return (
              <ol key={pIdx} className="list-decimal pl-5 space-y-1 text-xs text-on-surface-variant">
                {items.map((it, itIdx) => (
                  <li key={itIdx}>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(it) }} />
                  </li>
                ))}
              </ol>
            );
          }

          // Regular paragraph
          return (
            <p key={pIdx} className="text-on-surface text-xs md:text-sm">
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
            </p>
          );
        })}
      </div>
    );
  };

  // Simple, safe inline markdown formatter for bold, code, links
  const formatInlineMarkdown = (raw) => {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-surface-container font-mono text-[11px] rounded">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary font-bold underline hover:opacity-80">$1</a>');
  };

  const samplePrompts = [
    "Who is the only bidder?",
    "Who won contract 2017_PWD_16278_1?",
    "Why is contract 2017_PWD_16278_1 risky?",
    "What is the CRS of contract 2017_PWD_16278_1?",
    "Which vendor has the highest risk?",
    "Which department has the highest-risk contracts?",
    "Show me suspicious procurement patterns",
    "What is PARAKH?",
    "What is CRS?",
    "Explain RF1 to RF8"
  ];

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Left: Chat Workspace */}
        <section className="flex-1 flex flex-col glass-card rounded-xl shadow-sm overflow-hidden relative border border-outline-variant/30 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-white dark:bg-slate-900 z-10 flex items-center justify-between">
            <div>
              <h1 className="font-headline-page text-xl font-bold text-primary flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[24px]">auto_awesome</span>
                PARAKH AI Investigation Copilot
              </h1>
              <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
                Conversational forensic intelligence grounded in verified public procurement records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeContractId && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono font-bold">
                  <span className="material-symbols-outlined text-[14px]">policy</span>
                  <span>Context: {activeContractId}</span>
                  <button
                    onClick={() => setActiveContractId(null)}
                    className="hover:text-error ml-1 cursor-pointer"
                    title="Clear contract focus"
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                onClick={handleClearChat}
                className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary rounded-lg border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-1"
                title="Reset conversation"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 pb-36">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "user" ? (
                  <div className="max-w-[80%] bg-surface-container-high dark:bg-slate-800 rounded-t-2xl rounded-bl-2xl px-5 py-3.5 border border-outline-variant/20 shadow-sm">
                    <p className="font-body-base text-sm text-on-surface">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] flex gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </div>
                    <div className="flex flex-col gap-2.5 bg-surface-container-lowest dark:bg-slate-950/60 p-4 rounded-2xl border border-outline-variant/20">
                      {renderFormattedText(msg.text)}

                      {/* Evidence Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant w-full">
                            Verified Citations:
                          </span>
                          {msg.citations.map((c, idx) => (
                            <Link
                              key={idx}
                              to={c.link || "#"}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container-high rounded-md text-xs font-mono font-medium text-primary border border-outline-variant/30 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">link</span>
                              <span>{c.title || c.reference_id}</span>
                            </Link>
                          ))}
                        </div>
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
                    PARAKH Intelligence Copilot querying procurement telemetry...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions & Input Box */}
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 to-transparent pt-6">
            {/* Quick Prompt Chips */}
            <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {samplePrompts.slice(0, 5).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/40 rounded-full text-[11px] font-medium text-on-surface-variant hover:text-primary hover:border-primary whitespace-nowrap transition-colors shadow-xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Pill */}
            <div className="max-w-3xl mx-auto relative flex items-center bg-white dark:bg-slate-800 border border-outline-variant rounded-full shadow-[0px_4px_16px_rgba(0,0,0,0.06)] p-1.5 focus-within:border-primary transition-colors">
              <input
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 font-body-base text-body-sm text-on-surface placeholder:text-on-surface-variant/50 px-4 outline-none"
                placeholder="Ask PARAKH Copilot (e.g. 'Who is the only bidder?', 'Why is this contract risky?')..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputText.trim()}
                className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm ml-1 cursor-pointer"
                title="Send inquiry"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="font-label-bold text-on-surface-variant/60 text-[10px] uppercase tracking-wider">
                PARAKH AI answers are grounded in authentic procurement data & statutory red flags.
              </span>
            </div>
          </div>
        </section>

        {/* Right: Context & Evidence Panel */}
        <aside className="w-full lg:w-[360px] glass-card rounded-xl shadow-sm flex flex-col overflow-hidden border border-outline-variant/30 bg-white dark:bg-slate-900">
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container/30 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
              <h3 className="font-section-title text-base font-semibold text-primary">
                Active Audit Context
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Risk Signals */}
            <div>
              <h4 className="font-label-bold text-xs text-on-surface-variant uppercase mb-2.5 tracking-wider font-bold">
                Active Risk Signals
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 border border-error/20 text-error">
                  <span className="material-symbols-outlined text-[14px]">person_off</span>
                  <span className="font-label-bold text-[10.5px] uppercase tracking-wide font-bold">
                    RF-1: Single Bidder
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b45309]/10 border border-[#b45309]/20 text-[#b45309]">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span className="font-label-bold text-[10.5px] uppercase tracking-wide font-bold">
                    RF-4: Compressed Window
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-bold text-[10.5px] uppercase tracking-wide font-bold">
                    RF-5: Price Deviation
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant/20" />

            {/* Quick Evidence Links */}
            <div>
              <h4 className="font-label-bold text-xs text-on-surface-variant uppercase mb-3 tracking-wider font-bold">
                Monitored High-Risk Targets
              </h4>
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => handleSend("Why is contract 2017_PWD_16278_1 risky?")}
                  className="p-3 border border-outline-variant/30 rounded-lg bg-surface dark:bg-slate-800 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-code-data text-xs text-primary font-bold">2017_PWD_16278_1</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error">CRS 31</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    Executive Engineer PWD • Rajat Thakur (Single Bidder)
                  </p>
                </div>

                <div
                  onClick={() => handleSend("Why is contract GEM-2024-C-000007 risky?")}
                  className="p-3 border border-outline-variant/30 rounded-lg bg-surface dark:bg-slate-800 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-code-data text-xs text-primary font-bold">GEM-2024-C-000007</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error">CRS 92</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    IT & Electronics • Apex Solutions Ltd (Spec Overlap 94%)
                  </p>
                </div>

                <div
                  onClick={() => handleSend("Which vendor has the highest risk?")}
                  className="p-3 border border-outline-variant/30 rounded-lg bg-surface dark:bg-slate-800 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-code-data text-xs text-primary font-bold">Supplier Profile</span>
                    <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-tight">
                    Apex Solutions Ltd • 8 Tenders • ₹4.85 Cr
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
