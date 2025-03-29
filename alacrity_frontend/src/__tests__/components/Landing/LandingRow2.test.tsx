import { render, screen } from "@testing-library/react";
import LandingPage2 from "@/components/Landing/LandingRow2";

// Mock the chart component
jest.mock("@/components/ui/BarChart", () => {
  const BarChartMock = () => <div data-testid="bar-chart">BarChart Component</div>;
  BarChartMock.displayName = "BarChartMock";
  return BarChartMock;
});

describe("LandingPage2 Component", () => {
  test("renders main container and content", () => {
    const { container } = render(<LandingPage2 />);
    
    // Check that the main outer container exists
    expect(container.querySelector("div.relative.w-full")).toBeInTheDocument();

    // Check that the heading is rendered and contains the expected text
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Our industry-leading/i);

    // Check that the <span> with features has the styling 
    const span = screen.getByText("features");
    expect(span).toHaveClass("text-orange-600");

    // Checks that the descriptive paragraph is present
    expect(
      screen.getByText(/We make data-driven innovation faster, safer, and smarter/i)
    ).toBeInTheDocument();

    // Verify that the mocked chart component is rendered
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  test("renders list items with Award icons", () => {
    const { container } = render(<LandingPage2 />);
    
    // Ensure there are exactly 3 list items in the unordered list
    const listItems = container.querySelectorAll("ul > li");
    expect(listItems.length).toBe(3);

    // For each list item, verify that: an SVG element is present and theres text content
    listItems.forEach((item) => {
      expect(item.querySelector("svg")).toBeInTheDocument();
      expect(item.textContent).toBeTruthy();
    });
  });
});
