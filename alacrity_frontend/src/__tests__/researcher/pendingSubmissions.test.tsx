import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PendingSubmissions from "@/app/requests/pendingSubmissions/page";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

// Mock the fetchWithAuth function.
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock the PendingSubmissionsTable component to expose its props.
jest.mock("@/components/tables/PendingSubmissionsTable", () => ({
  __esModule: true,
  default: (props: any) => {
    return (
      <div data-testid="pending-submissions-table">
        {props.submissions.map((submission: any) => (
          <div key={submission.id} data-testid="submission-item">
            {submission.title}
          </div>
        ))}
        <div data-testid="pagination">
          {props.enablePagination ? "Enabled" : "Disabled"}
        </div>
        <div data-testid="page-size">{props.pageSize}</div>
        <div data-testid="vertical-scroll">
          {props.enableVerticalScroll ? "Enabled" : "Disabled"}
        </div>
        <div data-testid="scroll-height">{props.verticalScrollHeight}</div>
        <div data-testid="sort-dropdown">
          {props.showSortDropdown ? "Enabled" : "Disabled"}
        </div>
        <div data-testid="search-bar">
          {props.showSearchBar ? "Enabled" : "Disabled"}
        </div>
      </div>
    );
  },
}));

describe("PendingSubmissions Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders PendingSubmissionsTable with fetched submissions on success", async () => {
    // simulate successful fetch with test submissions.
    const testSubmissions = [
      {
        id: 1,
        title: "Submission 1",
        description: "Desc 1",
        researcher_email: "a@example.com",
        submitted_at: "2025-03-27T10:00:00Z",
        status: "pending",
      },
      {
        id: 2,
        title: "Submission 2",
        description: "Desc 2",
        researcher_email: "b@example.com",
        submitted_at: "2025-03-27T11:00:00Z",
        status: "pending",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => testSubmissions,
    });

    render(<PendingSubmissions />);

    // Wait for at least one submission title to appear
    await waitFor(() =>
      expect(screen.getByText("Submission 1")).toBeInTheDocument()
    );

    // Use findAllByTestId to await the submission items
    const items = await screen.findAllByTestId("submission-item");
    expect(items).toHaveLength(testSubmissions.length);
    expect(screen.getByText("Submission 1")).toBeInTheDocument();
    expect(screen.getByText("Submission 2")).toBeInTheDocument();

    // Assert that table configuration props are passed correctly
    expect(screen.getByTestId("pagination").textContent).toBe("Enabled");
    expect(screen.getByTestId("page-size").textContent).toBe("8");
    expect(screen.getByTestId("vertical-scroll").textContent).toBe("Enabled");
    expect(screen.getByTestId("scroll-height").textContent).toBe("800px");
    expect(screen.getByTestId("sort-dropdown").textContent).toBe("Enabled");
    expect(screen.getByTestId("search-bar").textContent).toBe("Enabled");

    // Verify that fetchWithAuth was called with the correct URL
    expect(fetchWithAuth).toHaveBeenCalledWith(
      `${BACKEND_URL}/research/submissions/pending/`
    );
  });

  test("handles fetch error and logs error", async () => {
    // Arrange: simulate a failed fetch.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    // Spy on console.error to capture error logging.
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<PendingSubmissions />);

    // Wait for the table component to render.
    await waitFor(() =>
      expect(screen.getByTestId("pending-submissions-table")).toBeInTheDocument()
    );

    // Since fetch failed, the submissions list should be empty.
    const items = screen.queryAllByTestId("submission-item");
    expect(items).toHaveLength(0);

    // Verify that an error was logged.
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching pending submissions:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
