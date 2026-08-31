import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalContracts: 0,
    highRiskContracts: 0,
    avgCRS: 0,
    totalVendors: 0,
  });
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [recentContracts, setRecentContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard stats from API
        const statsResponse = await api.get("/dashboard/stats");
        setStats(statsResponse.data);

        // Fetch risk distribution from API
        const riskResponse = await api.get("/dashboard/risk-distribution");
        setRiskDistribution(riskResponse.data);

        // Fetch recent contracts from API
        const recentResponse = await api.get("/dashboard/recent-contracts");
        setRecentContracts(recentResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to mock data on error
        setStats({
          totalContracts: 2450,
          highRiskContracts: 342,
          avgCRS: 45.6,
          totalVendors: 890,
        });

        setRiskDistribution([
          { name: "Low (0-30)", value: 850 },
          { name: "Medium (31-70)", value: 1258 },
          { name: "High (71-100)", value: 342 },
        ]);

        setRecentContracts([
          {
            id: "C001",
            vendor: "TechCorp Solutions",
            department: "IT Department",
            value: 750000,
            crs: 85,
            date: "2024-01-15",
          },
          {
            id: "C002",
            vendor: "BuildRight Inc",
            department: "Public Works",
            value: 1200000,
            crs: 78,
            date: "2024-01-10",
          },
          {
            id: "C003",
            vendor: "OfficeSupplies Ltd",
            department: "Admin Department",
            value: 45000,
            crs: 62,
            date: "2024-01-05",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Procurement Risk Dashboard</h1>
          <div className="flex space-x-3">
            <Button variant="outline">Export</Button>
            <Button>Refresh</Button>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Procurement Risk Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline">Export</Button>
          <Button>Refresh</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.totalContracts.toLocaleString()}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Risk Contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-destructive">
            {stats.highRiskContracts.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. CRS Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.avgCRS}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vendors
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.totalVendors.toLocaleString()}</CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Recent High-Risk Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Vendor</th>
                  <th>Department</th>
                  <th>Value</th>
                  <th>CRS</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.id}</td>
                    <td>{contract.vendor}</td>
                    <td>{contract.department}</td>
                    <td>${contract.value.toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contract.crs >= 70
                          ? "bg-destructive/20 text-destructive"
                          : contract.crs >= 40
                          ? "bg-warning/20 text-warning"
                          : "bg-secondary/20 text-secondary"
                      }`}>
                        {contract.crs}
                      </span>
                    </td>
                    <td>{contract.date}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section (Placeholder for future implementation) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Risk Level
              </label>
              <select className="w-full border rounded px-2 py-1">
                <option>All</option>
                <option>High (70+)</option>
                <option>Medium (40-69)</option>
                <option>Low {'<'} 40</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Department
              </label>
              <select className="w-full border rounded px-2 py-1">
                <option>All Departments</option>
                <option>IT</option>
                <option>Public Works</option>
                <option>Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Date Range
              </label>
              <select className="w-full border rounded px-2 py-1">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last year</option>
                <option>Custom</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
