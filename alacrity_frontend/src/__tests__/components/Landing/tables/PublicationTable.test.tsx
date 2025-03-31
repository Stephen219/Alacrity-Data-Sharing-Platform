import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublicationTable, { Publication } from "@/components/tables/PublicationTable";

describe("PublicationTable Component", () => {
  const samplePublications: Publication[] = [
    {
      id: "1",
      title: "First Publication Title",
      status: "published",
      submitted_at: "2023-03-10T12:00:00Z",
    },
    {
      id: "2",
      title: "Second Publication Title",
      status: "pending",
      submitted_at: "2023-03-09T12:00:00Z",
    },
    {
      id: "3",
      title: "Third Publication Title",
      status: "rejected",
      submitted_at: "2023-03-08T12:00:00Z",
    },
  ];

  test("renders table rows when publications are provided", () => {
    render(<PublicationTable publications={samplePublications} />);
    expect(screen.getByText("First Publication Title")).toBeInTheDocument();
    expect(screen.getByText("Second Publication Title")).toBeInTheDocument();
    expect(screen.getByText("Third Publication Title")).toBeInTheDocument();
    // Check headers
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Submitted at")).toBeInTheDocument();
  });

  test("renders 'No publications found.' when publications is empty", () => {
    render(<PublicationTable publications={[]} />);
    expect(screen.getByText("No publications found.")).toBeInTheDocument();
  });

  test("calls onRowClick when a row is clicked", () => {
    const onRowClick = jest.fn();
    render(<PublicationTable publications={samplePublications} onRowClick={onRowClick} />);
    const row = screen.getByText("First Publication Title").closest("tr");
    if (row) {
      fireEvent.click(row);
    }
    expect(onRowClick).toHaveBeenCalledWith(samplePublications[0]);
  });

  test("renders search bar when searchable is true and filters publications", () => {
    render(<PublicationTable publications={samplePublications} searchable={true} />);
    const searchInput = screen.getByPlaceholderText("Search publications...");
    expect(searchInput).toBeInTheDocument();
    // Type a search query that only matches the second publication.
    fireEvent.change(searchInput, { target: { value: "Second" } });
    expect(screen.getByText("Second Publication Title")).toBeInTheDocument();
    expect(screen.queryByText("First Publication Title")).toBeNull();
    expect(screen.queryByText("Third Publication Title")).toBeNull();
  });

  test("renders scrollable container when scrollable is true", () => {
    const { container } = render(
      <PublicationTable publications={samplePublications} scrollable={true} />
    );
    const scrollContainer = container.querySelector("div.overflow-x-auto");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveStyle("max-height: 400px");
  });  

  test("renders pagination controls when paginated and more rows than rowsPerPage", async () => {
    // Create 15 publications.
    const manyPublications: Publication[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Publication ${i + 1}`,
      status: "published",
      submitted_at: new Date(2023, 2, 10 - i).toISOString(),
    }));
    render(<PublicationTable publications={manyPublications} paginated={true} rowsPerPage={10} />);
    // Pagination controls should be visible.
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    // The current page display should show "1 / 2" (or similar)
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    // Click the "Next" button and wait for the page to update.
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument());
  });

});
