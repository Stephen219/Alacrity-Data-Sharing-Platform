import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewSubmissionPage from "@/app/requests/submissions/[id]/page";
import { fetchWithAuth, useAuth } from "@/libs/auth"; // Import useAuth
import { useRouter } from "next/navigation";

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
  useAuth: jest.fn(), // Mock useAuth
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: () => ({ id: "1" }),
}));

const mockRouter = { push: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Mock AuthContext for withAccessControl
const mockAuthContextValue = {
  user: { id: "admin1", role: "admin" }, // Adjust role as needed
  loading: false,
  logout: jest.fn(),
};
(useAuth as jest.Mock).mockReturnValue(mockAuthContextValue);

describe("ReviewSubmissionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubmission = {
    id: 1,
    title: "Test Submission",
    description: "Test description",
    raw_results: "Raw results data",
    summary: "Summary of findings",
    researcher_email: "researcher@example.com",
    submitted_at: new Date().toISOString(),
    status: "pending",
  };

  test("displays submission details when fetched successfully", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Submission")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByText("Raw results data")).toBeInTheDocument();
      expect(screen.getByText("Summary of findings")).toBeInTheDocument();
      expect(screen.getByText("researcher@example.com")).toBeInTheDocument();
    });
  });

  test("displays error message when API fails", async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<ReviewSubmissionPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    });
  });

  test("calls approve API and shows success alert", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);
    await waitFor(() => expect(screen.getByText("Approve")).toBeInTheDocument());

    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Approved" }),
    });

    fireEvent.click(screen.getByText("Approve"));

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Submission approved successfully. Email sent.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Close"));
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("calls reject API and shows success alert", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);
    await waitFor(() => expect(screen.getByText("Reject")).toBeInTheDocument());

    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Rejected" }),
    });

    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Submission rejected successfully. Email sent.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Close"));
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("handles API failure for approve action", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);
    await waitFor(() => expect(screen.getByText("Approve")).toBeInTheDocument());

    (fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error("Approval failed"));
    fireEvent.click(screen.getByText("Approve"));

    await waitFor(() => {
      expect(screen.getByText("Error!")).toBeInTheDocument();
      expect(screen.getByText("Error: Approval failed")).toBeInTheDocument();
    });
  });

  test("handles API failure for reject action", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);
    await waitFor(() => expect(screen.getByText("Reject")).toBeInTheDocument());

    (fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error("Rejection failed"));
    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(screen.getByText("Error!")).toBeInTheDocument();
      expect(screen.getByText("Error: Rejection failed")).toBeInTheDocument();
    });
  });

  test("updates message state correctly", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission,
    });

    render(<ReviewSubmissionPage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Write a message to the researcher (optional)...")).toBeInTheDocument()
    );

    const messageInput = screen.getByPlaceholderText(
      "Write a message to the researcher (optional)..."
    ) as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: "This is a test message" } });

    expect(messageInput.value).toBe("This is a test message");
  });
});