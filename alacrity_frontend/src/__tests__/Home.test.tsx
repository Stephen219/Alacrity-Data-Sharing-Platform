import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("@/components/Charts", () => {
  const MockCharts = () => <div data-testid="charts" />;
  MockCharts.displayName = "Charts";
  return MockCharts;
});

jest.mock("@/components/ui/BarChart", () => {
  const MockBarChart = () => <div data-testid="bar-chart" />;
  MockBarChart.displayName = "BarChart";
  return MockBarChart;
});

jest.mock("@/components/ui/PieChart", () => {
  const MockPieChart = () => <div data-testid="pie-chart" />;
  MockPieChart.displayName = "PieChart";
  return MockPieChart;
});

jest.mock("@/components/ui/button", () => {
  const MockButton = ({ children }: { children: React.ReactNode }) => <button>{children}</button>;
  MockButton.displayName = "Button";
  return {
    Button: MockButton,
    buttonVariants: () => "mock-button-class",
  };
});

jest.mock("@/components/MaxWidthWrapper", () => {
  const MockMaxWidthWrapper = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="max-width-wrapper">{children}</div>
  );
  MockMaxWidthWrapper.displayName = "MaxWidthWrapper";
  return MockMaxWidthWrapper;
});

jest.mock("@/components/LandingPage", () => {
  const MockLandingPage = () => (
    <div data-testid="landing-page">
      <h1>Your favourite platform for secure data collaboration</h1>
      <p>The fastest way for organisations to upload, manage, and share datasets</p>
    </div>
  );
  MockLandingPage.displayName = "LandingPage";
  return MockLandingPage;
});

describe("Home Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  test("renders the main heading", () => {
    expect(
      screen.getByRole("heading", { name: /your favourite platform for secure data collaboration/i })
    ).toBeInTheDocument();
  });

  test("renders the welcome message", () => {
    expect(
      screen.getByText(/the fastest way for organisations to upload, manage, and share datasets/i)
    ).toBeInTheDocument();
  });

  test("renders the 'Social Media' button", () => {
    const socialButton = screen.getByRole("button", { name: /social media/i });
    expect(socialButton).toBeInTheDocument();
  });

  test("renders the 'About Us' button", async () => {
    const uploadLink = screen.getByRole("link", { name: /about us/i });
    expect(uploadLink).toBeInTheDocument();
  });
});