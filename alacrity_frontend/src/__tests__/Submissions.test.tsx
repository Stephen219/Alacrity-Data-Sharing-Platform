/* eslint-disable */
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import Submissions from "@/app/researcher/Submissions/page";
import { fetchWithAuth } from "@/libs/auth";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock window.confirm to always return true
global.window.confirm = jest.fn(() => true);

describe("Submissions Component", () => {
  const mockSubmissions = [
    { id: 1, title: "Test Submission 1", summary: "Summary 1", status: "published", is_private: false },
    { id: 2, title: "Test Submission 2", summary: "Summary 2", status: "draft", is_private: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the loading state initially", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    });

    render(<Submissions />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Test Submission 1")).toBeInTheDocument());
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

  test("sorts submissions by newest first", async () => {
    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockSubmissions }) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => mockSubmissions.reverse() }); // After sort

    render(<Submissions />);

    await waitFor(() => expect(screen.getByText("Test Submission 1")).toBeInTheDocument());

    // Change sort order
    act(() => {
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "oldest" } });
    });

    await waitFor(() => {
      const titles = screen.getAllByText(/Test Submission/i).map(el => el.textContent);
      expect(titles).toEqual(["Test Submission 2", "Test Submission 1"]);
    });
  });


  test("toggles privacy status of a submission", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    });

    render(<Submissions />);

    await waitFor(() => expect(screen.getByText("Test Submission 1")).toBeInTheDocument());

    // Mock API call for toggling privacy
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ is_private: true }),
    });

    // Click toggle privacy button inside act()
    await act(async () => {
      fireEvent.click(screen.getAllByRole("switch")[0]);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("switch")[0]).toHaveAttribute("aria-checked", "true");
    });
    
  });

  test("navigates to submission view page when clicking read", async () => {
    const pushMock = jest.fn();
  
    // Override the existing mock using jest.spyOn
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
      push: pushMock,
    } as any);
  
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    });
  
    render(<Submissions />);
  
    await waitFor(() => expect(screen.getByText("Test Submission 1")).toBeInTheDocument());
  
    fireEvent.click(screen.getAllByText("Read")[0]);
  
    expect(pushMock).toHaveBeenCalledTimes(1);
  
    const calledPath = pushMock.mock.calls[0][0];
    expect(calledPath).toMatch(/\/researcher\/Submissions\/view\/\d+/);
  });
  
  
  
});
