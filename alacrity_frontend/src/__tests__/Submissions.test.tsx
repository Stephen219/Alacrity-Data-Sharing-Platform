import { render, screen, waitFor } from "@testing-library/react";
import Submissions from "@/app/researcher/Submissions/page";
import { fetchWithAuth } from "@/libs/auth";
import "@testing-library/jest-dom";

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

describe("Submissions Component", () => {
  const mockSubmissions = [
    { id: 1, title: "Test Submission 1", summary: "Summary 1", status: "published" },
    { id: 2, title: "Test Submission 2", summary: "Summary 2", status: "draft" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the loading state initially", () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    });

    render(<Submissions />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders fetched submissions correctly", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    });

    render(<Submissions />);

    await waitFor(() => expect(screen.getByText("Test Submission 1")).toBeInTheDocument());
    expect(screen.getByText("Test Submission 2")).toBeInTheDocument();
  });

  test("displays an error message if fetching fails", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to fetch submissions." }),
    });

    render(<Submissions />);

    await waitFor(() => expect(screen.getByText("Error: Failed to fetch submissions.")).toBeInTheDocument());
  });




});
