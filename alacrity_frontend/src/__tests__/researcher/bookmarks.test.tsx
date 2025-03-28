import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import BookmarksPage from "@/app/datasets/bookmarks/page";
import { fetchWithAuth } from "@/libs/auth";

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe("BookmarksPage", () => {
  beforeEach(() => {
    (fetchWithAuth as jest.Mock).mockClear();
  });

  it("renders loading state initially", () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<BookmarksPage />);
    expect(screen.getByText("Loading bookmarks...")).toBeInTheDocument();
  });

  it("renders error message when fetching bookmarks fails", async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error("Failed to fetch bookmarks"));

    render(<BookmarksPage />);

    await waitFor(() => {
      expect(screen.getByText("Error loading bookmarks. Please try again.")).toBeInTheDocument();
    });
  });

  it("renders no bookmarks message when no bookmarks are available", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<BookmarksPage />);

    await waitFor(() => {
      expect(screen.getByText("No bookmarks found.")).toBeInTheDocument();
    });
  });

  it("renders bookmarks correctly when fetched successfully", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          dataset_id: "1",
          title: "Smoking Dataset",
          description: "A dataset related to smoking and health.",
          organization_name: "Health Org",
          category: "Health",
          created_at: "2025-03-01",
          tags: ["smoking", "health"],
          price: 0,
        },
      ],
    });

    render(<BookmarksPage />);

    await waitFor(() => {
      expect(screen.getByText("Smoking Dataset")).toBeInTheDocument();
      expect(screen.getByText("A dataset related to smoking and health.")).toBeInTheDocument();
    });
  });


});