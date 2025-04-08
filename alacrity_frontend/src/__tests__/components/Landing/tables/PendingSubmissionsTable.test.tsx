import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PendingSubmissionsTable, { PendingSubmission } from "@/components/tables/PendingSubmissionsTable";
import { useRouter } from "next/navigation";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the custom select components to immediately render options.
jest.mock("@/components/ui/select", () => {
  return {
    Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <div data-testid={`select-item-${value}`}>{children}</div>
    ),
  };
});

describe("PendingSubmissionsTable Component", () => {
  const routerPushMock = jest.fn();
  beforeEach(() => {
    routerPushMock.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: routerPushMock });
  });

  const submissions: PendingSubmission[] = [
    {
      id: 1,
      title: "First Submission Example",
      description: "desc1",
      researcher_email: "first@example.com",
      submitted_at: "2023-03-10T12:00:00Z",
      status: "pending",
    },
    {
      id: 2,
      title: "Second Submission Example with More Words",
      description: "desc2",
      researcher_email: "second@example.com",
      submitted_at: "2023-03-09T12:00:00Z",
      status: "approved",
    },
    {
      id: 3,
      title: "Third Submission",
      description: "desc3",
      researcher_email: "third@example.com",
      submitted_at: "2023-03-08T12:00:00Z",
      status: "approved",
    },
  ];

  test("renders table rows when submissions are provided", () => {
    render(<PendingSubmissionsTable submissions={submissions} />);
    expect(screen.getByText("first@example.com")).toBeInTheDocument();
    // The title cell shows the first 5 words followed by "..." if title has more than 5 words.
    expect(screen.getByText(/Second Submission Example with More/)).toBeInTheDocument();
  });

  test("renders 'No pending submissions found.' when submissions is empty", () => {
    render(<PendingSubmissionsTable submissions={[]} />);
    expect(screen.getByText("No pending submissions found.")).toBeInTheDocument();
  });

  test("navigates to details on row click", () => {
    render(<PendingSubmissionsTable submissions={submissions} />);
    const row = screen.getByText("first@example.com").closest("tr");
    if (row) {
      fireEvent.click(row);
      expect(routerPushMock).toHaveBeenCalledWith("/requests/submissions/1");
    }
  });

  test("renders search bar when showSearchBar is true and filters submissions", () => {
    render(<PendingSubmissionsTable submissions={submissions} showSearchBar={true} />);
    const searchInput = screen.getByPlaceholderText("Search submissions...");
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "third" } });
    expect(screen.getByText("third@example.com")).toBeInTheDocument();
    expect(screen.queryByText("first@example.com")).toBeNull();
    expect(screen.queryByText("second@example.com")).toBeNull();
  });

  test("renders sort dropdown when showSortDropdown is true", async () => {
    render(<PendingSubmissionsTable submissions={submissions} showSortDropdown={true} />);
    // Because of our mock, the dropdown options are rendered immediately.
    expect(screen.getByText("Oldest to Newest")).toBeInTheDocument();
    expect(screen.getByText("Newest to Oldest")).toBeInTheDocument();
  });

  test("applies vertical scroll styling when enableVerticalScroll is true", () => {
    const { container } = render(
      <PendingSubmissionsTable
        submissions={submissions}
        enableVerticalScroll={true}
        verticalScrollHeight="500px"
      />
    );
    const scrollContainer = container.querySelector("div.overflow-y-auto");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveStyle("max-height: 500px");
  });

  test("paginates submissions when enablePagination is true", async () => {
    // Create 15 submissions.
    const manySubs: PendingSubmission[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Submission ${i + 1}`,
      description: "desc",
      researcher_email: `user${i + 1}@example.com`,
      submitted_at: new Date(2023, 2, 10 - i).toISOString(),
      status: "pending",
    }));
    render(<PendingSubmissionsTable submissions={manySubs} enablePagination={true} pageSize={10} />);
    // Check that pagination controls are rendered.
    expect(screen.getByRole("button", { name: /Prev/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    // Initially, page 1 should be displayed.
    expect(screen.getByText("Submission 15")).toBeInTheDocument();
    // Click on the pagination button "2".
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(screen.getByText("Submission 5")).toBeInTheDocument());
  });

  test("sorts submissions by submitted_at in ascending order by default", () => {
    render(<PendingSubmissionsTable submissions={submissions} />);
    const rows = screen.getAllByRole("row");
    // The first data row (rows[1]) should contain the oldest submission (id 3, "third@example.com").
    expect(rows[1]).toHaveTextContent("third@example.com");
  });
});
