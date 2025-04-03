import { render, screen, fireEvent, waitFor, within} from "@testing-library/react";
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

describe("RecentlyDeleted Component", () => {
  test("renders the header correctly", async () => {
    render(<RecentlyDeleted />);
    expect(await screen.findByRole("heading", { level: 2, name: "Recently Deleted" })).toBeInTheDocument();
  });

  test("renders deleted submissions correctly", async () => {
    render(<RecentlyDeleted />);

    // Wait for deleted submissions to appear
    await waitFor(() => expect(screen.getByText("Deleted Submission 1")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Deleted Submission 2")).toBeInTheDocument());
  });

  describe("RecentlyDeleted Component", () => {
    test("calls handleRestore when restore button is clicked", async () => {
      render(<RecentlyDeleted />);
    
      // Wait for both submissions to render.
      await screen.findByText("Deleted Submission 1");
      await screen.findByText("Deleted Submission 2");
    
      // Find the element with the text "Deleted Submission 1"
      const sub1Text = screen.getByText("Deleted Submission 1");
      // Find the closest ancestor with the "group" class.
      const groupEl = sub1Text.closest(".group");
      if (!groupEl || !(groupEl instanceof HTMLElement)) {
        throw new Error("Submission card not found or not an HTMLElement");
      }
      const sub1Card: HTMLElement = groupEl;
    
      // Now, within that card, find the Restore button.
      const restoreButton = within(sub1Card).getByText("Restore");
      fireEvent.click(restoreButton);
    
      // The AlertDialog appears – confirm it's visible.
      expect(await screen.findByText("Are you sure you want to restore?")).toBeInTheDocument();
    
      // Click "Continue" in the AlertDialog.
      fireEvent.click(screen.getByText("Continue"));
    
      // Wait for "Deleted Submission 1" to be removed from the DOM.
      await waitFor(() =>
        expect(screen.queryByText("Deleted Submission 1")).not.toBeInTheDocument()
      );
    });
  });
    
  
    test("calls handleHardDelete when delete button is clicked", async () => {
      render(<RecentlyDeleted />);
  
      // Wait for "Deleted Submission 1" to render
      await screen.findByText("Deleted Submission 1");
  
      // Target the correct card
      const sub1Text = screen.getByText("Deleted Submission 1");
      const sub1Card = sub1Text.closest(".group") as HTMLElement;
      expect(sub1Card).toBeInTheDocument();
  
      // Within that card, find the "Delete" button
      const deleteButton = within(sub1Card!).getByText("Delete");
      fireEvent.click(deleteButton);
  
      // The AlertDialog appears
      expect(await screen.findByText("Are you absolutely sure?")).toBeInTheDocument();
  
      // Click "Continue" in the AlertDialog
      fireEvent.click(screen.getByText("Continue"));
  
      // Wait for "Deleted Submission 1" to be removed
      await waitFor(() =>
        expect(screen.queryByText("Deleted Submission 1")).not.toBeInTheDocument()
      );
    });
  });
