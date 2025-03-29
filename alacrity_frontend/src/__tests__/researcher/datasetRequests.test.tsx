import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "@/app/researcher/datasetWithAccess/page";
import { fetchWithAuth, useAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";

// --- Mocks ---

// Bypass auth guards by simply rendering children.
jest.mock("@/components/auth_guard/AccessControl", () => ({
  __esModule: true,
  withAccessControl: (Component: any) => Component,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Next.js router.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock auth module.
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
  useAuth: jest.fn(() => ({ user: { id: "test-user" }, loading: false })),
}));

// Mock the DatasetRequestTable to expose its props and simulate user actions.
jest.mock("@/components/tables/DatasetRequestTable", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="dataset-request-table">
      {props.requests.map((req: any) => (
        <div key={req.id} data-testid="dataset-request-item">
          <span>{req.title}</span>
          <button
            onClick={() => props.onRowClick(req)}
            data-testid={`row-click-${req.id}`}
          >
            Row Click
          </button>
          <button
            onClick={() => props.onPayClick(req)}
            data-testid={`pay-click-${req.id}`}
          >
            Pay
          </button>
          <div data-testid={`row-class-${req.id}`}>
            {props.getRowClass(req)}
          </div>
        </div>
      ))}
      <div data-testid="paginated">{props.paginated ? "true" : "false"}</div>
      <div data-testid="searchable">{props.searchable ? "true" : "false"}</div>
    </div>
  ),
}));

describe("DatasetWithAccess Page", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
  });

  test("renders DatasetRequestTable with fetched dataset requests", async () => {
    // Arrange: simulate two dataset requests.
    const rawData = [
      {
        request_id: "req1",
        dataset_id_id: "dataset1",
        dataset_id__title: "Dataset One",
        dataset_id__price: "0", // free dataset
        request_status: "approved",
        created_at: "2025-03-27T12:00:00Z",
        has_paid: "false",
      },
      {
        request_id: "req2",
        dataset_id_id: "dataset2",
        dataset_id__title: "Dataset Two",
        dataset_id__price: "100", // paid dataset
        request_status: "approved",
        created_at: "2025-03-27T11:00:00Z",
        has_paid: "true",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });

    // Act: render the component.
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("Dataset Requests")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Assert that the table renders both requests.
    const items = screen.getAllByTestId("dataset-request-item");
    expect(items).toHaveLength(rawData.length);
    expect(screen.getByText("Dataset One")).toBeInTheDocument();
    expect(screen.getByText("Dataset Two")).toBeInTheDocument();

    // Check table configuration props.
    expect(screen.getByTestId("paginated").textContent).toBe("true");
    expect(screen.getByTestId("searchable").textContent).toBe("true");

    // Check that approved requests (free or paid) are styled as clickable.
    const rowClassReq1 = screen.getByTestId("row-class-req1");
    expect(rowClassReq1.textContent).toBe("hover:bg-gray-50 cursor-pointer");
    const rowClassReq2 = screen.getByTestId("row-class-req2");
    expect(rowClassReq2.textContent).toBe("hover:bg-gray-50 cursor-pointer");
  });

  test("handleRowClick navigates to analysis page for approved free or paid requests", async () => {
    // Arrange: simulate one approved free request.
    const rawData = [
      {
        request_id: "req1",
        dataset_id_id: "dataset1",
        dataset_id__title: "Dataset One",
        dataset_id__price: "0", // free dataset
        request_status: "approved",
        created_at: "2025-03-27T10:00:00Z",
        has_paid: "false",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });

    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Act: simulate a row click.
    const rowClickButton = screen.getByTestId("row-click-req1");
    fireEvent.click(rowClickButton);

    // Assert navigation.
    expect(pushMock).toHaveBeenCalledWith("/analyze/dataset1");
  });

  test("does not navigate on row click if request is not approved or not free/paid", async () => {
    // Arrange: simulate a request that is not approved.
    const rawData = [
      {
        request_id: "req3",
        dataset_id_id: "dataset3",
        dataset_id__title: "Dataset Three",
        dataset_id__price: "50", // paid but not approved
        request_status: "pending",
        created_at: "2025-03-27T09:00:00Z",
        has_paid: "false",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });

    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Act: simulate a row click.
    const rowClickButton = screen.getByTestId("row-click-req3");
    fireEvent.click(rowClickButton);

    // Assert no navigation occurred.
    expect(pushMock).not.toHaveBeenCalled();
  });

  test("handlePayClick triggers payment process and redirects when approval_url is returned", async () => {
    // Arrange: simulate a paid request that is approved.
    const rawData = [
      {
        request_id: "req4",
        dataset_id_id: "dataset4",
        dataset_id__title: "Dataset Four",
        dataset_id__price: "100", // paid dataset
        request_status: "approved",
        created_at: "2025-03-27T08:00:00Z",
        has_paid: "false",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });
    // For the payment call, simulate a response with an approval URL.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ approval_url: "https://paypal.com/approve" }),
    });

    // Set up a writable window.location.
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: "" };

    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Act: simulate clicking the Pay button.
    const payButton = screen.getByTestId("pay-click-req4");
    fireEvent.click(payButton);

    // Assert that the browser is redirected.
    await waitFor(() => {
      expect(window.location.href).toBe("https://paypal.com/approve");
    });

    // Restore window.location.
    window.location = originalLocation;
  });

  test("handlePayClick alerts with message if no approval_url is returned", async () => {
    // Arrange: simulate a paid request.
    const rawData = [
      {
        request_id: "req5",
        dataset_id_id: "dataset5",
        dataset_id__title: "Dataset Five",
        dataset_id__price: "100",
        request_status: "approved",
        created_at: "2025-03-27T07:00:00Z",
        has_paid: "false",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });
    // Simulate a payment response that returns a message.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Payment pending" }),
    });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Act: simulate clicking the Pay button.
    const payButton = screen.getByTestId("pay-click-req5");
    fireEvent.click(payButton);

    // Assert that alert is shown.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Payment pending");
    });
    alertSpy.mockRestore();
  });

  test("handlePayClick alerts error when fetch fails", async () => {
    // Arrange: simulate a paid request.
    const rawData = [
      {
        request_id: "req6",
        dataset_id_id: "dataset6",
        dataset_id__title: "Dataset Six",
        dataset_id__price: "100",
        request_status: "approved",
        created_at: "2025-03-27T06:00:00Z",
        has_paid: "false",
      },
    ];
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => rawData,
    });
    // Simulate a failed payment request.
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("dataset-request-table")).toBeInTheDocument()
    );

    // Act: simulate clicking the Pay button.
    const payButton = screen.getByTestId("pay-click-req6");
    fireEvent.click(payButton);

    // Assert that an error alert is shown and the error is logged.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error creating PayPal payment. Check console for details.");
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating PayPal payment:",
      expect.any(Error)
    );

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
