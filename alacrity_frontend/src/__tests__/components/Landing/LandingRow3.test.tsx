import { render, screen, waitFor } from "@testing-library/react";
import LandingPage3 from "@/components/Landing/LandingRow3";
import { BACKEND_URL } from "@/config";

// Mock the chart component 
jest.mock("@/components/ui/LineChart", () => {
  const LineChartMock = () => <div data-testid="line-chart">LineChart Component</div>;
  LineChartMock.displayName = "LineChartMock";
  return LineChartMock;
});

describe("LandingPage3 Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders main content correctly and calls fetch on mount", async () => {
    const mockData = {
      months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      organizations: [2000, 2100, 1900, 2200, 2050, 2150],
      researchers: [800, 900, 750, 850, 900, 950],
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    render(<LandingPage3 />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Sign up/i);
    expect(screen.getByText(/Ready to make an impact/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign Up/i })).toHaveAttribute("href", "/auth/sign-up");
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    // Verify fetch was called with the correct URL
    expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/users/monthly-users/`);

    // Wait for the asynchronous fetch to complete
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  test("handles fetch error gracefully by logging to console", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<LandingPage3 />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Wait for the error catch in useEffect to log the error message
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch data", expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
