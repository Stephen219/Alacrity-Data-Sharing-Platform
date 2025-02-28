import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookmarkList from "@/app/researcher/bookmarks/page";
import "@testing-library/jest-dom";


jest.mock("@/libs/auth", () => ({
    fetchWithAuth: jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("research/bookmarks/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, title: "Bookmarked Research 1", summary: "Summary 1" },
              { id: 2, title: "Bookmarked Research 2", summary: "Summary 2" },
            ]),
        });
      }
      if (url.includes("research/bookmark/") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Unbookmarked successfully" }),
        });
      }
      return Promise.reject(new Error("Unknown request"));
    }),
  }));
  
  jest.mock("@/components/Published", () => {
    const MockPublished = ({
      header,
      submissions,
      sortOrder,
      setSortOrder,
      renderButtons,
    }: {
      header: string;
      submissions: { id: number; title: string }[];
      sortOrder: "newest" | "oldest";
      setSortOrder: (value: "newest" | "oldest") => void;
      renderButtons: (id: number) => React.ReactNode;
    }) => (
      <div data-testid="published">
        <h2>{header}</h2>
        <select
          data-testid="sort-order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <ul>
          {submissions.map((bookmark) => (
            <li key={bookmark.id} data-testid={`bookmark-item-${bookmark.id}`}>
              <span>{bookmark.title}</span>
              {renderButtons(bookmark.id)}
            </li>
          ))}
        </ul>
      </div>
    );
  
    MockPublished.displayName = "MockPublished";
    return MockPublished;
  });
  
  jest.mock("@/components/ui/button", () => {
    const MockButton = ({
      onClick,
      children,
    }: {
      onClick: () => void;
      children: React.ReactNode;
    }) => (
      <button data-testid="unbookmark-button" onClick={onClick}>
        {children}
      </button>
    );
  
    MockButton.displayName = "MockButton";
    return { Button: MockButton };
  });
  

describe("BookmarkList Component", () => {
  test("renders the header correctly", async () => {
    render(<BookmarkList />);
    expect(await screen.findByRole("heading", { level: 2, name: "Your Bookmarked Research" })).toBeInTheDocument();
  });

  test("renders bookmarked items correctly", async () => {
    render(<BookmarkList />);
    expect(await screen.findByTestId("bookmark-item-1")).toHaveTextContent("Bookmarked Research 1");
    expect(await screen.findByTestId("bookmark-item-2")).toHaveTextContent("Bookmarked Research 2");
  });

  test("calls handleUnbookmark when unbookmark button is clicked", async () => {
    render(<BookmarkList />);
    const unbookmarkButtons = await screen.findAllByTestId("unbookmark-button");

    fireEvent.click(unbookmarkButtons[0]);

    await waitFor(() => expect(screen.queryByTestId("bookmark-item-1")).not.toBeInTheDocument());
  });
});
