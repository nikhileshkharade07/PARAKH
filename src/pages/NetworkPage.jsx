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
        nodes.filter(n => (n?.data?.average_crs || 0) >= 70).map(n => n?.data?.id)
      );
      nodes = nodes.filter(n => highRiskNodeIds.has(n?.data?.id));
      edges = edges.filter(e => highRiskNodeIds.has(e?.data?.source) || highRiskNodeIds.has(e?.data?.target));
    }

    const cy = cytoscape({
      container: cyRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node[type="vendor"]',
          style: {
            'background-color': '#38bdf8',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'width': 'mapData(contract_count, 1, 50, 26, 60)',
            'height': 'mapData(contract_count, 1, 50, 26, 60)',
            'border-width': 2,
            'border-color': '#0284c7'
          }
        },
        {
          selector: 'node[type="department"]',
          style: {
            'background-color': '#8b5cf6',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'width': 'mapData(contract_count, 1, 100, 30, 68)',
            'height': 'mapData(contract_count, 1, 100, 30, 68)',
            'shape': 'round-rectangle',
            'border-width': 2,
            'border-color': '#6d28d9'
          }
        },
        {
          selector: 'node[average_crs >= 70]',
          style: {
            'border-color': '#ef4444',
            'border-width': 4
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(contract_count, 1, 20, 1.5, 8)',
            'line-color': '#334155',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        },
        {
          selector: ':selected',
          style: {
            'border-color': '#f59e0b',
            'border-width': 4,
            'line-color': '#f59e0b',
            'opacity': 1
          }
        }
      ],
      layout: {
        name: layoutName,
        animate: false,
        padding: 30,
        nodeOverlap: 20,
        idealEdgeLength: 100
      }
    });

    cy.on('tap', 'node, edge', (evt) => {
      setSelectedElement(evt.target.data());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedElement(null);
      }
    });

    cyInstance.current = cy;

    return () => {
      if (cyInstance.current) cyInstance.current.destroy();
    };
  }, [networkData, layoutName, highRiskOnly]);

  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!cyInstance.current || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const found = cyInstance.current.nodes().filter(n => n.data('label').toLowerCase().includes(q));
    if (found.length > 0) {
      cyInstance.current.nodes().unselect();
      found.select();
      cyInstance.current.animate({
        center: { eles: found },
        zoom: 1.4,
        duration: 500
      });
      setSelectedElement(found[0].data());
    }
  };

  const handleFit = () => {
    if (cyInstance.current) {
      cyInstance.current.fit(undefined, 30);
    }
  };

  const handleZoom = (factor) => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * factor);
    }
  };

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">GRAPH NETWORK ANALYSIS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Vendor ↔ Department Network</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Visualizing systemic collusion indicators, vendor dominance, and recurring award relationships between vendors (blue circles) and departments (purple squares).
        </p>
      </div>

      {/* Graph Control Bar */}
      <div className="card" style={{ marginBottom: 16, padding: "14px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <form onSubmit={handleSearchNode} style={{ display: "flex", gap: 8, flex: 1, minWidth: 260, maxWidth: 400 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search vendor or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px 12px", fontSize: 13 }}
            />
            <button type="submit" className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 13 }}>
              Find
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>Layout:</span>
              <select
                className="select-field"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                style={{ padding: "6px 12px", fontSize: 13 }}
              >
                <option value="cose">Force-Directed (COSE)</option>
                <option value="concentric">Concentric Circles</option>
                <option value="circle">Circular</option>
                <option value="grid">Grid Matrix</option>
              </select>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={highRiskOnly}
                onChange={(e) => setHighRiskOnly(e.target.checked)}
              />
              <span>High Risk Only (CRS ≥ 70)</span>
            </label>

            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn btn-outline" onClick={() => handleZoom(1.25)} style={{ padding: "6px 10px" }} title="Zoom In">+</button>
              <button className="btn btn-outline" onClick={() => handleZoom(0.8)} style={{ padding: "6px 10px" }} title="Zoom Out">-</button>
              <button className="btn btn-outline" onClick={handleFit} style={{ padding: "6px 12px", fontSize: 13 }}>Fit View</button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Constructing interactive network graph...</div>
      ) : (
        <div className="cytoscape-wrapper">
          <div ref={cyRef} id="cy" />

          <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(17, 24, 39, 0.9)", padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 12, display: "flex", gap: 16, zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#38bdf8" }} />
              <span>Vendors</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, background: "#8b5cf6", borderRadius: 2 }} />
              <span>Departments</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #ef4444", background: "transparent" }} />
              <span>High Risk (CRS ≥ 70)</span>
            </div>
          </div>

          {selectedElement && (
            <div className="network-drawer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="eyebrow" style={{ margin: 0 }}>
                  {selectedElement.type ? selectedElement.type.toUpperCase() : "RELATIONSHIP EDGE"}
                </span>
                <button onClick={() => setSelectedElement(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{selectedElement.label || "Contract Award Relationship"}</h3>

              <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Total Contracts:</span> <strong>{selectedElement.contract_count}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Total Award Value:</span> <strong className="font-mono">{formatINR(selectedElement.total_value)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Average Risk Score:</span>{" "}
                  <span className={`risk-badge ${selectedElement.average_crs >= 70 ? "high" : selectedElement.average_crs >= 40 ? "medium" : "low"}`}>
                    CRS {selectedElement.average_crs?.toFixed(1)}
                  </span>
                </div>

                {selectedElement.type === "vendor" && (
                  <Link to={`/vendors/${selectedElement.raw_id || selectedElement.id?.replace(/^(vendor-|v_)/, '')}`} className="btn btn-primary" style={{ marginTop: 12, textAlign: "center", justifyContent: "center" }}>
                    View Vendor Profile →
                  </Link>
                )}

                {selectedElement.type === "department" && (
                  <Link to={`/departments/${selectedElement.raw_id || selectedElement.id?.replace(/^(department-|d_)/, '')}`} className="btn btn-primary" style={{ marginTop: 12, textAlign: "center", justifyContent: "center" }}>
                    View Department Profile →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
