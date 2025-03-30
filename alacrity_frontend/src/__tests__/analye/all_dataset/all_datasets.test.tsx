import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import DatasetsPage from "@/components/all_datasets/all_datasets";
import { fetchWithAuth } from "@/libs/auth";
import "@testing-library/jest-dom";

jest.mock("next/link", () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/config", () => ({
  BACKEND_URL: "http://test-api.example.com",
}));

jest.mock("@/components/all_datasets/datasetCard", () => {
  interface DatasetCardProps {
    title: string;
    description: string;
    onToggleBookmark: () => void;
    isBookmarked: boolean;
  }

  return {
    DatasetCard: ({
      title,
      description,
      onToggleBookmark,
      isBookmarked,
    }: DatasetCardProps) => (
      <div data-testid="dataset-card">
        <h3>{title}</h3>
        <p>{description}</p>
        <button
          data-testid="bookmark-button"
          onClick={(e) => {
            e.preventDefault();
            onToggleBookmark();
          }}
        >
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
    ),
  };
});

const mockDatasets = {
  datasets: [
    {
      dataset_id: "1",
      title: "Dataset 1",
      description: "Description for dataset 1",
      contributor_name: "Contributor 1",
      organization_name: "Organization 1",
      category: "Category 1",
      created_at: "2024-03-01T00:00:00.000Z",
      updated_at: "2024-03-01T00:00:00.000Z",
      tags: ["tag1", "tag2"],
      analysis_link: null,
      price: 0,
      view_count: 10,
    },
    {
      dataset_id: "2",
      title: "Dataset 2",
      description: "Description for dataset 2",
      contributor_name: "Contributor 2",
      organization_name: "Organization 2",
      category: "Category 2",
      created_at: "2024-03-15T00:00:00.000Z",
      updated_at: "2024-03-15T00:00:00.000Z",
      tags: ["tag2", "tag3"],
      analysis_link: null,
      price: 9.99,
      view_count: 20,
    },
  ],
};

const mockBookmarks = [{ dataset_id: "1" }];
const mockUser = { role: "contributor" };
const mockFeedback = [{ rating: 4 }, { rating: 5 }]; 

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider attribute="class">{component}</ThemeProvider>);
};

describe("DatasetsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes("/datasets/all")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets),
        });
      } else if (url.includes("/datasets/bookmarks")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookmarks),
        });
      } else if (url.includes("/bookmark")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      } else if (url.includes("/users/profile")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });
      } else if (url.includes("/datasets/feedback/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFeedback),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  test("renders loading state initially", () => {
    renderWithTheme(<DatasetsPage />);
    expect(screen.getByText("Loading datasets...")).toBeInTheDocument();
  });

  test("renders datasets after loading", async () => {
    renderWithTheme(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Explore Datasets")).toBeInTheDocument();
    expect(screen.getAllByTestId("dataset-card")).toHaveLength(2);
    expect(screen.getByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset 2")).toBeInTheDocument();
  });

  test("handles search filtering correctly", async () => {
    renderWithTheme(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search datasets...");
    fireEvent.change(searchInput, { target: { value: "Dataset 1" } });

    await waitFor(() => {
      expect(screen.getByText("Dataset 1")).toBeInTheDocument();
      expect(screen.queryByText("Dataset 2")).not.toBeInTheDocument();
    });
  });

  // test("correctly displays and interacts with filter categories", async () => {
  //   renderWithTheme(<DatasetsPage />);

  //   await waitFor(() => {
  //     expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
  //   });

  //   const categoryButton = screen.getByText("Category");
  //   fireEvent.click(categoryButton);

  //   expect(screen.getByText("All")).toBeInTheDocument();
  //   expect(screen.getByText("Category 1")).toBeInTheDocument();
  //   expect(screen.getByText("Category 2")).toBeInTheDocument();

  //   fireEvent.click(screen.getByText("Category 1"));

  //   await waitFor(() => {
  //     expect(screen.getByText("Category: Category 1")).toBeInTheDocument();
  //     expect(screen.getByText("Dataset 1")).toBeInTheDocument();
  //     expect(screen.queryByText("Dataset 2")).not.toBeInTheDocument();
  //   });

  //   const removeFilterButton = screen.getByText("×");
  //   fireEvent.click(removeFilterButton);

  //   await waitFor(() => {
  //     expect(screen.getByText("Dataset 1")).toBeInTheDocument();
  //     expect(screen.getByText("Dataset 2")).toBeInTheDocument();
  //   });
  // });

  // test("toggles dataset bookmark correctly", async () => {
  //   renderWithTheme(<DatasetsPage />);

  //   await waitFor(() => {
  //     expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
  //   });

  //   const bookmarkButtons = screen.getAllByTestId("bookmark-button");
  //   expect(bookmarkButtons[0]).toHaveTextContent("Bookmarked");
  //   expect(bookmarkButtons[1]).toHaveTextContent("Bookmark");

  //   fireEvent.click(bookmarkButtons[0]);

  //   await waitFor(() => {
  //     expect(fetchWithAuth).toHaveBeenCalledWith(
  //       "http://test-api.example.com/datasets/1/bookmark/",
  //       { method: "POST" }
  //     );
  //     expect(bookmarkButtons[0]).toHaveTextContent("Bookmark");
  //   });

  //   fireEvent.click(bookmarkButtons[1]);

  //   await waitFor(() => {
  //     expect(fetchWithAuth).toHaveBeenCalledWith(
  //       "http://test-api.example.com/datasets/2/bookmark/",
  //       { method: "POST" }
  //     );
  //     expect(bookmarkButtons[1]).toHaveTextContent("Bookmarked");
  //   });
  // });

  test("handles pagination correctly", async () => {
    const manyDatasets = {
      datasets: Array.from({ length: 10 }, (_, i) => ({
        dataset_id: `${i + 1}`,
        title: `Dataset ${i + 1}`,
        description: `Description for dataset ${i + 1}`,
        contributor_name: `Contributor ${i + 1}`,
        organization_name: `Organization ${i % 3 + 1}`,
        category: `Category ${i % 2 + 1}`,
        created_at: "2024-03-01T00:00:00.000Z",
        updated_at: "2024-03-01T00:00:00.000Z",
        tags: [`tag${i % 3 + 1}`, `tag${i % 4 + 1}`],
        analysis_link: null,
        price: i % 2 === 0 ? 0 : 9.99,
        view_count: 10 * (i + 1),
      })),
    };

    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes("/datasets/all")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(manyDatasets),
        });
      } else if (url.includes("/datasets/bookmarks")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ dataset_id: "1" }]),
        });
      } else if (url.includes("/users/profile")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });
      } else if (url.includes("/datasets/feedback/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFeedback),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    renderWithTheme(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset 6")).toBeInTheDocument();
    expect(screen.queryByText("Dataset 7")).not.toBeInTheDocument();

    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.queryByText("Dataset 1")).not.toBeInTheDocument();
      expect(screen.getByText("Dataset 7")).toBeInTheDocument();
      expect(screen.getByText("Dataset 10")).toBeInTheDocument();
    });
  });

  // test("handles bookmark toggle failure", async () => {
  //   (fetchWithAuth as jest.Mock).mockImplementation((url) => {
  //     if (url.includes("/datasets/all")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve(mockDatasets),
  //       });
  //     } else if (url.includes("/datasets/bookmarks")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve(mockBookmarks),
  //       });
  //     } else if (url.includes("/bookmark")) {
  //       return Promise.resolve({
  //         ok: false,
  //         status: 500,
  //         json: () => Promise.resolve({ error: "Server error" }),
  //       });
  //     } else if (url.includes("/users/profile")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve(mockUser),
  //       });
  //     } else if (url.includes("/datasets/feedback/")) {
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve(mockFeedback),
  //       });
  //     }
  //     return Promise.reject(new Error("Unknown URL"));
  //   });

  //   renderWithTheme(<DatasetsPage />);

  //   await waitFor(() => {
  //     expect(screen.queryByText("Loading datasets...")).not.toBeInTheDocument();
  //   });

  //   const bookmarkButtons = screen.getAllByTestId("bookmark-button");
  //   expect(bookmarkButtons[0]).toHaveTextContent("Bookmarked");

  //   fireEvent.click(bookmarkButtons[0]);

  //   await waitFor(() => {
  //     expect(screen.getByText("Failed to update bookmark. Please try again.")).toBeInTheDocument();
  //     expect(bookmarkButtons[0]).toHaveTextContent("Bookmarked"); // Should revert
  //   });
  // });
});