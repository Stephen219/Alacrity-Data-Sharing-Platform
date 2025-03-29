import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FullPublicationPage from "@/app/requests/researchRequests/page";
import { fetchWithAuth } from "@/libs/auth";
import { Publication } from "@/components/tables/PublicationTable";

// Mocks
// Mocks fetchWithAuth to simulate API responses.
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

// Creates a mock for the router.push function.
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mocks PublicationTable to render rows with the necessary props.
jest.mock("@/components/tables/PublicationTable", () => ({
  __esModule: true,
  default: ({ publications, onRowClick, getRowClass }: { 
    publications: Publication[], 
    onRowClick: (pub: Publication) => void,
    getRowClass: (pub: Publication) => string 
  }) => {
    return (
      <div>
        {publications.map((pub, index) => (
          <div
            key={index}
            data-testid="publication-row"
            className={getRowClass(pub)}
            onClick={() => onRowClick(pub)}
          >
            {pub.title} - {pub.status}
          </div>
        ))}
      </div>
    );
  },
  Publication: () => {},
}));


describe("FullPublicationPage", () => {
  const publicationsMock = [
    { id: "1", title: "Publication 1", status: "accepted" },
    { id: "2", title: "Publication 2", status: "pending" },
    { id: "3", title: "Publication 3", status: "rejected" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Simulates a successful API response.
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(publicationsMock),
    });
  });

  test("fetches and displays publications", async () => {
    render(<FullPublicationPage />);
    expect(fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/research/submissions/submitted")
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("publication-row")).toHaveLength(
        publicationsMock.length
      );
    });

    // Checks that each publication row's text is rendered.
    expect(screen.getByText("Publication 1 - accepted")).toBeInTheDocument();
    expect(screen.getByText("Publication 2 - pending")).toBeInTheDocument();
    expect(screen.getByText("Publication 3 - rejected")).toBeInTheDocument();
  });

  test("clicking accepted publication navigates to view page", async () => {
    render(<FullPublicationPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("publication-row")).toHaveLength(
        publicationsMock.length
      );
    });

    const acceptedRow = screen.getByText("Publication 1 - accepted");
    fireEvent.click(acceptedRow);
    expect(pushMock).toHaveBeenCalledWith("/researcher/Submissions/view/1/");
  });

  test("clicking pending publication does not navigate", async () => {
    render(<FullPublicationPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("publication-row")).toHaveLength(
        publicationsMock.length
      );
    });

    const pendingRow = screen.getByText("Publication 2 - pending");
    fireEvent.click(pendingRow);
    expect(pushMock).not.toHaveBeenCalled();
  });

  test("clicking rejected publication navigates to edit page", async () => {
    render(<FullPublicationPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("publication-row")).toHaveLength(
        publicationsMock.length
      );
    });

    const rejectedRow = screen.getByText("Publication 3 - rejected");
    fireEvent.click(rejectedRow);
    expect(pushMock).toHaveBeenCalledWith("/researcher/drafts/edit/3/");
  });

  test("applies correct row classes based on publication status", async () => {
    render(<FullPublicationPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("publication-row")).toHaveLength(
        publicationsMock.length
      );
    });

    // Checks that the pending publication row gets the correct styling.
    const pendingRow = screen.getByText("Publication 2 - pending");
    expect(pendingRow).toHaveClass("cursor-default opacity-50");

    // Accepted and rejected rows should have the pointer classes.
    const acceptedRow = screen.getByText("Publication 1 - accepted");
    expect(acceptedRow).toHaveClass("cursor-pointer hover:bg-gray-50");

    const rejectedRow = screen.getByText("Publication 3 - rejected");
    expect(rejectedRow).toHaveClass("cursor-pointer hover:bg-gray-50");
  });
});
