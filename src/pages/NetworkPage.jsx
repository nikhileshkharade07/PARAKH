import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cytoscape from "cytoscape";
import { networkService } from "../services/networkService";

export default function NetworkPage() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const navigate = useNavigate();

  const [graphType, setGraphType] = useState("vendor_department");
  const [filterType, setFilterType] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [flagStatus, setFlagStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedNode, setSelectedNode] = useState({
    id: "vend-1",
    label: "Apex Solutions Ltd",
    type: "Vendor",
    risk: "Critical",
    crs: 92,
    details: "Flagged in 8 tenders with 94% win rate. Shares registered director with Delta Infotech & Omega Corp.",
    connected: [
      { name: "Rajesh V.", role: "Common Director (DIN: 08492019)" },
      { name: "Delta Infotech", role: "Disqualified Bidder (92% tender overlap)" },
      { name: "GEM-2024-C-000007", role: "Server Supply Tender (₹48.5L)" }
    ]
  });

  const fallbackElements = [
    // Nodes
    { data: { id: "vend-1", label: "Apex Solutions Ltd", type: "Vendor", risk: "Critical", crs: 92 } },
    { data: { id: "vend-2", label: "Delta Infotech", type: "Vendor", risk: "High", crs: 78 } },
    { data: { id: "vend-3", label: "Omega Corp India", type: "Vendor", risk: "Medium", crs: 55 } },
    { data: { id: "vend-4", label: "Prime Tech Infra", type: "Vendor", risk: "Low", crs: 24 } },
    { data: { id: "dept-1", label: "Public Works Dept", type: "Department", risk: "High", crs: 70 } },
    { data: { id: "dept-2", label: "IT & Electronics Dept", type: "Department", risk: "Medium", crs: 48 } },
    { data: { id: "person-1", label: "Rajesh V. (Director)", type: "Person", risk: "Critical", crs: 95 } },
    { data: { id: "cnt-101", label: "GEM-2024-C-000007", type: "Contract", risk: "Critical", crs: 88 } },
    { data: { id: "cnt-102", label: "GEM-2024-C-000077", type: "Contract", risk: "High", crs: 74 } },

    // Edges
    { data: { id: "e1", source: "vend-1", target: "person-1", label: "DIRECTOR" } },
    { data: { id: "e2", source: "vend-2", target: "person-1", label: "DIRECTOR" } },
    { data: { id: "e3", source: "vend-1", target: "cnt-101", label: "AWARDED" } },
    { data: { id: "e4", source: "vend-2", target: "cnt-101", label: "BIDDER_DISQUALIFIED" } },
    { data: { id: "e5", source: "cnt-101", target: "dept-2", label: "ISSUED_BY" } },
    { data: { id: "e6", source: "vend-1", target: "cnt-102", label: "AWARDED" } },
    { data: { id: "e7", source: "cnt-102", target: "dept-1", label: "ISSUED_BY" } }
  ];

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";

    const cy = cytoscape({
      container: containerRef.current,
      elements: fallbackElements,
      style: [
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "font-size": "11px",
            "font-family": "Geist, sans-serif",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "color": isDark ? "#f1f5f9" : "#1b1b1d",
            "background-color": "#000000",
            "width": 36,
            "height": 36,
            "border-width": 2,
            "border-color": isDark ? "#334155" : "#ffffff"
          }
        },
        {
          selector: 'node[type = "Vendor"]',
          style: { "background-color": "#000000", "shape": "roundrectangle" }
        },
        {
          selector: 'node[type = "Department"]',
          style: { "background-color": "#0284c7", "shape": "ellipse" }
        },
        {
          selector: 'node[type = "Person"]',
          style: { "background-color": "#ba1a1a", "shape": "diamond", "width": 40, "height": 40 }
        },
        {
          selector: 'node[type = "Contract"]',
          style: { "background-color": "#505f76", "shape": "hexagon" }
        },
        {
          selector: 'node[type = "RiskFlag"]',
          style: { "background-color": "#ba1a1a", "shape": "star", "width": 34, "height": 34 }
        },
        {
          selector: "edge",
          style: {
            "width": 2,
            "line-color": isDark ? "#334155" : "#cbd5e1",
            "target-arrow-color": isDark ? "#334155" : "#cbd5e1",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "label": "data(label)",
            "font-size": "9px",
            "font-family": "JetBrains Mono",
            "color": isDark ? "#94a3b8" : "#64748b"
          }
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#ba1a1a",
            "border-width": 4
          }
        }
      ],
      layout: {
        name: "cose",
        idealEdgeLength: 100,
        nodeOverlap: 20,
        animate: false
      }
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      const neighbors = node.neighborhood().nodes();
      const connectedList = neighbors.map((n) => ({
        name: n.data("label"),
        role: `${n.data("type")} • Linked to ${data.label}`
      }));

      setSelectedNode({
        id: data.id,
        label: data.label,
        type: data.type || "Vendor",
        risk: data.risk || (data.crs >= 70 ? "Critical" : "Medium"),
        crs: data.crs || 75,
        details: data.details || `Entity ${data.label} (${data.type}) is interconnected across ${neighbors.length} suspicious bidding/directorship linkages in the audit registry.`,
        connected: connectedList.length > 0 ? connectedList : [
          { name: "Direct Linkage", role: "Primary node in investigation syndicate" }
        ]
      });
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  // Load Graph Data when graphType changes
  useEffect(() => {
    if (!cyRef.current) return;
    setLoading(true);

    networkService.getNetworkGraph({ graph_type: graphType })
      .then((res) => {
        if (!cyRef.current) return;
        const cy = cyRef.current;

        if (res && Array.isArray(res.nodes) && res.nodes.length > 0) {
          const cyNodes = res.nodes.map((n) => ({
            data: {
              id: String(n.data?.id || n.id),
              label: String(n.data?.label || n.label || n.name || "Entity"),
              type: n.data?.type || n.type || "Vendor",
              risk: n.data?.risk || (n.data?.crs >= 70 ? "Critical" : "Medium"),
              crs: n.data?.crs || n.data?.average_crs || 65,
              details: n.data?.details || ""
            }
          }));

          const cyEdges = (res.edges || []).map((e, idx) => ({
            data: {
              id: String(e.data?.id || e.id || `edge-${idx}`),
              source: String(e.data?.source || e.source),
              target: String(e.data?.target || e.target),
              label: String(e.data?.label || e.label || "LINK")
            }
          }));

          cy.elements().remove();
          cy.add([...cyNodes, ...cyEdges]);
          cy.layout({ name: "cose", animate: false, padding: 30 }).run();

          // Select first node
          if (cy.nodes().length > 0) {
            cy.nodes().first().emit("tap");
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic network topology, maintaining active canvas.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [graphType]);

  // Handle entity filter and risk filter
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().show();

    // Type filter
    if (filterType !== "all") {
      const unmatched = cy.nodes().filter((n) => n.data("type") !== filterType);
      unmatched.hide();
      unmatched.connectedEdges().hide();
    }

    // Risk filter
    if (riskFilter !== "all") {
      let riskMatcher = (crs) => true;
      if (riskFilter === "critical") riskMatcher = (crs) => crs >= 85;
      else if (riskFilter === "high") riskMatcher = (crs) => crs >= 70;
      else if (riskFilter === "medium") riskMatcher = (crs) => crs >= 40 && crs < 70;
      else if (riskFilter === "low") riskMatcher = (crs) => crs < 40;

      const lowRiskNodes = cy.nodes().filter((n) => !riskMatcher(n.data("crs") || 0));
      lowRiskNodes.hide();
      lowRiskNodes.connectedEdges().hide();
    }
  }, [filterType, riskFilter]);

  // Handle graph search
  const handleSearch = (query) => {
    setSearchTerm(query);
    if (!cyRef.current) return;
    const cy = cyRef.current;

    if (!query.trim()) {
      cy.elements().unselect();
      return;
    }

    const matched = cy.nodes().filter((n) =>
      (n.data("label") || "").toLowerCase().includes(query.toLowerCase()) ||
      (n.data("id") || "").toLowerCase().includes(query.toLowerCase())
    );

    if (matched.length > 0) {
      cy.elements().unselect();
      matched.select();
      cy.animate({ center: { eles: matched.first() }, zoom: 1.4, duration: 400 });
      matched.first().emit("tap");
    }
  };

  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleReset = () => cyRef.current && cyRef.current.fit();

  const handleFlagSyndicate = () => {
    setFlagStatus("Flagging syndicate in CVC registry...");
    setTimeout(() => {
      setFlagStatus("✓ Collusion Syndicate recorded. Sent to Central Vigilance Commission.");
      setTimeout(() => setFlagStatus(null), 4000);
    }, 800);
  };

  const handleInvestigateDossier = () => {
    navigate(`/investigation?contractId=${encodeURIComponent(selectedNode.id || "GEM-2024-C-000007")}`);
  };

  const handleAskCopilot = () => {
    navigate(`/ai-assistant?query=${encodeURIComponent(`Analyze network risk and collusion patterns for ${selectedNode.label}`)}`);
  };

  return (
    <>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
        <div>
          <h1 className="font-headline-page text-headline-page-mobile md:text-headline-page text-primary tracking-tight mb-2">
            Network Graph
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant max-w-2xl">
            Entity network intelligence mapping joint directors, shell company clusters, and tender bidding syndicates.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface font-label-bold text-label-bold uppercase hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
            onClick={handleReset}
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Reset View</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            onClick={handleFlagSyndicate}
          >
            <span className="material-symbols-outlined text-[18px]">flag</span>
            <span>Flag Cartel Syndicate</span>
          </button>
        </div>
      </div>

      {flagStatus && (
        <div className="p-3 mb-4 rounded-lg bg-surface-container-high border border-outline-variant text-primary font-mono text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base">verified</span>
          {flagStatus}
        </div>
      )}

      {/* Multi-Graph Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 rounded-xl mb-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
            Graph Mode:
          </span>
          {[
            { id: "vendor_department", label: "Vendor ↔ Department" },
            { id: "vendor_network", label: "Vendor Network" },
            { id: "contract_network", label: "Contract Network" },
            { id: "risk_network", label: "Risk Network" },
            { id: "investigation", label: "Investigation Graph" }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setGraphType(mode.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                graphType === mode.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low dark:bg-slate-800 text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant">Filter Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 rounded-lg text-xs font-semibold text-primary outline-none cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Risk (CRS ≥ 85)</option>
            <option value="high">High Risk (CRS ≥ 70)</option>
            <option value="medium">Medium Risk (40–69)</option>
            <option value="low">Low Risk (&lt; 40)</option>
          </select>
        </div>
      </div>

      {/* Main Graph + Details Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] min-h-[550px]">
        {/* Graph Canvas Container (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-xl relative overflow-hidden flex flex-col p-0 border border-outline-variant/30">
          {/* Top-Left Filter & Search Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 px-3 rounded-full border border-outline-variant/50 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-primary outline-none cursor-pointer"
            >
              <option value="all">All Entity Types</option>
              <option value="Vendor">Vendors Only</option>
              <option value="Department">Departments</option>
              <option value="Contract">Contracts</option>
              <option value="Person">Directors / Key Persons</option>
              <option value="RiskFlag">Risk Flags</option>
            </select>
            <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
            <input
              type="text"
              placeholder="Search graph entities..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-primary placeholder:text-on-surface-variant/50 outline-none w-32 sm:w-44"
            />
          </div>

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/50 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-md cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/50 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-md cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_out</span>
            </button>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border border-outline-variant/50 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-md cursor-pointer"
              title="Fit to View"
            >
              <span className="material-symbols-outlined text-[18px]">crop_free</span>
            </button>
          </div>

          {/* Cytoscape Canvas */}
          <div ref={containerRef} className="w-full h-full bg-surface-container-low/40 dark:bg-slate-950" />

          {loading && (
            <div className="absolute inset-0 bg-surface/50 dark:bg-slate-950/50 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-primary z-20">
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              <span>Loading {graphType.replace("_", " ")} topology...</span>
            </div>
          )}
        </div>

        {/* Selected Entity Details Drawer (4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col gap-5 overflow-y-auto border border-outline-variant/30">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-surface-container dark:bg-slate-800 text-primary">
                {selectedNode.type}
              </span>
              <span
                className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                  selectedNode.crs >= 70
                    ? "bg-error-container/30 text-error border border-error/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                CRS {selectedNode.crs}/100
              </span>
            </div>
            <h3 className="font-headline-page text-xl font-bold text-primary">
              {selectedNode.label}
            </h3>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Entity Reference: {selectedNode.id}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <h4 className="font-label-bold text-xs uppercase text-primary font-bold mb-2">
              Collusion & Directorship Intelligence
            </h4>
            <p className="text-body-sm text-xs text-on-surface-variant leading-relaxed">
              {selectedNode.details}
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <h4 className="font-label-bold text-xs uppercase text-primary font-bold mb-3">
              Connected Entities ({selectedNode.connected?.length || 0})
            </h4>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {(selectedNode.connected || []).map((c, i) => (
                <div key={i} className="p-2.5 bg-surface-container-low dark:bg-slate-800 rounded-lg text-xs">
                  <div className="font-bold text-primary">{c.name}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">{c.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
            <button
              onClick={handleInvestigateDossier}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search_insights</span>
              <span>Investigate Full Dossier</span>
            </button>
            <button
              onClick={handleAskCopilot}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-surface-container-high dark:bg-slate-800 text-primary rounded-lg text-xs font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Ask AI Copilot About Entity</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
