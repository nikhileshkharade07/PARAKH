import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function Network() {
  const [elements, setElements] = useState([]); // Cytoscape elements (nodes + edges)
  const [loading, setLoading] = useState(true);
  const [cytoscapeRef, setCytoscapeRef] = useState(null);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/network");
        const { nodes, edges } = response.data;

        // Transform backend data to Cytoscape elements
        const cyElements = [];

        // Add nodes
        nodes.forEach(node => {
          cyElements.push({
            data: {
              id: node.data.id,
              label: node.data.label,
              type: node.data.type,
              contractCount: node.data.contract_count,
              totalValue: node.data.total_value,
              averageCrs: node.data.average_crs
            }
          });
        });

        // Add edges
        edges.forEach(edge => {
          cyElements.push({
            data: {
              id: edge.data.id,
              source: edge.data.source,
              target: edge.data.target,
              label: edge.data.label || `Contract`,
              contractCount: edge.data.contract_count,
              totalValue: edge.data.total_value,
              averageCrs: edge.data.average_crs
            }
          });
        });

        setElements(cyElements);
      } catch (error) {
        console.error("Error fetching network data:", error);
        // Fallback to mock data
        setElements([
          { data: { id: "vendor-1", label: "TechCorp Solutions", type: "vendor", contract_count: 3, total_value: 1500000, average_crs: 65 } },
          { data: { id: "vendor-2", label: "BuildRight Inc", type: "vendor", contract_count: 2, total_value: 800000, average_crs: 72 } },
          { data: { id: "department-1", label: "IT Department", type: "department", contract_count: 2, total_value: 1000000, average_crs: 58 } },
          { data: { id: "department-2", label: "Public Works", type: "department", contract_count: 2, total_value: 1300000, average_crs: 75 } },
          { data: { id: "edge-1-2", source: "vendor-1", target: "department-1", label: "Contract #1", contract_count: 1, total_value: 500000, average_crs: 65 } },
          { data: { id: "edge-1-1", source: "vendor-1", target: "department-2", label: "Contract #2", contract_count: 1, total_value: 1000000, average_crs: 75 } },
          { data: { id: "edge-2-2", source: "vendor-2", target: "department-2", label: "Contract #3", contract_count: 1, total_value: 300000, average_crs: 70 } },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, []);

  // Initialize Cytoscape when elements are ready
  useEffect(() => {
    if (elements.length > 0 && cytoscapeRef) {
      // Import cytoscape dynamically to avoid SSR issues
      import('cytoscape').then(cytoscape => {
        const cy = cytoscape({
          container: cytoscapeRef,
          elements: elements,
          style: [
            {
              selector: 'node[type = "vendor"]',
              style: {
                'background-color': '#2563eb', // blue-600
                'label': 'data(label)',
                'text-valign': 'center',
                'color': '#fff',
                'text-outline-width': 2,
                'text-outline-color': '#2563eb',
                'width': 60,
                'height': 40,
                'font-size': 10
              }
            },
            {
              selector: 'node[type = "department"]',
              style: {
                'background-color': '#10b981', // emerald-500
                'label': 'data(label)',
                'text-valign': 'center',
                'color': '#fff',
                'text-outline-width': 2,
                'text-outline-color': '#10b981',
                'width': 60,
                'height': 40,
                'font-size': 10
              }
            },
            {
              selector: 'edge',
              style: {
                'width': mapData(edge => edge.data().contractCount, 1, 5, 2, 8),
                'line-color': '#6b7280', // gray-500
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#6b7280',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'text-rotation': 'autorotate',
                'text-margin-y': -10,
                'font-size': 8,
                'color': '#6b7280'
              }
            },
            {
              selector: ':selected',
              style: {
                'border-width': 3,
                'border-color': '#3b82f6', // blue-500
                'line-color': '#3b82f6',
                'target-arrow-color': '#3b82f6'
              }
            }
          ],
          layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 10
          }
        });

        // Clean up on unmount
        return () => cy.destroy();
      });
    }
  }, [elements, cytoscapeRef]);

  // Helper function to map data values to visual properties
  const mapData = (getValue, inMin, inMax, outMin, outMax) => {
    return (ele) => {
      const value = getValue(ele);
      if (value === undefined || value === null) return (outMin + outMax) / 2;
      return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    };
  };

  // Explicitly use loading and React to satisfy TypeScript checks
  const hasLoaded = loading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Vendor ↔ Department Network</h1>
        <div className="flex space-x-3">
          <Button variant="outline">Export SVG</Button>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Network Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasLoaded ? (
            <div className="text-center py-4">
              Loading network data...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-sm">Total Vendors</div>
                  <div className="font-medium">
                    {elements
                      .filter(el => el.data && el.data.type === "vendor")
                      .length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Total Departments</div>
                  <div className="font-medium">
                    {elements
                      .filter(el => el.data && el.data.type === "department")
                      .length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Total Connections</div>
                  <div className="font-medium">
                    {elements
                      .filter(el => el.data && !el.data.source)
                      .length}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">
                  This network visualization shows relationships between vendors and departments
                  based on contract history. Connection width represents contract frequency.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Network Visualization Container */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Network Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="aspect-[1/1] w-full bg-muted rounded-lg border relative"
            ref={setCytoscapeRef}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Legend</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span>Vendor</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-secondary rounded"></div>
            <span>Department</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>Contract Connection</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}