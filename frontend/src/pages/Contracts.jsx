import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 10;

  useEffect(() => {
    // Mock data - in real app, fetch from /api/contracts
    setLoading(true);
    setTimeout(() => {
      const mockContracts = Array.from({ length: 50 }, (_, i) => ({
        id: `C${String(i + 1).padStart(3, "0")}`,
        vendor: [`TechCorp Solutions`, `BuildRight Inc`, `OfficeSupplies Ltd`, `ConstructionCo`, `DataSystems LLC`][
          Math.floor(Math.random() * 5)
        ],
        department: [`IT Department`, `Public Works`, `Admin Department`, `Health Services`, `Education`][
          Math.floor(Math.random() * 5)
        ],
        value: Math.floor(Math.random() * 2000000) + 50000,
        crs: Math.floor(Math.random() * 100),
        date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(
          Math.floor(Math.random() * 28) + 1
        ).padStart(2, "0")}`,
      }));
      setContracts(mockContracts);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter contracts based on search term
  const filteredContracts = contracts.filter(
    (contract) =>
      contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort contracts
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate contracts
  const totalPages = Math.max(1, Math.ceil(sortedContracts.length / contractsPerPage));
  const paginatedContracts = sortedContracts.slice(
    (currentPage - 1) * contractsPerPage,
    currentPage * contractsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contracts</h1>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button>Export</Button>
          <Button>Refresh</Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search contracts by ID, vendor, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xl px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div>Total Contracts: {contracts.length}</div>
        <div>Filtered: {filteredContracts.length}</div>
        <div>High Risk (CRS ≥ 70): {filteredContracts.filter((c) => c.crs >= 70).length}</div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Contract Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading contracts...</p>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <th onClick={() => setSortBy("id")}>
                      Contract ID
                      {sortBy === "id" && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th onClick={() => setSortBy("vendor")}>
                      Vendor
                      {sortBy === "vendor" && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th onClick={() => setSortBy("department")}>
                      Department
                      {sortBy === "department" && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th onClick={() => setSortBy("value")}>
                      Value
                      {sortBy === "value" && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th onClick={() => setSortBy("crs")}>
                      CRS Score
                      {sortBy === "crs" && (
                        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No contracts found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedContracts.map((contract) => (
                      <tr key={contract.id}>
                        <td>{contract.id}</td>
                        <td>{contract.vendor}</td>
                        <td>{contract.department}</td>
                        <td>{"$"}{contract.value.toLocaleString()}</td>
                        <td>
                          <span className={
                            "px-2 py-1 text-xs rounded-full " + (
                              contract.crs >= 70
                                ? "bg-destructive/20 text-destructive"
                                : contract.crs >= 40
                                ? "bg-warning/20 text-warning"
                                : "bg-secondary/20 text-secondary"
                            )
                          }>
                            {contract.crs}
                          </span>
                        </td>
                        <td>{contract.date}</td>
                        <td>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}