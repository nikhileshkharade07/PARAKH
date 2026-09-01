import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ContractsPage from "./ContractsPage";
import { api } from "../services/api";

vi.mock("../services/api");

const mockDepartments = [
  { id: 1, name: "Public Works Department" },
  { id: 2, name: "Health Services Directorate" }
];

const mockVendors = [
  { id: 1, name: "Apex Systems India" },
  { id: 2, name: "Bharat Infrastructure Works" }
];

const mockContracts = [
  {
    id: 1,
    contract_number: "GEM-2025-001",
    title: "Construction of Flyover Section B",
    department_name: "Public Works Department",
    vendor_name: "Bharat Infrastructure Works",
    award_value: 45000000,
    estimate_value: 42000000,
    crs: 25,
    risk_level: "low"
  },
  {
    id: 2,
    contract_number: "GEM-2025-002",
    title: "Hospital Diagnostic Scanners Supply",
    department_name: "Health Services Directorate",
    vendor_name: "Apex Systems India",
    award_value: 12000000,
    estimate_value: 11500000,
    crs: 82,
    risk_level: "high"
  }
];

describe("ContractsPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches filter options and renders contract rows", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/departments") return Promise.resolve({ data: mockDepartments });
      if (url === "/vendors") return Promise.resolve({ data: mockVendors });
      if (url.includes("/contracts")) return Promise.resolve({ data: mockContracts });
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <BrowserRouter>
        <ContractsPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading contracts database/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("GEM-2025-001")).toBeInTheDocument();
      expect(screen.getByText("GEM-2025-002")).toBeInTheDocument();
    });

    expect(screen.getByText("Construction of Flyover Section B")).toBeInTheDocument();
    expect(screen.getByText("Hospital Diagnostic Scanners Supply")).toBeInTheDocument();
    expect(screen.getByText("CRS 82")).toBeInTheDocument();
  });

  it("handles filter interactions and empty states", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/departments") return Promise.resolve({ data: mockDepartments });
      if (url === "/vendors") return Promise.resolve({ data: mockVendors });
      if (url.includes("/contracts")) return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <BrowserRouter>
        <ContractsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No contracts matching the selected filters/i)).toBeInTheDocument();
    });
  });
});
