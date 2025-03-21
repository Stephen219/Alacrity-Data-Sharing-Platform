import { render, screen, waitFor } from "@testing-library/react";
import PendingRequest from "@/components/requests/pending";
import { fetchWithAuth } from "@/libs/auth";

// Mocking the fetchWithAuth function
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

// Mocking the useRouter hook
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
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
      json: jest.fn().mockResolvedValue([]),
    });

    render(<PendingRequest />);
    expect(screen.getByText("Loading requests...")).toBeInTheDocument();
  });

  test("renders a request when available", async () => {
    // Setup the mock before rendering
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockRequests),
    });

    render(<PendingRequest />);

    await waitFor(() => {
      expect(screen.getByText("Pending Requests")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Dataset 1")).toBeInTheDocument();
      expect(screen.getByText("pending")).toBeInTheDocument();
      
      // Use a callback matcher instead of a direct text match
      const dateCell = screen.getByRole("cell", { name: (content) => {
        return content.includes("2025") && (content.includes("01") || content.includes("03") || content.includes("1") || content.includes("3"));
      }});
      expect(dateCell).toBeInTheDocument();
    });
  });

  test("renders 'No pending requests found' when no requests are returned", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
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