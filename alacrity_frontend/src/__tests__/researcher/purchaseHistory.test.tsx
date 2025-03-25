import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PurchaseHistoryPage from "@/app/researcher/purchaseHistory/page";
import { fetchWithAuth } from "@/libs/auth";

// Mocks the fetchWithAuth function
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

describe("PurchaseHistoryPage", () => {
  const mockPurchases = [
    {
      purchase_id: 1,
      dataset_id: "ds1",
      dataset_title: "Test Dataset",
      cost: 10,
      purchased_at: new Date("2025-03-17T08:37:47.491Z").toISOString(),
      purchase_year: 2025,
      purchase_month: 3,
    },
    {
      purchase_id: 2,
      dataset_id: "ds2",
      dataset_title: "Another Dataset",
      cost: 20,
      purchased_at: new Date("2025-04-20T04:34:58.138Z").toISOString(),
      purchase_year: 2025,
      purchase_month: 4,
    },
  ];

  beforeEach(() => {
    (fetchWithAuth as jest.Mock).mockClear();
  });

  test('renders "No purchases found" when no data is returned', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ purchases: [] }),
    });
    render(<PurchaseHistoryPage />);
    await waitFor(() =>
      expect(screen.getByText(/No purchases found/i)).toBeInTheDocument()
    );
  });

  test("renders purchase rows when data is returned", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ purchases: mockPurchases }),
    });
    render(<PurchaseHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/Test Dataset/i)).toBeInTheDocument();
      expect(screen.getByText(/Another Dataset/i)).toBeInTheDocument();
    });
  });

  test("calls fetchWithAuth with correct URL parameters when filters change", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ purchases: mockPurchases }),
    });
    render(<PurchaseHistoryPage />);

    // Change order to desc
    const orderSelect = screen.getByLabelText(/Order by/i);
    fireEvent.change(orderSelect, { target: { value: "desc" } });
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining("order=desc")
      );
    });

    // Change filter month to 3
    const filterMonthSelect = screen.getByLabelText(/Filter Month/i);
    fireEvent.change(filterMonthSelect, { target: { value: "3" } });
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining("filter_month=3")
      );
    });

    // Change filter year to 2025
    const filterYearInput = screen.getByLabelText(/Filter Year/i);
    fireEvent.change(filterYearInput, { target: { value: "2025" } });
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining("filter_year=2025")
      );
    });
  });

  test("clears filters when Clear Filters button is clicked", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ purchases: mockPurchases }),
    });
    render(<PurchaseHistoryPage />);

    const filterMonthSelect = screen.getByLabelText(/Filter Month/i) as HTMLSelectElement;
    const filterYearInput = screen.getByLabelText(/Filter Year/i) as HTMLInputElement;

    // Set filters.
    fireEvent.change(filterMonthSelect, { target: { value: "3" } });
    fireEvent.change(filterYearInput, { target: { value: "2022" } });
    expect(filterMonthSelect.value).toBe("3");
    expect(filterYearInput.value).toBe("2022");

    // Click clear filters
    const clearButton = screen.getByText(/Clear Filters/i);
    fireEvent.click(clearButton);

    expect(filterMonthSelect.value).toBe("");
    expect(filterYearInput.value).toBe("");
  });
});
