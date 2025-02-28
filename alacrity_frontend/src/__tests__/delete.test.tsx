import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecentlyDeleted from "@/app/researcher/delete/page"; 
import "@testing-library/jest-dom";

jest.mock("@/libs/auth", () => ({
    fetchWithAuth: jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("research/submissions/recently-deleted/?sort=")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, title: "Deleted Submission 1", summary: "Summary 1" },
            { id: 2, title: "Deleted Submission 2", summary: "Summary 2" }
          ]),
        });
      }
      if (url.includes("restore/") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Submission restored" }),
        });
      }
      if (url.includes("permanent-delete/") && options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Submission permanently deleted" }),
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
      sortOrder: string;
      setSortOrder: (value: string) => void;
      renderButtons: (id: number) => React.ReactNode;
    }) => (
      <div data-testid="published">
        <h2>{header}</h2>
        <select data-testid="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <ul>
          {submissions.map((submission) => (
            <li key={submission.id} data-testid={`deleted-item-${submission.id}`}>
              <span>{submission.title}</span>
              {renderButtons(submission.id)}
            </li>
          ))}
        </ul>
      </div>
    );
  
    MockPublished.displayName = "MockPublished";
    return MockPublished;
  });
  
  jest.mock("@/components/SubmissionsButtons", () => {
    const MockSubmissionsButtons = ({
      onDelete,
      onSecondaryAction,
      secondaryActionLabel,
    }: {
      onDelete: () => void;
      onSecondaryAction: () => void;
      secondaryActionLabel: string;
    }) => (
      <div data-testid="submission-buttons">
        <button data-testid="delete-button" onClick={onDelete}>Delete</button>
        <button data-testid="restore-button" onClick={onSecondaryAction}>{secondaryActionLabel}</button>
      </div>
    );
  
    MockSubmissionsButtons.displayName = "MockSubmissionsButtons";
    return MockSubmissionsButtons;
  });
  

describe("RecentlyDeleted Component", () => {
  beforeEach(() => {
    global.window.confirm = jest.fn(() => true); 
  });

  test("renders the header correctly", async () => {
    render(<RecentlyDeleted />);
    expect(await screen.findByRole("heading", { level: 2, name: "Recently Deleted" })).toBeInTheDocument();
  });

  test("renders deleted submissions correctly", async () => {
    render(<RecentlyDeleted />);
    expect(await screen.findByTestId("deleted-item-1")).toHaveTextContent("Deleted Submission 1");
    expect(await screen.findByTestId("deleted-item-2")).toHaveTextContent("Deleted Submission 2");
  });


  test("calls handleRestore when restore button is clicked", async () => {
    render(<RecentlyDeleted />);
    const restoreButton = await screen.findAllByTestId("restore-button");

    fireEvent.click(restoreButton[0]);

    await waitFor(() => expect(screen.queryByTestId("deleted-item-1")).not.toBeInTheDocument());
  });

  test("calls handleHardDelete when delete button is clicked", async () => {
    render(<RecentlyDeleted />);
    const deleteButton = await screen.findAllByTestId("delete-button");

    fireEvent.click(deleteButton[0]);

    await waitFor(() => expect(screen.queryByTestId("deleted-item-1")).not.toBeInTheDocument());
  });
});
