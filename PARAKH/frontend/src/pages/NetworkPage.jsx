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

    const cy = cytoscape({
      container: cyRef.current,
      elements: [...networkData.nodes, ...networkData.edges],
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
            'width': 'mapData(contract_count, 1, 50, 24, 56)',
            'height': 'mapData(contract_count, 1, 50, 24, 56)',
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
            'width': 'mapData(contract_count, 1, 100, 28, 64)',
            'height': 'mapData(contract_count, 1, 100, 28, 64)',
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
        name: 'cose',
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
  }, [networkData]);

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
                  <Link to={`/vendors/${selectedElement.id.replace("vendor-", "")}`} className="btn btn-primary" style={{ marginTop: 12, textAlign: "center", justifyContent: "center" }}>
                    View Vendor Profile →
                  </Link>
                )}

                {selectedElement.type === "department" && (
                  <Link to={`/departments/${selectedElement.id.replace("department-", "")}`} className="btn btn-primary" style={{ marginTop: 12, textAlign: "center", justifyContent: "center" }}>
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
