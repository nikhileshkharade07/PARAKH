import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AIAssistantDrawer from "./AIAssistantDrawer";
import { api } from "../services/api";

vi.mock("../services/api");

describe("AIAssistantDrawer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <BrowserRouter>
        <AIAssistantDrawer isOpen={false} onClose={vi.fn()} />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders header and welcome message when open", () => {
    render(
      <BrowserRouter>
        <AIAssistantDrawer isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("Investigator AI Assistant")).toBeInTheDocument();
    expect(screen.getByText(/Grounded strictly in verified database evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/I am the PARAKH Forensic Assistant/i)).toBeInTheDocument();
  });

  it("submits query to api and displays response with citations", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        query: "Why is tender GEM-DEMO-000007 high risk?",
        answer: "This tender received CRS 90/100 due to single bidder and specification tailoring.",
        citations: [
          {
            title: "Tender GEM-DEMO-000007",
            citation_type: "CONTRACT",
            reference_id: "GEM-DEMO-000007",
            summary: "CRS 90/100 | 3 Red Flags",
            link: "/contracts/7"
          }
        ]
      }
    });

    render(
      <BrowserRouter>
        <AIAssistantDrawer isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Ask about tenders, vendor collusion/i);
    fireEvent.change(input, { target: { value: "Why is tender GEM-DEMO-000007 high risk?" } });
    
    const sendButton = screen.getByRole("button", { name: /Send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/This tender received CRS 90\/100/i)).toBeInTheDocument();
      expect(screen.getByText("Tender GEM-DEMO-000007")).toBeInTheDocument();
    });
  });
});
