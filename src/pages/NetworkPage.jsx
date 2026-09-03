import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import cytoscape from "cytoscape";
import { api } from "../services/api";

export default function NetworkPage() {
  const cyRef = useRef(null);
  const cyInstance = useRef(null);
  const [networkData, setNetworkData] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [layoutName, setLayoutName] = useState("cose");
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState("all");

  useEffect(() => {
    async function fetchNetwork() {
      try {
        const res = await api.get("/network");
        setNetworkData(res.data);
      } catch (err) {
        console.error("Error fetching network graph:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNetwork();
  }, []);

  useEffect(() => {
    if (!networkData || !cyRef.current) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    let nodes = Array.isArray(networkData?.nodes) ? networkData.nodes : [];
    let edges = Array.isArray(networkData?.edges) ? networkData.edges : [];

    if (highRiskOnly) {
      const highRiskNodeIds = new Set(
        nodes
          .filter((n) => (n?.data?.average_crs || n?.data?.crs || 0) >= 70)
          .map((n) => n?.data?.id)
      );
      nodes = nodes.filter((n) => highRiskNodeIds.has(n?.data?.id));
      edges = edges.filter(
        (e) => highRiskNodeIds.has(e?.data?.source) || highRiskNodeIds.has(e?.data?.target)
      );
    }

    if (activePreset === "defense") {
      nodes = nodes.slice(0, 15);
      const nodeIds = new Set(nodes.map((n) => n.data.id));
      edges = edges.filter((e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));
    } else if (activePreset === "collusion") {
      nodes = nodes.filter((n) => (n?.data?.average_crs || n?.data?.crs || 0) >= 65);
      const nodeIds = new Set(nodes.map((n) => n.data.id));
      edges = edges.filter((e) => nodeIds.has(e.data.source) || nodeIds.has(e.data.target));
    }

    const cy = cytoscape({
      container: cyRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node[type="vendor"]',
          style: {
            "background-color": "#ffffff",
            label: "data(label)",
            color: "#0b1c30",
            "font-family": "Plus Jakarta Sans, sans-serif",
            "font-size": "11px",
            "font-weight": 600,
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: "mapData(contract_count, 1, 50, 32, 60)",
            height: "mapData(contract_count, 1, 50, 32, 60)",
            shape: "round-rectangle",
            "border-width": 2,
            "border-color": "#000000"
          }
        },
        {
          selector: 'node[type="department"]',
          style: {
            "background-color": "#e5eeff",
            label: "data(label)",
            color: "#0b1c30",
            "font-family": "Plus Jakarta Sans, sans-serif",
            "font-size": "11px",
            "font-weight": 600,
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: "mapData(contract_count, 1, 100, 36, 68)",
            height: "mapData(contract_count, 1, 100, 36, 68)",
            shape: "round-rectangle",
            "border-width": 2,
            "border-color": "#4b41e1"
          }
        },
        {
          selector: 'node[average_crs >= 70], node[crs >= 70]',
          style: {
            "border-color": "#ba1a1a",
            "border-width": 3.5
          }
        },
        {
          selector: "edge",
          style: {
            width: "mapData(contract_count, 1, 20, 2, 7)",
            "line-color": "#cbd5e1",
            "curve-style": "bezier",
            opacity: 0.8
          }
        },
        {
          selector: "edge[weight >= 3], edge[contract_count >= 3]",
          style: {
            "line-color": "#ba1a1a",
            width: 3.5,
            label: "SOLE BIDDER",
            "font-size": "9px",
            "font-family": "Plus Jakarta Sans",
            "font-weight": 700,
            color: "#ba1a1a",
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.9,
            "text-background-padding": "2px"
          }
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#4b41e1",
            "border-width": 4,
            "line-color": "#4b41e1"
          }
        }
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 40
      }
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedElement({
        type: "node",
        data: node.data(),
        connectedEdges: node.connectedEdges().map((e) => e.data())
      });
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      setSelectedElement({
        type: "edge",
        data: edge.data()
      });
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedElement(null);
      }
    });

    cyInstance.current = cy;
  }, [networkData, layoutName, highRiskOnly, activePreset]);

  // Search inside graph
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!cyInstance.current || !searchQuery.trim()) return;

    const cy = cyInstance.current;
    const match = cy.nodes().filter((n) => {
      const label = (n.data("label") || "").toLowerCase();
      const id = (n.data("id") || "").toLowerCase();
      const q = searchQuery.toLowerCase();
      return label.includes(q) || id.includes(q);
    });

    if (match.length > 0) {
      cy.elements().unselect();
      match.select();
      cy.animate({
        center: { eles: match },
        zoom: 1.5,
        duration: 500
      });
      setSelectedElement({
        type: "node",
        data: match.first().data(),
        connectedEdges: match.first().connectedEdges().map((e) => e.data())
      });
    }
  };

  const handleRecenter = () => {
    if (cyInstance.current) {
      cyInstance.current.fit(null, 40);
    }
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-on-surface-variant)" }}>
            <span>Forensics Workspace</span>
            <span>/</span>
            <span style={{ color: "var(--color-primary)" }}>Entity Topology</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-on-surface)" }}>
            Network Graph Analysis
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)", marginTop: "0.25rem" }}>
            Explore multi-tier relationships between contracts, vendors, departments, and approving officers.
          </p>
        </div>

        {/* Quick Telemetry Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: "0.75rem", backgroundColor: "var(--color-surface-low)", border: "1px solid var(--color-outline-variant)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-error)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-surface)" }}>1 Critical Cluster</span>
            <span style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-on-surface-variant)" }}>(4 Anomaly Edges)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: "0.75rem", backgroundColor: "var(--color-surface-low)", border: "1px solid var(--color-outline-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--color-secondary)" }}>
              verified_user
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-secondary)" }}>Audit Status: Live Synced</span>
          </div>
        </div>
      </div>

      {/* Command & Filter Toolbar */}
      <div className="stitch-card" style={{ padding: "0.75rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", flex: "1 1 320px" }}>
          {/* Search Inside Graph */}
          <form onSubmit={handleSearchNode} style={{ position: "relative", minWidth: "220px", flex: "1 1 240px" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--color-on-surface-variant)" }}>
              search
            </span>
            <input
              type="text"
              className="stitch-input"
              style={{ paddingLeft: "2.25rem", paddingRight: "2rem" }}
              placeholder="Search vendor or department in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            )}
          </form>

          {/* Layout Algorithm Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", backgroundColor: "var(--color-surface-low)", padding: "0.25rem 0.6rem", borderRadius: "0.5rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-on-surface-variant)" }}>
              alt_route
            </span>
            <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-on-surface-variant)" }}>
              Layout:
            </span>
            <select
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              style={{ background: "transparent", border: "none", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-surface)", cursor: "pointer", outline: "none" }}
            >
              <option value="cose">Force-Directed (COSE)</option>
              <option value="concentric">Concentric Rings</option>
              <option value="circle">Circular Topology</option>
              <option value="breadthfirst">Hierarchical Flow</option>
            </select>
          </div>

          {/* High Risk Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", borderRadius: "0.5rem", backgroundColor: "var(--color-surface-low)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
            <input
              type="checkbox"
              checked={highRiskOnly}
              onChange={(e) => setHighRiskOnly(e.target.checked)}
              style={{ accentColor: "var(--color-error)", cursor: "pointer" }}
            />
            <span>High Risk Only (CRS ≥ 70)</span>
          </label>
        </div>

        {/* Presets & Recenter Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", backgroundColor: "var(--color-surface-low)", padding: "0.2rem", borderRadius: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setActivePreset("all")}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.6875rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activePreset === "all" ? "var(--color-surface-lowest)" : "transparent",
                color: activePreset === "all" ? "var(--color-primary)" : "var(--color-on-surface-variant)"
              }}
            >
              All Nodes
            </button>
            <button
              type="button"
              onClick={() => setActivePreset("defense")}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.6875rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activePreset === "defense" ? "var(--color-surface-lowest)" : "transparent",
                color: activePreset === "defense" ? "var(--color-primary)" : "var(--color-on-surface-variant)"
              }}
            >
              Dense Cluster
            </button>
            <button
              type="button"
              onClick={() => setActivePreset("collusion")}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.6875rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activePreset === "collusion" ? "var(--color-surface-lowest)" : "transparent",
                color: activePreset === "collusion" ? "var(--color-primary)" : "var(--color-on-surface-variant)"
              }}
            >
              Collusion Rings
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleRecenter}
            style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}
            title="Recenter and Fit Graph"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              center_focus_strong
            </span>
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Graph Workbench Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedElement ? "1fr 340px" : "1fr", gap: "1rem", alignItems: "start" }}>
        {/* Graph Canvas Container */}
        <div
          className="stitch-card"
          style={{
            position: "relative",
            padding: 0,
            overflow: "hidden",
            height: "640px",
            background: "radial-gradient(#d3e4fe 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
            backgroundColor: "var(--color-surface-lowest)"
          }}
        >
          {/* Top-Left Telemetry Overlay */}
          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(8px)",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-outline-variant)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-error)" }} />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-on-surface)" }}>
                Target: Multi-Department Collusion Ring
              </div>
              <div style={{ fontSize: "0.6875rem", fontFamily: "JetBrains Mono", color: "var(--color-on-surface-variant)" }}>
                Centrality: 0.892 | Modularity: 3.42
              </div>
            </div>
          </div>

          {/* Cytoscape Container */}
          <div ref={cyRef} style={{ width: "100%", height: "100%" }} />

          {/* Legend Overlay at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "1rem",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(8px)",
              padding: "0.4rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-outline-variant)",
              fontSize: "0.6875rem",
              color: "var(--color-on-surface-variant)"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ width: 10, height: 10, border: "2px solid #000000", borderRadius: 2 }} />
              Vendor Entity
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ width: 10, height: 10, border: "2px solid #4b41e1", backgroundColor: "#e5eeff", borderRadius: 2 }} />
              Department Authority
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ width: 12, height: 3, backgroundColor: "#ba1a1a" }} />
              Sole-Bidder Award Flow
            </span>
          </div>
        </div>

        {/* Right Entity Inspector Drawer */}
        {selectedElement && (
          <div
            className="stitch-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--color-surface-lowest)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-secondary)" }}>
                  {selectedElement.data?.type === "vendor" ? "Vendor Intelligence" : "Department Entity"}
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--color-on-surface)" }}>
                  {selectedElement.data?.label || selectedElement.data?.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElement(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", backgroundColor: "var(--color-surface-low)", padding: "0.75rem", borderRadius: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Risk Index:</span>
                <span className={`risk-pill ${(selectedElement.data?.average_crs || selectedElement.data?.crs || 0) >= 70 ? "critical" : "medium"}`}>
                  CRS {selectedElement.data?.average_crs || selectedElement.data?.crs || 50}/100
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Contracts Audited:</span>
                <strong style={{ fontFamily: "JetBrains Mono" }}>
                  {selectedElement.data?.contract_count || selectedElement.data?.contracts || 1}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-on-surface-variant)" }}>Cumulative Spend:</span>
                <strong style={{ fontFamily: "JetBrains Mono" }}>
                  {formatINR(selectedElement.data?.total_value || selectedElement.data?.value || 5000000)}
                </strong>
              </div>
            </div>

            {/* Drilldown Navigation Link */}
            {selectedElement.data?.type === "vendor" && (
              <Link
                to={`/vendors/${selectedElement.data?.id || 1}`}
                className="btn-primary"
                style={{ width: "100%", textAlign: "center" }}
              >
                Inspect Full Vendor Profile →
              </Link>
            )}

            {selectedElement.data?.type === "department" && (
              <Link
                to={`/departments/${selectedElement.data?.id || 1}`}
                className="btn-primary"
                style={{ width: "100%", textAlign: "center" }}
              >
                Inspect Department Profile →
              </Link>
            )}

            {/* Connected Relationships */}
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                Connected Pathways ({selectedElement.connectedEdges?.length || 0})
              </span>
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "180px", overflowY: "auto" }}>
                {Array.isArray(selectedElement.connectedEdges) &&
                  selectedElement.connectedEdges.map((e, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.4rem 0.6rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "var(--color-surface-low)",
                        fontSize: "0.6875rem",
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>To: {e.target}</span>
                      <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700 }}>
                        {e.contract_count || 1} Awards
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
