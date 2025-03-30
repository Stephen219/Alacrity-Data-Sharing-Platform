import { render, screen, waitFor } from "@testing-library/react";
import PendingRequest from "@/components/requests/pending";
import { fetchWithAuth } from "@/libs/auth";

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock BACKEND_URL to avoid undefined issues
jest.mock("../../config", () => ({
  BACKEND_URL: "http://mock-backend-url",
}));

describe("PendingRequest Component", () => {
  const mockRequests = [
    {
      id: 1,
      dataset_title: "Dataset 1",
      researcher_name: "John Doe",
      researcher_role: "Researcher",
      researcher_description: "Description",
      message: "Test message",
      request_status: "pending",
      created_at: "2025-03-01T12:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state initially", () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true, // Ensure ok is set
      json: () => Promise.resolve([]),
    });

    render(<PendingRequest />);
    expect(screen.getByText("Loading requests...")).toBeInTheDocument();
  });

  test("renders a request when available", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequests),
    });

    render(<PendingRequest />);

    await waitFor(() => {
      expect(screen.getByText("Pending Requests")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Dataset 1")).toBeInTheDocument();
      expect(screen.getByText("PENDING")).toBeInTheDocument(); // Match uppercase
      const dateCell = screen.getByRole("cell", { name: /01\/03\/2025/ }); // Match exact date
      expect(dateCell).toBeInTheDocument();
    }, { timeout: 2000 }); // Increase timeout if needed
  });

  test("renders 'No pending requests found' when no requests are returned", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<PendingRequest />);

    await waitFor(() => {
      expect(screen.getByText("No pending requests found.")).toBeInTheDocument();
    });
  });

  test("renders error message when fetch fails", async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<PendingRequest />);

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to fetch")).toBeInTheDocument();
    });
  });
});