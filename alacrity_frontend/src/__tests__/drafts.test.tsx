import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DraftList from "@/app/researcher/drafts/page";
import "@testing-library/jest-dom";

// Mock useRouter before importing DraftList
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/components/Published", () => {
  const MockPublished = ({ header, submissions, sortOrder, setSortOrder, renderButtons }: {
    header: string;
    submissions: { id: number; title: string }[];
    sortOrder: string;
    setSortOrder: (value: string) => void;
    renderButtons: (id: number) => React.ReactNode;
  }) => (
    <div data-testid="published">
      <h2>{header}</h2>
      <select
        data-testid="sort-order"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id} data-testid={`draft-item-${submission.id}`}>
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
  const MockSubmissionsButtons = ({ onDelete, onSecondaryAction, secondaryActionLabel }: {
    onDelete: () => void;
    onSecondaryAction: () => void;
    secondaryActionLabel: string;
  }) => (
    <div data-testid="submission-buttons">
      <button data-testid="delete-button" onClick={onDelete}>
        Delete
      </button>
      <button data-testid="edit-button" onClick={onSecondaryAction}>
        {secondaryActionLabel}
      </button>
    </div>
  );

  MockSubmissionsButtons.displayName = "MockSubmissionsButtons";
  return MockSubmissionsButtons;
});

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn((url: string, options?: RequestInit) => {
    if (url.includes("research/drafts/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, title: "Draft Title", summary: "Draft Summary", status: "draft" }
        ]),
      });
    }
    if (url.includes("drafts/delete/1") && options?.method === "DELETE") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Draft moved to Recently Deleted" }),
      });
    }
    if (url.includes("submissions/edit/1") && options?.method === "PUT") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, title: "Updated Draft", status: "published" }),
      });
    }
    return Promise.reject(new Error("Unknown request"));
  }),
}));

describe("DraftList Component", () => {
  beforeEach(() => {
    global.window.confirm = jest.fn(() => true);
  });

  test("renders the header correctly", async () => {
    render(<DraftList />);
    expect(await screen.findByRole("heading", { level: 2, name: "My Drafts" })).toBeInTheDocument();
  });

  test("renders draft items correctly", async () => {
    render(<DraftList />);
    expect(await screen.findByTestId("draft-item-1")).toHaveTextContent("Draft Title");
  });

  test("calls handleSoftDeleteDraft when delete button is clicked", async () => {
    render(<DraftList />);
    const deleteButton = await screen.findByTestId("delete-button");

    fireEvent.click(deleteButton);

    await waitFor(() => expect(screen.queryByTestId("draft-item-1")).not.toBeInTheDocument());
  });
});
