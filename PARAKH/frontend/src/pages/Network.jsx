import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Network() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from /api/network
    setLoading(true);
    setTimeout(() => {
      // Generate mock network data
      const mockNodes = [];
      const mockEdges = [];

      // Create some vendor nodes
      const vendors = [
        { id: "V1", label: "TechCorp Solutions", type: "vendor" },
        { id: "V2", label: "BuildRight Inc", type: "vendor" },
        { id: "V3", label: "OfficeSupplies Ltd", type: "vendor" },
        { id: "V4", label: "ConstructionCo", type: "vendor" },
        { id: "V5", label: "DataSystems LLC", type: "vendor" },
      ];

      // Create some department nodes
      const departments = [
        { id: "D1", label: "IT Department", type: "department" },
        { id: "D2", label: "Public Works", type: "department" },
        { id: "D3", label: "Admin Department", type: "department" },
        { id: "D4", label: "Health Services", type: "department" },
        { id: "D5", label: "Education", type: "department" },
      ];

      mockNodes.push(...vendors, ...departments);

      // Create edges between vendors and departments (representing contracts)
      vendors.forEach((vendor) => {
        // Each vendor connects to 2-3 random departments
        const numConnections = Math.floor(Math.random() * 2) + 2;
        const connectedDepts = departments
          .sort(() => 0.5 - Math.random())
          .slice(0, numConnections);

        connectedDepts.forEach((dept) => {
          mockEdges.push({
            id: `${vendor.id}-${dept.id}`,
            source: vendor.id,
            target: dept.id,
            label: `Contract #${Math.floor(Math.random() * 1000)}`,
          });
        });
      });

      setNodes(mockNodes);
      setEdges(mockEdges);
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Vendor ↔ Department Network</h1>
        <div className="flex space-x-3">
          <Button variant="outline">Export SVG</Button>
          <Button>Refresh</Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Network Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-sm">Total Vendors</div>
              <div className="font-medium">{nodes.filter(n => n.type === "vendor").length}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Total Departments</div>
              <div className="font-medium">{nodes.filter(n => n.type === "department").length}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Total Connections</div>
              <div className="font-medium">{edges.length}</div>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">
              This network visualization shows relationships between vendors and departments
              based on contract history. Stronger connections indicate more frequent contracting.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Network Visualization Container */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Network Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[1/1] w-full bg-muted rounded-lg border relative">
            {/* This would be where we render the Cytoscape.js network */}
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Network visualization will appear here
              <br />
              <span className="text-xs">(Person 4: connect /api/network to Cytoscape.js)</span>
            </div>
          </div>
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