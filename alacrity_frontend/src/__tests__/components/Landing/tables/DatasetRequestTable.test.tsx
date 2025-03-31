import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DatasetRequestTable, { DatasetRequest } from "@/components/tables/DatasetRequestTable";

const mockRequests: DatasetRequest[] = [
  {
    id: "1",
    dataset_id: "d1",
    title: "Dataset Request 1",
    status: "approved",
    submitted_at: "2023-03-10T12:00:00Z",
    created_at: "2023-03-10T11:00:00Z",
    updated_at: "2023-03-10T11:30:00Z",
    hasPaid: false,
    price: 20,
  },
  {
    id: "2",
    dataset_id: "d2",
    title: "Dataset Request 2",
    status: "pending",
    submitted_at: "2023-03-09T12:00:00Z",
    created_at: "2023-03-09T11:00:00Z",
    updated_at: "2023-03-09T11:30:00Z",
    hasPaid: false,
    price: 0,
  },
  {
    id: "3",
    dataset_id: "d3",
    title: "Dataset Request 3",
    status: "approved",
    submitted_at: "2023-03-08T12:00:00Z",
    created_at: "2023-03-08T11:00:00Z",
    updated_at: "2023-03-08T11:30:00Z",
    hasPaid: true,
    price: 10,
  },
];

describe("DatasetRequestTable Component", () => {
  test("renders dataset requests in a table", () => {
    render(<DatasetRequestTable requests={mockRequests} />);
    expect(screen.getByText("Dataset Request 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 2")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 3")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Submitted at")).toBeInTheDocument();
  });

  test("renders no dataset requests found when empty", () => {
    render(<DatasetRequestTable requests={[]} />);
    expect(
      screen.getByText("No dataset requests found.")
    ).toBeInTheDocument();
  });

  test("calls onRowClick when a clickable row is clicked", () => {
    const onRowClick = jest.fn();
    // Only the approved row with hasPaid true (row 3) is clickable.
    render(
      <DatasetRequestTable
        requests={mockRequests}
        onRowClick={onRowClick}
      />
    );
    const clickableRow = screen.getByText("Dataset Request 3");
    fireEvent.click(clickableRow);
    expect(onRowClick).toHaveBeenCalledWith(mockRequests[2]);
  });

  test("does not call onRowClick when a non-clickable row is clicked", () => {
    const onRowClick = jest.fn();
    render(
      <DatasetRequestTable
        requests={mockRequests}
        onRowClick={onRowClick}
      />
    );
    // Row 1 is approved but not free and not paid, so not clickable.
    const nonClickableRow = screen.getByText("Dataset Request 1");
    fireEvent.click(nonClickableRow);
    // Also, row 2 (pending) is not clickable.
    const pendingRow = screen.getByText("Dataset Request 2");
    fireEvent.click(pendingRow);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test("renders Pay button for approved, non-paid requests and calls onPayClick", () => {
    const onPayClick = jest.fn();
    const onRowClick = jest.fn();
    render(
      <DatasetRequestTable
        requests={mockRequests}
        onPayClick={onPayClick}
        onRowClick={onRowClick}
      />
    );
    // Scope the search to the table element so we don't pick up the "Need to Pay" toggle.
    const table = screen.getByRole("table");
    const payButton = within(table).getByRole("button", { name: /Pay/i });
    expect(payButton).toBeInTheDocument();
    // Clicking the Pay button should call onPayClick and stop propagation.
    fireEvent.click(payButton);
    expect(onPayClick).toHaveBeenCalledWith(mockRequests[0]);
    // onRowClick should not be called due to event.stopPropagation()
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test("filters requests by status using toggle buttons", () => {
    render(<DatasetRequestTable requests={mockRequests} />);
    // Default: "All" → all rows are visible.
    expect(screen.getByText("Dataset Request 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 2")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 3")).toBeInTheDocument();

    // Click on the "Approved" button.
    const approvedButton = screen.getByRole("button", { name: /Approved/i });
    fireEvent.click(approvedButton);
    expect(screen.getByText("Dataset Request 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 3")).toBeInTheDocument();
    expect(screen.queryByText("Dataset Request 2")).toBeNull();

    // Click on "Pending".
    const pendingButton = screen.getByRole("button", { name: /Pending/i });
    fireEvent.click(pendingButton);
    expect(screen.getByText("Dataset Request 2")).toBeInTheDocument();
    expect(screen.queryByText("Dataset Request 1")).toBeNull();
    expect(screen.queryByText("Dataset Request 3")).toBeNull();

    // Click on "Rejected" (maps to status "denied"). None of our rows match.
    const rejectedButton = screen.getByRole("button", { name: /Rejected/i });
    fireEvent.click(rejectedButton);
    expect(screen.getByText("No dataset requests found.")).toBeInTheDocument();
  });

  test("filters requests by Need to Pay toggle", () => {
    render(<DatasetRequestTable requests={mockRequests} />);
    // By default, all requests are shown.
    expect(screen.getByText("Dataset Request 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset Request 3")).toBeInTheDocument();

    // Toggle the "Need to Pay" button.
    const needToPayButton = screen.getByRole("button", { name: /Need to Pay/i });
    fireEvent.click(needToPayButton);
    // In our data, row 1 qualifies but row 3 does not.
    expect(screen.getByText("Dataset Request 1")).toBeInTheDocument();
    expect(screen.queryByText("Dataset Request 3")).toBeNull();
  });

  test("renders search input when searchable is true and filters requests by title", () => {
    render(<DatasetRequestTable requests={mockRequests} searchable={true} />);
    const searchInput = screen.getByPlaceholderText(/Search dataset requests/i);
    expect(searchInput).toBeInTheDocument();

    // Type into the search input to filter for "3"
    fireEvent.change(searchInput, { target: { value: "3" } });
    expect(screen.getByText("Dataset Request 3")).toBeInTheDocument();
    expect(screen.queryByText("Dataset Request 1")).toBeNull();
    expect(screen.queryByText("Dataset Request 2")).toBeNull();
  });

  test("renders pagination controls when paginated and more rows than rowsPerPage", () => {
    // Create 15 approved requests for testing pagination.
    const manyRequests: DatasetRequest[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      dataset_id: `d${i + 1}`,
      title: `Request ${i + 1}`,
      status: "approved",
      submitted_at: "2023-03-10T12:00:00Z",
      created_at: "2023-03-10T11:00:00Z",
      updated_at: "2023-03-10T11:30:00Z",
      hasPaid: true,
      price: 0,
    }));
    render(<DatasetRequestTable requests={manyRequests} rowsPerPage={10} />);
    // Pagination controls should be visible.
    expect(screen.getByRole("button", { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    // Initially, page 1 is displayed.
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    // Clicking "Next" should update the page.
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
