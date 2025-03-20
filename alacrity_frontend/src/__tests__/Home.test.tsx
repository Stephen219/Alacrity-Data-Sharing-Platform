import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("@/components/Landing/LandingPage", () => {
  const MockLandingPage = () => <div data-testid="landing-page">Landing Page Content</div>;
  MockLandingPage.displayName = "LandingPage";
  return MockLandingPage;
});

jest.mock("@/components/Landing/LandingRow2", () => {
  const MockLandingRow2 = () => <div data-testid="landing-row2">Landing Row 2 Content</div>;
  MockLandingRow2.displayName = "LandingRow2";
  return MockLandingRow2;
});

jest.mock("@/components/Landing/LandingRow3", () => {
  const MockLandingRow3 = () => <div data-testid="landing-row3">Landing Row 3 Content</div>;
  MockLandingRow3.displayName = "LandingRow3";
  return MockLandingRow3;
});

jest.mock("@/components/Landing/popularResearch", () => {
  const MockTrendingResearchCarousel = () => (
    <div data-testid="trending-research-carousel">Trending Research Carousel Content</div>
  );
  MockTrendingResearchCarousel.displayName = "TrendingResearchCarousel";
  return MockTrendingResearchCarousel;
});

describe("Home Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  test("renders the LandingPage component", () => {
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  test("renders the TrendingResearchCarousel component", () => {
    expect(screen.getByTestId("trending-research-carousel")).toBeInTheDocument();
  });

  test("renders the LandingRow2 component", () => {
    expect(screen.getByTestId("landing-row2")).toBeInTheDocument();
  });

  test("renders the LandingRow3 component", () => {
    expect(screen.getByTestId("landing-row3")).toBeInTheDocument();
  });
});
