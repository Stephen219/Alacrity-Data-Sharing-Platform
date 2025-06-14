import React, { JSX } from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import BookmarkList from "@/app/researcher/bookmarks/page";
import { fetchWithAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";

// Mock Next.js router.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock fetchWithAuth.
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

interface PublishedProps {
  header: string;
  submissions: { id: number | string; title: string; summary: string }[];
  renderButtons: (id: number | string) => JSX.Element;
}

// Mock the Published component to render bookmarks and the provided buttons.
jest.mock("@/components/Published", () => ({
  __esModule: true,
  default: ({ header, submissions, renderButtons }: PublishedProps) => {
    return (
      <div data-testid="published-component">
        <h1>{header}</h1>
        {submissions.map((bookmark) => (
          <div key={bookmark.id} data-testid="bookmark-item">
            <span>{bookmark.title}</span>
            {renderButtons(bookmark.id)}
          </div>
        ))}
      </div>
    );
  },
}));

// Create a router push mock.
const pushMock = jest.fn();

describe("BookmarkList Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
  });

  test("displays loading state initially", () => {
    // Simulate a pending fetch call.
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<BookmarkList />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("displays error state when bookmarks fetch fails", async () => {
    // Simulate a failed bookmarks fetch.
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });
    render(<BookmarkList />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test("renders bookmarks after successful fetch", async () => {
    // Simulate a successful fetch response with two bookmarks.
    const bookmarksData = [
      { id: 1, title: "Bookmark 1", summary: "Summary 1" },
      { id: 2, title: "Bookmark 2", summary: "Summary 2" },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => bookmarksData,
    });
    render(<BookmarkList />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    // Check that the Published component renders with the expected header and bookmark items.
    expect(screen.getByTestId("published-component")).toBeInTheDocument();
    expect(screen.getByText("Your Liked Research")).toBeInTheDocument();
    expect(screen.getByText("Bookmark 1")).toBeInTheDocument();
    expect(screen.getByText("Bookmark 2")).toBeInTheDocument();
  });

  test("unbookmark button removes bookmark on successful unbookmark", async () => {
    // Set up initial bookmarks.
    const bookmarksData = [
      { id: 1, title: "Bookmark 1", summary: "Summary 1" },
      { id: 2, title: "Bookmark 2", summary: "Summary 2" },
    ];
    // First call: fetch bookmarks.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => bookmarksData,
    });
    // Second call: simulate a successful unbookmark action.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    render(<BookmarkList />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    // Find the bookmark item that contains "Bookmark 1"
    const bookmarkItem1 = screen
  .getByText("Bookmark 1")
  .closest("[data-testid='bookmark-item']") as HTMLElement;
    expect(bookmarkItem1).toBeInTheDocument();
    // Find the unbookmark button within that bookmark item.
    const unbookmarkButton = within(bookmarkItem1!).getByRole("button", { name: "Unbookmark" });
    fireEvent.click(unbookmarkButton);
    await waitFor(
      () => {
        expect(screen.queryByText("Bookmark 1")).not.toBeInTheDocument();
        const bookmarkItems = screen.getAllByTestId("bookmark-item");
        // Now only one bookmark should remain (Bookmark 2)
        expect(bookmarkItems.length).toBe(1);
      },
      { timeout: 3000 }
    );
  });

  test("clicking Read button navigates to the bookmark detail page", async () => {
    // Set up a single bookmark.
    const bookmarksData = [
      { id: 1, title: "Bookmark 1", summary: "Summary 1" },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => bookmarksData,
    });
    render(<BookmarkList />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    // Find the Read button (from the Published mock rendering).
    const readButton = screen.getByText("Read");
    fireEvent.click(readButton);
    expect(pushMock).toHaveBeenCalledWith("/researcher/bookmarks/view/1");
  });
});
