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

  test("calls handleRestore when restore button is clicked", async () => {
    render(<RecentlyDeleted />);

    // Wait for Restore buttons to be available
    const restoreButtons = await screen.findAllByText("Restore");

    // Click the first "Restore" button
    fireEvent.click(restoreButtons[0]);

    // Wait for AlertDialog to appear
    const dialog = await screen.findByText("Are you sure you want to restore?");
    expect(dialog).toBeInTheDocument();

    // Click "Continue" inside AlertDialog
    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    // Wait for the deleted item to be removed from the list
    await waitFor(() => expect(screen.queryByText("Deleted Submission 1")).not.toBeInTheDocument());
  });

  test("calls handleHardDelete when delete button is clicked", async () => {
    render(<RecentlyDeleted />);

    // Wait for Delete buttons to be available
    const deleteButtons = await screen.findAllByText("Delete");

    // Click the first "Delete" button
    fireEvent.click(deleteButtons[0]);

    // Wait for AlertDialog to appear
    const dialog = await screen.findByText("Are you absolutely sure?");
    expect(dialog).toBeInTheDocument();

    // Click "Continue" inside AlertDialog
    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    // Wait for the deleted item to be removed from the list
    await waitFor(() => expect(screen.queryByText("Deleted Submission 1")).not.toBeInTheDocument());
  });
});
