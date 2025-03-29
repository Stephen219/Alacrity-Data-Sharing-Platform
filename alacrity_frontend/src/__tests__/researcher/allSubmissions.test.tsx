import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PublicSubmissions from "@/app/researcher/allSubmissions/page"; 
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";


jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

// Provides a simple localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// A sample submissions response to simulate the API
const submissionsData = {
  all_published_submissions: [
    {
      id: 1,
      title: "Test Submission 1",
      description: "Description 1",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-26T12:00:00Z",
      image: "image1.jpg",
      bookmark_count: 5,
    },
    {
      id: 2,
      title: "Test Submission 2",
      description: "Description 2",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-25T12:00:00Z",
      image: "image2.jpg",
      bookmark_count: 3,
    },
    {
      id: 3,
      title: "Another Submission",
      description: "Different description",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-24T12:00:00Z",
      image: "image3.jpg",
      bookmark_count: 0,
    },
    {
      id: 4,
      title: "Submission Four",
      description: "Description Four",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-23T12:00:00Z",
      image: "image4.jpg",
      bookmark_count: 2,
    },
    {
      id: 5,
      title: "Submission Five",
      description: "Description Five",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-22T12:00:00Z",
      image: "image5.jpg",
      bookmark_count: 1,
    },
    {
      id: 6,
      title: "Submission Six",
      description: "Description Six",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-21T12:00:00Z",
      image: "image6.jpg",
      bookmark_count: 0,
    },
    {
      id: 7,
      title: "Submission Seven",
      description: "Description Seven",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-20T12:00:00Z",
      image: "image7.jpg",
      bookmark_count: 4,
    },
    {
      id: 8,
      title: "Submission Eight",
      description: "Description Eight",
      raw_results: "",
      summary: "",
      submitted_at: "2025-03-19T12:00:00Z",
      image: "image8.jpg",
      bookmark_count: 2,
    },
  ],
};

describe("PublicSubmissions Page", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mocks router with a push function for navigation.
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("displays loading state initially", () => {
    // For this test, simulates a never-resolving fetch.
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<PublicSubmissions />);
    expect(screen.getByText("Loading submissions...")).toBeInTheDocument();
  });

  test("displays error state when submissions fetch fails", async () => {
    // Simulates a failed fetch response.
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as jest.Mock;

    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test("renders submissions after successful fetch", async () => {
    // Simulates a successful fetch for submissions.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    // Simulates fetchWithAuth for bookmarks returning an empty array.
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });
    // Checks for known submission titles
    expect(screen.getByText(/Test Submission 1/)).toBeInTheDocument();
    expect(screen.getByText(/Test Submission 2/)).toBeInTheDocument();
  });

  test("filters submissions based on search input", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });

    // Finds the search input and type a term
    const searchInput = screen.getByPlaceholderText("Search submissions...");
    fireEvent.change(searchInput, { target: { value: "Another" } });

    await waitFor(() => {
      // Only the submission with Another Submission should be visible.
      expect(screen.getByText("Another Submission")).toBeInTheDocument();
      expect(screen.queryByText("Test Submission 1")).not.toBeInTheDocument();
    });
  });

  test("paginates submissions correctly", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });
    // Changes items per page from default 6 to 3
    const itemsPerPageSelect = screen.getByDisplayValue("6 per page");
    fireEvent.change(itemsPerPageSelect, { target: { value: "3" } });

    // First page should show the first 3 submissions.
    await waitFor(() => {
      expect(screen.getByText("Test Submission 1")).toBeInTheDocument();
      expect(screen.getByText("Test Submission 2")).toBeInTheDocument();
      expect(screen.getByText("Another Submission")).toBeInTheDocument();
    });
    // Click the next button to go to page 2.
    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      // The first page submissions should not be visible
      expect(screen.queryByText("Test Submission 1")).not.toBeInTheDocument();
      // e..g. submission with id 4 should appear.
      expect(screen.getByText("Submission Four")).toBeInTheDocument();
    });
  });

  test("toggles view mode between list and grid", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });
    // Switches to grid view.
    const gridViewButton = screen.getByLabelText("Grid view");
    fireEvent.click(gridViewButton);

    // The container holding submissions should have grid view classes
    const gridContainer = document.querySelector(
      "div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-8"
    );
    expect(gridContainer).toBeInTheDocument();

    // Switch back to list view.
    const listViewButton = screen.getByLabelText("List view");
    fireEvent.click(listViewButton);
    const listContainer = document.querySelector("div.grid.grid-cols-1.gap-8");
    expect(listContainer).toBeInTheDocument();
  });

  test("clicking bookmark button toggles bookmark state and updates bookmark count", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    // For bookmarks fetch, simulate an empty initial bookmark list.
    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      // For toggleBookmark POST call, simulate a response with updated bookmark status and count.
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookmarked: true, bookmark_count: 10 }),
      });
    // Ensure a token is present so the bookmarks fetch is attempted.
    localStorage.setItem("access_token", "dummy-token");

    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });
    // Find a bookmark button 
    const bookmarkButtons = screen.getAllByRole("button", { name: "Bookmark" });
    expect(bookmarkButtons.length).toBeGreaterThan(0);
    // Click the bookmark button for the first submission
    fireEvent.click(bookmarkButtons[0]);

    // Wait for the toggleBookmark update to appear 
    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });
    // Verify that fetchWithAuth was called with the correct URL and options.
    expect(fetchWithAuth).toHaveBeenCalledWith(
      `${BACKEND_URL}/research/bookmark/1/`,
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  test('clicking "View Details" button navigates to the submission detail page', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => submissionsData,
    }) as jest.Mock;
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<PublicSubmissions />);
    await waitFor(() => {
      expect(screen.queryByText("Loading submissions...")).not.toBeInTheDocument();
    });
    // Find the View Details button (present in both grid and list views).
    const viewDetailsButtons = screen.getAllByText("View Details");
    expect(viewDetailsButtons.length).toBeGreaterThan(0);
    // Click the first View Details button.
    fireEvent.click(viewDetailsButtons[0]);
    // if sub id is 1 then expected navigation URL is:
    expect(pushMock).toHaveBeenCalledWith("/researcher/allSubmissions/view/1");
  });
});
