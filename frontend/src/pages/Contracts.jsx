import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, RefreshCw, Filter } from "lucide-react";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const contractsPerPage = 10;

  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      const mockContracts = Array.from({ length: 50 }, (_, i) => ({
        id: `C${String(i + 1).padStart(3, "0")}`,
        vendor: [
          "TechCorp Solutions",
          "BuildRight Inc",
          "OfficeSupplies Ltd",
          "ConstructionCo",
          "DataSystems LLC",
        ][Math.floor(Math.random() * 5)],
        department: [
          "IT Department",
          "Public Works",
          "Admin Department",
          "Health Services",
          "Education",
        ][Math.floor(Math.random() * 5)],
        value: Math.floor(Math.random() * 2000000) + 50000,
        crs: Math.floor(Math.random() * 100),
        date: `2024-${String(
          Math.floor(Math.random() * 12) + 1
        ).padStart(2, "0")}-${String(
          Math.floor(Math.random() * 28) + 1
        ).padStart(2, "0")}`,
      }));

      setContracts(mockContracts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (a[sortBy] > b[sortBy]) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sortedContracts.length / contractsPerPage)
  );

  const paginatedContracts = sortedContracts.slice(
    (currentPage - 1) * contractsPerPage,
    currentPage * contractsPerPage
  );

  const highRiskCount = filteredContracts.filter(
    (contract) => contract.crs >= 70
  ).length;

  const mediumRiskCount = filteredContracts.filter(
    (contract) => contract.crs >= 40 && contract.crs < 70
  ).length;

  const lowRiskCount = filteredContracts.filter(
    (contract) => contract.crs < 40
  ).length;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setLoading(true);

    setTimeout(() => {
      setContracts((previousContracts) =>
        previousContracts.map((contract) => ({
          ...contract,
          crs: Math.floor(Math.random() * 100),
        }))
      );

      setLoading(false);
    }, 700);
  };

  const getRiskInfo = (crs) => {
    if (crs >= 70) {
      return {
        label: "High Risk",
        className: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };
    }

    if (crs >= 40) {
      return {
        label: "Medium",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Low Risk",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  };

  const getScoreColor = (crs) => {
    if (crs >= 70) return "bg-red-500";
    if (crs >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getInitials = (vendor) => {
    return vendor
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const SortIndicator = ({ column }) => {
    if (sortBy !== column) {
      return (
        <span className="ml-1 text-slate-300">
          ↕
        </span>
      );
    }

    return (
      <span className="ml-1 text-indigo-600">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div
      className="space-y-6"
      style={{
        paddingBottom: "32px",
      }}
    >
      {/* HEADER */}
      <div
        className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              color: "#6366f1",
            }}
          >
            <span>OVERVIEW</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span>CONTRACTS</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 8px 18px rgba(79, 70, 229, 0.22)",
              }}
            >
              <FileText size={21} />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#172033",
                  margin: 0,
                }}
              >
                Contracts
              </h1>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Monitor, search and investigate procurement
                contracts.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outline"
            onClick={() =>
              document
                .getElementById("contract-search")
                ?.focus()
            }
            style={{
              borderRadius: "10px",
              borderColor: "#dbe1f0",
              background: "white",
            }}
          >
            <Search
              className="mr-2 h-4 w-4"
            />
            Search
          </Button>

          <Button
            variant="outline"
            style={{
              borderRadius: "10px",
              borderColor: "#dbe1f0",
              background: "white",
            }}
          >
            <Download
              className="mr-2 h-4 w-4"
            />
            Export
          </Button>

          <Button
            onClick={handleRefresh}
            style={{
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, #4f46e5, #6366f1)",
              boxShadow:
                "0 6px 14px rgba(79, 70, 229, 0.2)",
            }}
          >
            <RefreshCw
              className="mr-2 h-4 w-4"
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <Card
        style={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 6px 20px rgba(30, 41, 59, 0.05)",
          overflow: "hidden",
        }}
      >
        <CardContent style={{ padding: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: "1 1 420px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />

              <input
                id="contract-search"
                type="text"
                placeholder="Search by contract ID, vendor, or department..."
                value={searchTerm}
                onChange={(e) =>
                  handleSearch(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 16px 13px 42px",
                  borderRadius: "10px",
                  border: "1px solid #dbe1f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#818cf8";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dbe1f0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#64748b",
                fontSize: "13px",
                padding: "0 8px",
              }}
            >
              <Filter size={16} />
              <span>
                {searchTerm
                  ? `Showing ${filteredContracts.length} results`
                  : "Search all contracts"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RISK SUMMARY */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, #fff7f7, #ffffff)",
            border: "1px solid #fee2e2",
            borderRadius: "15px",
            padding: "18px",
            boxShadow:
              "0 5px 16px rgba(239, 68, 68, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#991b1b",
                letterSpacing: "0.5px",
              }}
            >
              HIGH RISK
            </span>

            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#b91c1c",
              marginTop: "8px",
            }}
          >
            {highRiskCount}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "3px",
            }}
          >
            CRS score 70 or above
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, #fffbeb, #ffffff)",
            border: "1px solid #fde68a",
            borderRadius: "15px",
            padding: "18px",
            boxShadow:
              "0 5px 16px rgba(245, 158, 11, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#92400e",
                letterSpacing: "0.5px",
              }}
            >
              MEDIUM RISK
            </span>

            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#b45309",
              marginTop: "8px",
            }}
          >
            {mediumRiskCount}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "3px",
            }}
          >
            CRS score 40–69
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, #f0fdf4, #ffffff)",
            border: "1px solid #bbf7d0",
            borderRadius: "15px",
            padding: "18px",
            boxShadow:
              "0 5px 16px rgba(16, 185, 129, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#166534",
                letterSpacing: "0.5px",
              }}
            >
              LOW RISK
            </span>

            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#15803d",
              marginTop: "8px",
            }}
          >
            {lowRiskCount}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "3px",
            }}
          >
            CRS score below 40
          </div>
        </div>
      </div>

      {/* CONTRACT TABLE */}
      <Card
        style={{
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 8px 24px rgba(30, 41, 59, 0.06)",
          overflow: "hidden",
        }}
      >
        <CardHeader
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #eef2f7",
            background:
              "linear-gradient(180deg, #ffffff, #fafbff)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <CardTitle
                style={{
                  fontSize: "18px",
                  fontWeight: "750",
                  color: "#172033",
                }}
              >
                Contract Listings
              </CardTitle>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Procurement contracts and risk assessment
              </p>
            </div>

            <div
              style={{
                padding: "7px 12px",
                borderRadius: "20px",
                background: "#eef2ff",
                color: "#4f46e5",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {filteredContracts.length} Results
            </div>
          </div>
        </CardHeader>

        <CardContent style={{ padding: "0" }}>
          {loading ? (
            <div
              style={{
                padding: "70px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <RefreshCw
                size={28}
                style={{
                  margin: "0 auto 12px",
                  animation: "spin 1s linear infinite",
                }}
              />

              <p
                style={{
                  margin: 0,
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                Loading contracts...
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                }}
              >
                Preparing procurement data
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <Table>
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                      }}
                    >
                      <th
                        onClick={() => handleSort("id")}
                        style={{
                          cursor: "pointer",
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        CONTRACT ID
                        <SortIndicator column="id" />
                      </th>

                      <th
                        onClick={() => handleSort("vendor")}
                        style={{
                          cursor: "pointer",
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        VENDOR
                        <SortIndicator column="vendor" />
                      </th>

                      <th
                        onClick={() =>
                          handleSort("department")
                        }
                        style={{
                          cursor: "pointer",
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        DEPARTMENT
                        <SortIndicator column="department" />
                      </th>

                      <th
                        onClick={() => handleSort("value")}
                        style={{
                          cursor: "pointer",
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        VALUE
                        <SortIndicator column="value" />
                      </th>

                      <th
                        onClick={() => handleSort("crs")}
                        style={{
                          cursor: "pointer",
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        CRS SCORE
                        <SortIndicator column="crs" />
                      </th>

                      <th
                        style={{
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                        }}
                      >
                        DATE
                      </th>

                      <th
                        style={{
                          padding: "14px 18px",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: "750",
                          letterSpacing: "0.6px",
                        }}
                      >
                        ACTION
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedContracts.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            textAlign: "center",
                            padding: "55px 20px",
                            color: "#64748b",
                          }}
                        >
                          <Search
                            size={28}
                            style={{
                              margin: "0 auto 10px",
                              color: "#94a3b8",
                            }}
                          />

                          <div
                            style={{
                              fontWeight: "650",
                              color: "#475569",
                            }}
                          >
                            No contracts found
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            Try a different search term.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedContracts.map((contract) => {
                        const risk = getRiskInfo(
                          contract.crs
                        );

                        return (
                          <tr
                            key={contract.id}
                            style={{
                              transition:
                                "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "#f8faff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "transparent";
                            }}
                          >
                            <td
                              style={{
                                padding: "16px 18px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "750",
                                  color: "#4f46e5",
                                  fontSize: "13px",
                                }}
                              >
                                {contract.id}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    minWidth: "34px",
                                    borderRadius: "9px",
                                    background:
                                      "linear-gradient(135deg, #e0e7ff, #ede9fe)",
                                    color: "#4f46e5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                  }}
                                >
                                  {getInitials(
                                    contract.vendor
                                  )}
                                </div>

                                <div>
                                  <div
                                    style={{
                                      fontWeight: "650",
                                      color: "#1e293b",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {contract.vendor}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#94a3b8",
                                      marginTop: "2px",
                                    }}
                                  >
                                    Vendor
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#475569",
                                  fontSize: "13px",
                                }}
                              >
                                {contract.department}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "700",
                                  color: "#1e293b",
                                  fontSize: "13px",
                                }}
                              >
                                $
                                {contract.value.toLocaleString()}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                                minWidth: "150px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "9px",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: "32px",
                                    fontWeight: "800",
                                    color:
                                      contract.crs >= 70
                                        ? "#dc2626"
                                        : contract.crs >= 40
                                        ? "#d97706"
                                        : "#059669",
                                    fontSize: "13px",
                                  }}
                                >
                                  {contract.crs}
                                </span>

                                <div
                                  style={{
                                    width: "70px",
                                    height: "6px",
                                    borderRadius: "10px",
                                    background: "#e2e8f0",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${contract.crs}%`,
                                      height: "100%",
                                      borderRadius: "10px",
                                    }}
                                    className={getScoreColor(
                                      contract.crs
                                    )}
                                  />
                                </div>
                              </div>
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                                color: "#64748b",
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {contract.date}
                            </td>

                            <td
                              style={{
                                padding: "16px 18px",
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderRadius: "8px",
                                  borderColor: "#dbe1f0",
                                  color: "#4f46e5",
                                  fontSize: "12px",
                                  fontWeight: "650",
                                }}
                              >
                                View Details
                              </Button>
                            </td>

                            <td
                              style={{
                                display: "none",
                              }}
                            >
                              {risk.label}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div
                  style={{
                    padding: "16px 20px",
                    borderTop: "1px solid #eef2f7",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    background: "#fafbff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Showing{" "}
                    <strong style={{ color: "#334155" }}>
                      {(currentPage - 1) *
                        contractsPerPage +
                        1}
                    </strong>{" "}
                    –
                    <strong style={{ color: "#334155" }}>
                      {" "}
                      {Math.min(
                        currentPage * contractsPerPage,
                        sortedContracts.length
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong style={{ color: "#334155" }}>
                      {sortedContracts.length}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.max(1, prev - 1)
                        )
                      }
                      style={{
                        borderRadius: "8px",
                      }}
                    >
                      Previous
                    </Button>

                    <div
                      style={{
                        padding: "7px 11px",
                        borderRadius: "8px",
                        background: "#eef2ff",
                        color: "#4f46e5",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {currentPage} / {totalPages}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            totalPages,
                            prev + 1
                          )
                        )
                      }
                      style={{
                        borderRadius: "8px",
                      }}
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

      {/* SMALL FOOTER NOTE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#94a3b8",
          fontSize: "11px",
          padding: "0 4px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
        Procurement risk monitoring system operational
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}