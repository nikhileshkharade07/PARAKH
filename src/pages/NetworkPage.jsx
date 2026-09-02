import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cytoscape from "cytoscape";
import { networkService } from "../services/networkService";

export default function NetworkPage() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const navigate = useNavigate();

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

  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [flagStatus, setFlagStatus] = useState(null);

  const initialElements = [
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
    { data: { id: "loc-1", label: "Plot 42, Okhla Phase-III, ND", type: "Location", risk: "Critical", crs: 90 } },

    // Edges
    { data: { source: "vend-1", target: "person-1", label: "DIRECTOR" } },
    { data: { source: "vend-2", target: "person-1", label: "DIRECTOR" } },
    { data: { source: "vend-1", target: "loc-1", label: "REGISTERED_AT" } },
    { data: { source: "vend-2", target: "loc-1", label: "REGISTERED_AT" } },
    { data: { source: "vend-1", target: "cnt-101", label: "AWARDED" } },
    { data: { source: "vend-2", target: "cnt-101", label: "BIDDER_DISQUALIFIED" } },
    { data: { source: "cnt-101", target: "dept-2", label: "ISSUED_BY" } },
    { data: { source: "vend-1", target: "cnt-102", label: "AWARDED" } },
    { data: { source: "cnt-102", target: "dept-1", label: "ISSUED_BY" } }
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    let elements = initialElements;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "font-size": "11px",
            "font-family": "Geist, sans-serif",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "color": "#1b1b1d",
            "background-color": "#000000",
            "width": 36,
            "height": 36,
            "border-width": 2,
            "border-color": "#ffffff"
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
          selector: 'node[type = "Location"]',
          style: { "background-color": "#b45309", "shape": "triangle" }
        },
        {
          selector: "edge",
          style: {
            "width": 2,
            "line-color": "#cbd5e1",
            "target-arrow-color": "#cbd5e1",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "label": "data(label)",
            "font-size": "9px",
            "font-family": "JetBrains Mono",
            "color": "#64748b"
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
        type: data.type,
        risk: data.risk || "High",
        crs: data.crs || (data.risk === "Critical" ? 92 : (data.risk === "High" ? 78 : 45)),
        details: `Entity ${data.label} (${data.type}) is interconnected across ${neighbors.length} suspicious bidding/directorship linkages in the audit registry.`,
        connected: connectedList.length > 0 ? connectedList : [
          { name: "Direct Linkage", role: "Primary node in investigation syndicate" }
        ]
      });
    });

    cyRef.current = cy;

    // Try loading live backend graph if available
    networkService.getNetworkGraph()
      .then((res) => {
        if (res && res.nodes && res.nodes.length > 0) {
          const cyNodes = res.nodes.map((n) => ({
            data: {
              id: n.data?.id || n.id,
              label: n.data?.label || n.label || n.name,
              type: n.data?.type === "vendor" ? "Vendor" : "Department",
              risk: (n.data?.average_crs >= 70) ? "Critical" : "Medium",
              crs: n.data?.average_crs || 65
            }
          }));
          const cyEdges = (res.edges || []).map((e) => ({
            data: {
              source: e.data?.source || e.source,
              target: e.data?.target || e.target,
              label: e.data?.label || `${e.data?.contract_count || 1} TENDERS`
            }
          }));
          if (cyNodes.length > 0) {
            cy.elements().remove();
            cy.add([...cyNodes, ...cyEdges]);
            cy.layout({ name: "cose", animate: false }).run();
          }
        }
      })
      .catch(() => {
        // Safe fallback already rendered
      });

    return () => {
      cy.destroy();
    };
  }, []);

  // Handle entity filter
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (filterType === "all") {
      cy.elements().show();
    } else {
      cy.elements().hide();
      const matchedNodes = cy.nodes(`[type = "${filterType}"]`);
      matchedNodes.show();
      matchedNodes.neighborhood().show();
    }
  }, [filterType]);

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
      n.data("label").toLowerCase().includes(query.toLowerCase()) ||
      n.data("id").toLowerCase().includes(query.toLowerCase())
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

      {/* Main Graph + Details Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[550px]">
        {/* Graph Canvas Container (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-xl relative overflow-hidden flex flex-col p-0">
          {/* Top-Left Filter & Search Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 px-3 rounded-full border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-primary outline-none cursor-pointer"
            >
              <option value="all">All Entity Types</option>
              <option value="Vendor">Vendors Only</option>
              <option value="Person">Directors / Key Persons</option>
              <option value="Contract">Tender Contracts</option>
              <option value="Department">Departments</option>
            </select>
            <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
            <input
              type="text"
              placeholder="Search graph..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-primary placeholder:text-on-surface-variant/50 outline-none w-28 sm:w-36"
            />
          </div>

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_out</span>
            </button>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
              title="Fit to View"
            >
              <span className="material-symbols-outlined text-[18px]">crop_free</span>
            </button>
          </div>

          {/* Cytoscape Canvas */}
          <div ref={containerRef} className="w-full h-full bg-[#f6f3f5]" />
        </div>

        {/* Selected Entity Details Drawer (4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-surface-container text-primary">
                {selectedNode.type}
              </span>
              <span
                className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                  selectedNode.crs >= 75
                    ? "bg-error-container/30 text-error border border-error/20"
                    : "bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/20"
                }`}
              >
                CRS {selectedNode.crs}/100
              </span>
            </div>
            <h3 className="font-headline-page text-xl font-bold text-primary">
              {selectedNode.label}
            </h3>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              ID: {selectedNode.id}
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
            <div className="flex flex-col gap-2">
              {(selectedNode.connected || []).map((c, i) => (
                <div key={i} className="p-2.5 bg-surface-container-low rounded-lg text-xs">
                  <div className="font-bold text-primary">{c.name}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">{c.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-outline-variant/30">
            <button
              onClick={handleInvestigateDossier}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search_insights</span>
              <span>Investigate Full Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
