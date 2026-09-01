import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { api } from "../services/api";

vi.mock("../services/api");

const mockStats = {
  total_contracts: 2500,
  high_risk_contracts: 320,
  medium_risk_contracts: 650,
  low_risk_contracts: 1530,
  total_value: 8450000000,
  average_crs: 38.5,
  active_cases: 6,
  departments: [
    { name: "Public Works Department", contract_count: 450, avg_crs: 42.1 },
    { name: "Digital Services Directorate", contract_count: 320, avg_crs: 56.4 }
  ]
};

const mockHighRiskContracts = [
  {
    id: 7,
    contract_number: "GEM-DEMO-000007",
    title: "Procurement of Core Enterprise Switches",
    department_name: "Digital Services Directorate",
    vendor_name: "Apex Systems India",
    award_value: 8900000,
    crs: 90,
    risk_level: "high"
  }
];

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    render(
      <BrowserRouter>
        <DashboardPage onOpenIngest={vi.fn()} onOpenAI={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText(/loading forensic audit statistics/i)).toBeInTheDocument();
  });

  it("fetches and renders KPI metrics, charts, and showcase contracts", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/dashboard/stats") {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes("/contracts")) {
        return Promise.resolve({ data: mockHighRiskContracts });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <BrowserRouter>
        <DashboardPage onOpenIngest={vi.fn()} onOpenAI={vi.fn()} />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("2,500")).toBeInTheDocument();
    });

    // Check title and KPIs
    expect(screen.getByText("Procurement Risk Dashboard")).toBeInTheDocument();
    expect(screen.getAllByText("320").length).toBeGreaterThan(0);
    expect(screen.getByText("6")).toBeInTheDocument();

    // Check high risk contracts table
    expect(screen.getAllByText("GEM-DEMO-000007").length).toBeGreaterThan(0);
    expect(screen.getByText("Apex Systems India")).toBeInTheDocument();
    expect(screen.getAllByText(/90/).length).toBeGreaterThan(0);
  });
});
