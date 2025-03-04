import { render, screen, fireEvent } from "@testing-library/react";
import Published from "@/components/Published";
import "@testing-library/jest-dom";

describe("Published Component", () => {
  const mockSetSortOrder = jest.fn();
  const mockRenderButtons = jest.fn(() => <button>Test Button</button>);

  const mockSubmissions = [
    {
      id: 1,
      title: "Test Submission 1",
      summary: "This is a test summary for submission 1.",
      status: "published",
    },
    {
      id: 2,
      title: "Test Submission 2",
      summary: "This is a test summary for submission 2.",
      status: "draft",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the header correctly", () => {
    render(
      <Published
        submissions={mockSubmissions}
        sortOrder="newest"
        setSortOrder={mockSetSortOrder}
        renderButtons={mockRenderButtons}
        header="My Research"
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "My Research" })).toBeInTheDocument();
  });

  test("renders 'No submissions found' when submissions array is empty", () => {
    render(
      <Published
        submissions={[]}
        sortOrder="newest"
        setSortOrder={mockSetSortOrder}
        renderButtons={mockRenderButtons}
        header="My Research"
      />
    );

    expect(screen.getByText("No submissions found.")).toBeInTheDocument();
  });

  test("renders submissions when provided", () => {
    render(
      <Published
        submissions={mockSubmissions}
        sortOrder="newest"
        setSortOrder={mockSetSortOrder}
        renderButtons={mockRenderButtons}
        header="My Research"
      />
    );

    expect(screen.getByText("Test Submission 1")).toBeInTheDocument();
    expect(screen.getByText("This is a test summary for submission 1.")).toBeInTheDocument();
    expect(screen.getByText("Test Submission 2")).toBeInTheDocument();
    expect(screen.getByText("This is a test summary for submission 2.")).toBeInTheDocument();
  });

  test("calls setSortOrder when a new sort option is selected", () => {
    render(
      <Published
        submissions={mockSubmissions}
        sortOrder="newest"
        setSortOrder={mockSetSortOrder}
        renderButtons={mockRenderButtons}
        header="My Research"
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "oldest" } });

    expect(mockSetSortOrder).toHaveBeenCalledTimes(1);
    expect(mockSetSortOrder).toHaveBeenCalledWith("oldest");
  });

  test("renders buttons for each submission", () => {
    render(
      <Published
        submissions={mockSubmissions}
        sortOrder="newest"
        setSortOrder={mockSetSortOrder}
        renderButtons={mockRenderButtons}
        header="My Research"
      />
    );

    const buttons = screen.getAllByText("Test Button");
    expect(buttons).toHaveLength(mockSubmissions.length);
  });
});
